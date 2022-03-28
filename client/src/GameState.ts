import { Socket } from "socket.io-client";

import { BoardState, BOARD_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";
import { ToServerEvents, ToClientEvents } from "common/messages/game";

import { Tetromino, TetrominoLookahead } from "./Tetromino";
import { Monomino } from "./Monomino";
import { RandomBag } from "./RandomBag";

type GameSocket = Socket<ToClientEvents, ToServerEvents>;

export class GameState {
    socket: GameSocket;
    board!: Array<Array<Monomino | null | false>>;
    randomBag: RandomBag;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server, ordered by increasing, circular player numbers
    // i.e. if you are player 1, these are of player 2, then 3, then 0
    otherTetrominoes: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    private initBoard() {
        this.board = new Array(BOARD_SIZE);
        for (let r = 0; r < BOARD_SIZE; r++) {
            this.board[r] = new Array(BOARD_SIZE).fill(null);
        }

        const centerTopLeft = BOARD_SIZE / 2 - 1;
        [0, 1].forEach((row_off) => {
            [0, 1].forEach((col_off) => {
                const row = centerTopLeft + row_off;
                const col = centerTopLeft + col_off;
                this.board[row][col] = new Monomino(
                    TetrominoType.O,
                    [row, col],
                    null
                );
            });
        });
    }

    private getPlayerIndex(playerId: number) {
        return (3 - (this.playerId || 0) + playerId) % 4;
    }

    public toBoardState(): BoardState {
        const board = this.board.map((row) => {
            return row.map((el) => {
                if (!el) {
                    return el;
                }
                return el.toMonominoState();
            });
        });

        const reverseRotations = (this.playerId || 0) % 4;
        const boardFromPlayer0 = board.map((row) => row.slice());
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const [newRow, newCol] = Tetromino.rotateCoords(
                    [row, col],
                    BOARD_SIZE,
                    reverseRotations
                );
                boardFromPlayer0[newRow][newCol] = board[row][col];
                const newBlock = boardFromPlayer0[newRow][newCol];
                if (newBlock) {
                    newBlock.position = [newRow, newCol];
                }
            }
        }
        return boardFromPlayer0;
    }

    public fromBoardState(boardState: BoardState) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const monominoState = boardState[row][col];
                if (!monominoState) {
                    this.board[row][col] = monominoState;
                } else {
                    this.board[row][col] = Monomino.upcreateFromMonominoState(
                        monominoState,
                        this.board[row][col]
                    )[0];
                }
            }
        }
    }

    constructor(socket: GameSocket) {
        this.socket = socket;
        this.initBoard();
        this.randomBag = new RandomBag();

        // Owner ID set on initPlayer
        this.currentTetromino = new Tetromino(
            this.randomBag.getNextType(),
            null
        );
        this.otherTetrominoes = [
            // TODO: perhaps avoid initializing until we know peers' types?
            new Tetromino(TetrominoType.T, null),
            new Tetromino(TetrominoType.T, null),
            new Tetromino(TetrominoType.T, null),
            new Tetromino(TetrominoType.T, null), // this tetromino will be eliminated once current client is assigned a playerId
        ];

        // initial rotation
        this.otherTetrominoes.forEach((tetro, i) => {
            tetro.setRotatedPosition(tetro.position, i + 1);
            tetro.updateFromLookahead(Tetromino.rotate(tetro, i + 1));
        });

        this.socket.on(
            "cacheBoard",
            (callback: (boardState: BoardState) => void) => {
                callback(this.toBoardState());
            }
        );

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
            this.currentTetromino.setOwnerId(playerId);
            if (this.otherTetrominoes.length > 3) {
                this.otherTetrominoes.pop();
            }
            this.otherTetrominoes.forEach((tetromino, i) =>
                tetromino.setOwnerId(<0 | 1 | 2 | 3>((playerId + i + 1) % 4))
            );
        });

        this.socket.on("playerMove", (playerId, state) => {
            const i = this.getPlayerIndex(playerId);
            this.otherTetrominoes[i].updateFromState(state, i + 1);
            if (this.otherTetrominoes[i].getOwnerId() !== playerId) {
                this.otherTetrominoes[i].setOwnerId(playerId);
            }
        });

        this.socket.on("playerPlace", (playerId, state) => {
            // place the tetro on our board
            const i = this.getPlayerIndex(playerId);
            const tetroToPlace = this.otherTetrominoes[i];
            tetroToPlace.updateFromState(state, i + 1);
            this.placeTetromino(tetroToPlace);
            tetroToPlace.dropSprites();

            // if the other tetromino is bumping into us, freeze ours too.
            if (
                this.adjacentWithPlayers(this.currentTetromino, [
                    this.otherTetrominoes[i],
                ])
            ) {
                this.emitAndPlaceCurrentTetromino();
            }
        });
    }

    public emitPlayerMove() {
        this.socket.emit(
            "playerMove",
            this.playerId,
            this.currentTetromino.reportState()
        );
    }

    public emitAndPlaceCurrentTetromino() {
        // place on board and emit events to the server
        this.socket.emit(
            "playerPlace",
            this.playerId,
            this.currentTetromino.reportState()
        );
        this.placeTetromino(this.currentTetromino);
        // start a new tetromino from the top
        this.currentTetromino = new Tetromino(
            this.randomBag.getNextType(),
            this.playerId
        );
        // broadcast new tetromino position
        this.emitPlayerMove();
    }

    public placeTetromino(tetromino: Tetromino) {
        tetromino.monominoes.forEach((monomino) => {
            this.board[monomino.position[0]][monomino.position[1]] = monomino;
        });
    }

    public moveIfCan(
        movement: (tetro: Tetromino) => TetrominoLookahead
    ): boolean {
        // look-ahead for the next tetromino state after movement
        const lookahead = movement(this.currentTetromino);

        if (
            this.overlapWithBoard(lookahead) ||
            this.overlapWithPlayers(lookahead, this.otherTetrominoes)
        ) {
            return false;
        }

        this.currentTetromino.updateFromLookahead(lookahead);
        return true;
    }

    /**
     * check against static board, see if lookahead is overlapping with static monominoes placed on board
     * @returns boolean - if `lookahead` tiles overlaps with any blocks on the board
     */
    private overlapWithBoard(lookahead: TetrominoLookahead): boolean {
        return lookahead.tiles.some(([row, col]) => {
            return this.board[row][col] != null;
        });
    }

    /**
     * @returns True if the current Tetromino is in the opposite players section.
     */
    public isInOppositeSection() {
        return this.currentTetromino.position[0] >= 25;
    }

    /**
     * check against other players' tetrominoes: see if lookahead tiles is overlapping with other existing players
     * @returns boolean - if `lookahead` tiles overlap with any of the `tetrominoes`
     */
    private overlapWithPlayers(
        lookahead: TetrominoLookahead,
        tetrominoes: Array<Tetromino>
    ): boolean {
        return tetrominoes.some((tetro) => {
            // if the bounding boxes are more than the-maximum-"manhattan distance" away in any axis
            const isFarAway =
                Math.abs(tetro.position[0] - lookahead.position[0]) > 4 ||
                Math.abs(tetro.position[1] - lookahead.position[1]) > 4; // 4 is the max width of a tetromino bounding box
            if (isFarAway) {
                return false;
            }

            // if lookahead has overlapping monominoes with those tetro
            return tetro.monominoes.some((monomino) => {
                const [row, col] = monomino.position;
                return lookahead.tiles.some(
                    ([newRow, newCol]) => newRow === row && newCol === col
                );
            });
        });
    }

    /**
     * Returns if `tetro` is adjacent to any of the tetrominoes in the `tetrominoes` list
     * @param tetro - The tetromino that is supposedly "currentTetromino", but can be any tetromino to be tested
     * @param tetrominoes - The array of tetrominoes to be scanned through and looked for adjacentness
     */
    private adjacentWithPlayers(
        tetro: Tetromino,
        tetrominoes: Array<Tetromino>
    ): boolean {
        const lookahead = tetro.toTetrominoLookahead();

        // No out of bounds check because overlapWithPlayers doesn't index board
        lookahead.tiles = lookahead.tiles
            // insert tiles and their expanded positions
            // No out of bounds check because overlapWithPlayers doesn't index board
            .map(([row, col]) => {
                return [
                    [row, col],
                    [row + 1, col],
                    [row - 1, col],
                    [row, col + 1],
                    [row, col - 1],
                ];
            })
            // flatten
            .reduce((total, current) => [...total, ...current])
            // deduplicate
            .filter(
                (tile, index, tiles) =>
                    tiles.findIndex(
                        ([row, col]) => row === tile[0] && col === tile[1]
                    ) === index
            ) as [number, number][];

        // if the expanded tetromino is overlapping, then it's definitely adjacent, if not actually overlapping. (We don't have to care about excluding the actually overlapped case because that handles more scenarios when synchronization is not ideal.)
        return this.overlapWithPlayers(lookahead, tetrominoes);
    }
}
