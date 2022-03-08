import { TetrominoType } from "common/TetrominoType";
import { BOARD_SIZE } from "common/shared";
import { TetrominoState } from "common/message";
import { cloneDeep } from "lodash";

type Shape = {
    width: number;
    tiles: Array<[number, number]>;
};

export class Tetromino {
    static readonly shapes: { [key in TetrominoType]: Shape } = {
        [TetrominoType.I]: {
            width: 4,
            tiles: [
                [1, 0],
                [1, 1],
                [1, 2],
                [1, 3],
            ],
        },
        [TetrominoType.J]: {
            width: 3,
            tiles: [
                [0, 0],
                [1, 0],
                [1, 1],
                [1, 2],
            ],
        },
        [TetrominoType.L]: {
            width: 3,
            tiles: [
                [0, 2],
                [1, 0],
                [1, 1],
                [1, 2],
            ],
        },
        [TetrominoType.O]: {
            width: 2,
            tiles: [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ],
        },
        [TetrominoType.S]: {
            width: 3,
            tiles: [
                [0, 1],
                [0, 2],
                [1, 0],
                [1, 1],
            ],
        },
        [TetrominoType.T]: {
            width: 3,
            tiles: [
                [0, 1],
                [1, 0],
                [1, 1],
                [1, 2],
            ],
        },
        [TetrominoType.Z]: {
            width: 3,
            tiles: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 2],
            ],
        },
    };

    /**
     * @param coords A `[row, column]` coordinate pair
     * @param size The grid size in which the coordinates exist
     * @param ccRotations The number of clockwise rotations to perform
     * @returns The rotated coordinates
     */
    static rotateCoords(
        coords: [number, number],
        size: number,
        ccRotations: number
    ): [number, number] {
        const maxCoord = size - 1;
        switch (ccRotations % 4) {
            case 1: // 90 degree clockwise
                return [coords[1], maxCoord - coords[0]];
            case 2: // 180 degree
                return [maxCoord - coords[0], maxCoord - coords[1]];
            case 3: // 90 degree counterclockwise
                return [maxCoord - coords[1], coords[0]];
            default:
                // 0 degree
                return coords;
        }
    }

    type: TetrominoType;
    position: [number, number];
    rawPosition: [number, number];
    rotation: 0 | 1 | 2 | 3;
    tiles: Array<[number, number]>;

    constructor(type: TetrominoType) {
        this.type = type;
        this.tiles = cloneDeep(Tetromino.shapes[type].tiles);
        this.position = [
            0,
            Math.round((BOARD_SIZE - Tetromino.shapes[type].width) / 2),
        ];
        this.rawPosition = [
            0,
            Math.round((BOARD_SIZE - Tetromino.shapes[type].width) / 2),
        ];
        this.rotation = 0; // default (no rotation)
    }

    reportPosition(): TetrominoState {
        return {
            type: this.type,
            position: this.position,
            rotation: this.rotation,
        };
    }

    static createFromState(state: TetrominoState): Tetromino {
        const newTetro = new Tetromino(state.type);
        newTetro.position = state.position;
        newTetro.tiles = cloneDeep(Tetromino.shapes[state.type].tiles);
        newTetro.rotation = state.rotation;
        return newTetro;
    }

    setType(type: TetrominoType) {
        if (this.type == type) {
            return;
        }
        this.type = type;
        this.tiles = cloneDeep(Tetromino.shapes[type].tiles);
    }

    setRotatedPosition(position: [number, number], ccRotations: number) {
        ccRotations %= 4;
        let [row, col] = Tetromino.rotateCoords(
            position,
            BOARD_SIZE,
            ccRotations
        );
        // Compensate for position needing to be at top left
        const adjustment = Tetromino.shapes[this.type].width - 1;
        if (ccRotations == 1 || ccRotations == 2) {
            col -= adjustment;
        }
        if (ccRotations == 3 || ccRotations == 2) {
            row -= adjustment;
        }
        this.position = [row, col];
    }

    setRotation(rotation: number) {
        if (this.rotation == rotation % 4) {
            return;
        }
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = Tetromino.rotateCoords(
                this.tiles[i],
                Tetromino.shapes[this.type].width,
                4 - this.rotation + rotation // circular distance
            );
        }
        this.rotation = <0 | 1 | 2 | 3>(rotation % 4);
    }

    // TODO: Properly verify movement is possible before allowing it
    move(colDelta: number): boolean {
        const newCol = this.position[1] + colDelta;
        if (newCol < 0 || newCol >= BOARD_SIZE) {
            return false;
        }
        this.position[1] = newCol;
        return true;
    }

    // TODO: Verify rotation is possible before allowing it
    private canRotate(): boolean {
        return true;
    }

    rotateCW(): boolean {
        if (!this.canRotate()) {
            return false;
        }
        this.setRotation(this.rotation + 1);
        return true;
    }

    rotateCCW(): boolean {
        if (!this.canRotate()) {
            return false;
        }
        this.setRotation(4 + this.rotation - 1);
        return true;
    }

    canTetroFall(board: Array<Array<TetrominoType | null>>): boolean {
        // if the blocks right below this tetro are all empty, it can fall.
        const bottomRelative = Math.max(...this.tiles.map((tile) => tile[0])); // the lowest block in the tetro tiles, ranging from 0-3
        const bottomAbsolute = this.position[0] + bottomRelative; // the row of which the lowest block of the tetro is at in the board

        if (bottomAbsolute + 1 >= board.length) return false;

        return this.tiles.every(
            (tile: any) =>
                tile[0] < bottomRelative || // either the tile is not the bottom tiles which we don't care
                board[bottomAbsolute + 1][this.position[1] + tile[1]] == null // or the room below it has to be empty
        );
    }

    moveIfCan(
        board: Array<Array<TetrominoType | null>>,
        movement: (tetro: Tetromino) => Tetromino | void
    ): boolean {
        let newTetro: Tetromino = cloneDeep(this);
        const oldTileCoords = newTetro.tiles.map((tile) => [
            newTetro.position[0] + tile[0],
            newTetro.position[1] + tile[1],
        ]);

        // look-ahead for the next tetromino state after movement
        newTetro = movement(newTetro) || newTetro;
        for (let i = 0; i < this.tiles.length; i++) {
            const [row, col] = newTetro.tiles[i];

            if (
                // 1. the new position has some other tiles in it
                board[newTetro.position[0] + row][newTetro.position[1] + col] !=
                    null &&
                // AND 2. the tiles are NOT from the old self
                // TODO falling out of bounds
                !oldTileCoords.some(
                    ([oldRow, oldCol]) =>
                        newTetro.position[0] + row == oldRow &&
                        newTetro.position[1] + col == oldCol
                )
            ) {
                return false;
            }
        }
        // copy all attributes over
        this.position = newTetro.position;
        this.tiles = newTetro.tiles;
        this.rotation = newTetro.rotation;
        this.type = newTetro.type;
        this.rawPosition = newTetro.rawPosition;
        return true;
    }
}
