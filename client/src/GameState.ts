import { Socket } from "socket.io-client";

import { BOARD_SIZE, WALL_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";
import { ToServerEvents, ToClientEvents } from "common/messages/game";

import { Tetromino, TetrominoLookahead } from "./Tetromino";
import { Monomino } from "./Monomino";
import { RandomBag } from "./RandomBag";

type GameSocket = Socket<ToClientEvents, ToServerEvents>;

enum LineCheckAxis {
    Row,
    Column,
}

type LineCheckTask = {
    axis: LineCheckAxis;
    direction: -1 | 1;
    range: Array<number>;
};

export class GameState {
    socket: GameSocket;
    // false indicates the corner area that pieces cannot enter
    board!: Array<Array<Monomino | false | null>>;
    randomBag: RandomBag;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server, ordered by increasing, circular player numbers
    // i.e. if you are player 1, these are of player 2, then 3, then 0
    otherTetrominoes: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    lineCheckSequence!: Array<LineCheckTask>;
    // template used to generate lineCheckSequence once playerId is received
    static LineCheckTemplate: Array<LineCheckTask> = [
        {
            axis: LineCheckAxis.Row,
            direction: 1,
            range: [],
        },
        {
            axis: LineCheckAxis.Column,
            direction: -1,
            range: [],
        },
        {
            axis: LineCheckAxis.Row,
            direction: -1,
            range: [],
        },
        {
            axis: LineCheckAxis.Column,
            direction: 1,
            range: [],
        },
    ];

    private generateLineCheckSequence(
        playerId: number = 0
    ): Array<LineCheckTask> {
        const sequence = GameState.LineCheckTemplate;
        const distanceToPlayer0 = (4 - playerId) % 4;
        // rotate the line checking sequence to always start from player 0
        [...Array(distanceToPlayer0).keys()].forEach((_) => {
            sequence.push(sequence.shift()!);
        });

        // for each task, generate the range of lines to check with, i.e. rows from top to center (before rotation)
        // e.g. for current player it will be [0..19], for opposite it's [39..20]
        return sequence.map(({ axis, direction }) => {
            let range = [...Array(BOARD_SIZE / 2).keys()].map(
                (i) => BOARD_SIZE - 1 + i * direction
            );
            if (direction === 1) range = range.map((x) => (x + 1) % BOARD_SIZE);
            return { axis, direction, range };
        });
    }

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

        // generate walls
        // 0..14 and 25..39
        const [rangeStart, rangeEnd] = [
            [...Array(WALL_SIZE).keys()],
            [...Array(WALL_SIZE).keys()].map((x) => x + WALL_SIZE + 10),
        ];
        [rangeStart, rangeEnd].forEach((rangeRow) => {
            [rangeStart, rangeEnd].forEach((rangeCol) => {
                for (const row of rangeRow) {
                    for (const col of rangeCol) {
                        this.board[row][col] = false;
                    }
                }
            });
        });
    }

    private getPlayerIndex(playerId: number) {
        return (3 - this.playerId + playerId) % 4;
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
        ];
        this.lineCheckSequence = this.generateLineCheckSequence(0);

        // initial rotation
        this.otherTetrominoes.forEach((tetro, i) => {
            tetro.setRotatedPosition(tetro.position, i + 1);
            tetro.updateFromLookahead(Tetromino.rotate(tetro, i + 1));
        });

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
            this.currentTetromino.setOwnerId(playerId);
            this.otherTetrominoes.forEach((tetromino, i) =>
                tetromino.setOwnerId(<0 | 1 | 2 | 3>((playerId + i + 1) % 4))
            );

            this.lineCheckSequence = this.generateLineCheckSequence(playerId);
        });

        this.socket.on("playerMove", (playerId, state) => {
            const i = this.getPlayerIndex(playerId);
            this.otherTetrominoes[i].updateFromState(state, i + 1);
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

            this.updateLineClearing();
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

    public updateLineClearing() {
        // check from all four directions, starting from player 0 clockwise
        if (this.playerId === null) {
            return; // NOTE this unlikely to happen
        }

        this.lineCheckSequence.forEach((task) => {
            const linesToClear = this.scanLinesToClear(task);
            if (linesToClear.length === 0) {
                return;
            }
            // create a map to record by how much we should fall/offset each lines after removing
            const linesToFall = this.prepareLinesToFall(task, linesToClear);
            this.removeLines(task, linesToClear);
            this.fallLines(task, linesToFall);

            // TODO scoring
        });
    }

    private removeLines(task: LineCheckTask, linesToClear: Array<number>) {
        if (task.axis === LineCheckAxis.Row) {
            for (const row of task.range) {
                // scan through each row
                if (linesToClear.includes(row)) {
                    for (let col = 15; col < 25; col++) {
                        const monominoToRemove = this.board[row][col];
                        if (monominoToRemove) {
                            monominoToRemove.destroy();
                        }
                        this.board[row][col] = null;
                    }
                }
            }
        } else if (task.axis === LineCheckAxis.Column) {
            for (const col of task.range) {
                // scan through each col
                if (linesToClear.includes(col)) {
                    for (let row = 15; row < 25; row++) {
                        const monominoToRemove = this.board[row][col];
                        if (monominoToRemove) {
                            monominoToRemove.destroy();
                        }
                        this.board[row][col] = null;
                    }
                }
            }
        }
    }

    private fallLines(task: LineCheckTask, linesToFall: Map<number, number>) {
        task.range
            .slice()
            .reverse()
            .forEach((lineIndex) => {
                if (task.axis === LineCheckAxis.Row) {
                    const offset =
                        task.direction * (linesToFall.get(lineIndex) || 0);
                    if (offset === 0) {
                        return;
                    }
                    const newRow = lineIndex + offset;

                    // swap line with the offset destination line
                    // the old line should always be null since it's cleared/propagated
                    for (let col = 15; col < 25; col++) {
                        this.board[newRow][col] = this.board[lineIndex][col];
                        this.board[lineIndex][col] = null;
                        const newMonomino = this.board[newRow][col];
                        if (newMonomino) {
                            newMonomino.position[0] = newRow;
                        }
                    }
                } else if (task.axis === LineCheckAxis.Column) {
                    const offset =
                        task.direction * (linesToFall.get(lineIndex) || 0);
                    if (offset === 0) {
                        return;
                    }
                    const newCol = lineIndex + offset;

                    for (let row = 15; row < 25; row++) {
                        this.board[row][newCol] = this.board[row][lineIndex];
                        this.board[row][lineIndex] = null;
                        const newMonomino = this.board[row][newCol];
                        if (newMonomino) {
                            newMonomino.position[1] = newCol;
                        }
                    }
                }
            });
    }

    private prepareLinesToFall(
        task: LineCheckTask,
        linesToClear: Array<number>
    ): Map<number, number> {
        const linesOffset = new Map<number, number>();
        let offset = 0;
        if (linesToClear.length > 0) {
            task.range
                .slice()
                .reverse()
                .forEach((lineIndex) => {
                    if (lineIndex === linesToClear?.at(0)) {
                        // this line is an empty, cleared line. all lines above should fall with one more offset
                        offset += 1;
                        linesToClear.push(linesToClear.shift()!);
                    } else {
                        linesOffset.set(lineIndex, offset);
                    }
                });
        }
        return linesOffset;
    }

    private scanLinesToClear(task: LineCheckTask): Array<number> {
        const linesToClear = [];
        if (task.axis === LineCheckAxis.Row) {
            for (const row of task.range) {
                // scan through each row
                let canClear = true;
                for (let col = 15; col < 25; col++) {
                    if (this.board && this.board[row][col] === null) {
                        canClear = false;
                        break;
                    }
                }
                if (canClear) {
                    linesToClear.push(row);
                }
            }
        } else if (task.axis === LineCheckAxis.Column) {
            for (const col of task.range) {
                // scan through each col
                let canClear = true;
                for (let row = 15; row < 25; row++) {
                    if (this.board && this.board[row][col] === null) {
                        canClear = false;
                        break;
                    }
                }
                if (canClear) {
                    linesToClear.push(col);
                }
            }
        }

        return linesToClear.reverse();
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
