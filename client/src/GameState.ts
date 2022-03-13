import { Socket } from "socket.io-client";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { BOARD_SIZE } from "common/shared";
import { ToServerEvents, ToClientEvents } from "common/messages/game";
import { cloneDeep } from "lodash";

type GameSocket = Socket<ToClientEvents, ToServerEvents>;

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket: GameSocket;

    // board contains all placed monominoes (tiles)
    board: Array<Array<TetrominoType | null>>;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server, ordered by increasing, circular player numbers
    // i.e. if you are player 1, these are of player 2, then 3, then 0
    otherTetrominoes: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    private newBoard() {
        const board = new Array(BOARD_SIZE);
        for (let r = 0; r < BOARD_SIZE; r++) {
            board[r] = new Array(BOARD_SIZE).fill(null);
        }

        const centerTopLeft = BOARD_SIZE / 2 - 1;
        board[centerTopLeft][centerTopLeft] = TetrominoType.O;
        board[centerTopLeft + 1][centerTopLeft] = TetrominoType.O;
        board[centerTopLeft][centerTopLeft + 1] = TetrominoType.O;
        board[centerTopLeft + 1][centerTopLeft + 1] = TetrominoType.O;
        return board;
    }

    private getPlayerIndex(playerId: number) {
        return (3 - this.playerId + playerId) % 4;
    }

    constructor(socket: GameSocket) {
        this.socket = socket;
        this.board = this.newBoard();

        this.currentTetromino = new Tetromino(TetrominoType.T);
        // other player's moving piece, TODO this is synchronized with the server
        // how they are rendered is not concerned.
        this.otherTetrominoes = [
            // FIXME not good?
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
        ];

        // initial rotation
        this.otherTetrominoes.map((tetro, i) => {
            tetro.setRotatedPosition(tetro.position, i + 1);
            tetro.setRotation(i + 1);
        });

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
        });

        this.socket.on("playerMove", (playerId, state) => {
            const i = this.getPlayerIndex(playerId);
            Tetromino.updateFromState(this.otherTetrominoes[i], state, i + 1);
        });

        this.socket.on("playerPlace", (playerId, state) => {
            // place the tetro on our board
            const i = this.getPlayerIndex(playerId);
            const tetroToPlace = this.otherTetrominoes[i];
            Tetromino.updateFromState(tetroToPlace, state, i + 1);
            this.placeTetromino(tetroToPlace);
            this.otherTetrominoes[i] = tetroToPlace;

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
        this.currentTetromino.respawn();
        // broadcast new tetromino position
        this.emitPlayerMove();
    }

    public placeTetromino(tetromino: Tetromino) {
        tetromino.tiles.forEach((tile) => {
            const [row, col] = [
                tetromino.position[0] + tile[0],
                tetromino.position[1] + tile[1],
            ];
            this.board[row][col] = tetromino.type;
        });
    }

    public moveIfCan(
        movement: (tetro: Tetromino) => Tetromino | void
    ): boolean {
        let newTetro: Tetromino = cloneDeep(this.currentTetromino);

        // look-ahead for the next tetromino state after movement
        newTetro = movement(newTetro) || newTetro;

        if (
            this.overlapWithBoard(newTetro, this.currentTetromino) ||
            this.overlapWithPlayers(newTetro, this.otherTetrominoes)
        ) {
            return false;
        }

        this.currentTetromino.position = newTetro.position;
        this.currentTetromino.tiles = newTetro.tiles;
        this.currentTetromino.rotation = newTetro.rotation;
        this.currentTetromino.type = newTetro.type;
        return true;
    }

    /**
     * check against static board, see if newTetro is overlapping with static monominoes placed on board
     * @returns boolean - if `newTetro` overlaps with any blocks on the board
     */
    private overlapWithBoard(
        newTetro: Tetromino,
        oldTetro: Tetromino
    ): boolean {
        const oldTileCoords = oldTetro.tiles.map((tile) => [
            oldTetro.position[0] + tile[0],
            oldTetro.position[1] + tile[1],
        ]);
        for (let i = 0; i < newTetro.tiles.length; i++) {
            const [row, col] = newTetro.tiles[i];

            // conditions to check if there is something there already
            // there is a tile already
            const tileIsOccupied =
                this.board[newTetro.position[0] + row][
                    newTetro.position[1] + col
                ] != null;

            // the tile is not part of the old tetromino
            const tileIsForeign = !oldTileCoords.some(
                ([oldRow, oldCol]) =>
                    newTetro.position[0] + row == oldRow &&
                    newTetro.position[1] + col == oldCol
            );
            if (tileIsOccupied && tileIsForeign) {
                return true;
            }
        }
        return false;
    }

    /**
     * check against other players' tetrominoes: see if newTetro is overlapping with other existing players
     * @returns boolean - if `newTetro` overlaps with any of the `tetrominoes`
     */
    private overlapWithPlayers(
        newTetro: Tetromino,
        tetrominoes: Array<Tetromino>
    ): boolean {
        const newTileCoords = newTetro.tiles.map((tile) => [
            newTetro.position[0] + tile[0],
            newTetro.position[1] + tile[1],
        ]);

        return tetrominoes.some((tetro) => {
            // if the bounding boxes are more than the-maximum-"manhattan distance" away
            const isFarAway =
                Math.abs(tetro.position[0] - newTetro.position[0]) +
                    Math.abs(tetro.position[1] - newTetro.position[1]) >
                8; // 8 is twice the max width of a tetromino bounding box
            if (isFarAway) {
                return false;
            }

            // if newTetro has overlapping monominoes with those tetro
            const isOverLapping = tetro.tiles
                // get coordinates on board
                .map((tile) => [
                    tetro.position[0] + tile[0],
                    tetro.position[1] + tile[1],
                ])
                // each of those coordinates does not overlap with newTetro's coordinates
                .some((tileCoord) => {
                    return newTileCoords.some(
                        ([row, col]) =>
                            row === tileCoord[0] && col === tileCoord[1]
                    );
                });
            if (isOverLapping) {
                return true;
            }
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
        const oldTiles = tetro.tiles;
        const newTiles = cloneDeep(oldTiles);
        const shapeWidth = Tetromino.shapes[tetro.type].width;

        const expandedTetro = cloneDeep(tetro);
        // expand the tetromino by 1
        // NOTE: careful about when the position of tetro is [0, 0], the resulting calculated board coordinates will exceed matrix border. BUT, this won't happen because we block corners with walls.
        for (let row = -1; row <= shapeWidth; row++) {
            for (let col = -1; col <= shapeWidth; col++) {
                if (adjacentToMonomino(row, col, oldTiles)) {
                    newTiles.push([row, col]);
                }
            }
        }
        expandedTetro.tiles = newTiles;

        // if the expanded tetromino is overlapping, then it's definitely adjacent, if not actually overlapping. (We don't have to care about excluding the actually overlapped case because that handles more scenarios when synchronization is not ideal.)
        return this.overlapWithPlayers(expandedTetro, tetrominoes);

        // Returns true if a coordinate is "adjacent" to the tiles
        function adjacentToMonomino(
            row: number,
            col: number,
            tiles: [number, number][]
        ): boolean {
            return tiles.some(([tileRow, tileCol]) => {
                return (
                    (Math.abs(row - tileRow) === 1 &&
                        Math.abs(col - tileCol) === 0) ||
                    (Math.abs(row - tileRow) === 0 &&
                        Math.abs(col - tileCol) === 1)
                );
            });
        }
    }
}
