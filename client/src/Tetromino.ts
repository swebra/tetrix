import { Scene } from "phaser";

import { BOARD_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";
import { TetrominoState } from "common/message";
import { Monomino } from "./Monomino";

type Shape = {
    width: number;
    tiles: Array<[number, number]>;
};

export type TetrominoLookahead = {
    position: [number, number];
    tiles: Array<[number, number]>;
    rotation: 0 | 1 | 2 | 3;
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

    public position: [number, number];
    public rotation: 0 | 1 | 2 | 3;
    private type!: TetrominoType;
    private ownerId: 0 | 1 | 2 | 3 | null;
    public monominoes!: Array<Monomino>;

    constructor(type: TetrominoType, ownerId: 0 | 1 | 2 | 3 | null) {
        this.position = [
            0,
            Math.round((BOARD_SIZE - Tetromino.shapes[type].width) / 2),
        ];
        this.ownerId = ownerId;
        this.setType(type);
        this.rotation = 0; // default (no rotation)
    }

    reportState(): TetrominoState {
        return {
            type: this.type,
            position: this.position,
            rotation: this.rotation,
        };
    }

    updateFromState(state: TetrominoState, ccRotations: number) {
        this.setType(state.type);
        this.setRotatedPosition(state.position, ccRotations);
        this.updateFromLookahead(
            Tetromino.rotate(this, ccRotations + state.rotation)
        );
    }

    toTetrominoLookahead(): TetrominoLookahead {
        return {
            position: [...this.position],
            tiles: this.monominoes.map((monomino) => monomino.position),
            rotation: this.rotation,
        };
    }

    updateFromLookahead(lookahead: TetrominoLookahead) {
        this.position = lookahead.position;
        this.rotation = lookahead.rotation;
        this.monominoes.forEach((monomino, i) => {
            monomino.position = lookahead.tiles[i];
        });
    }

    setType(type: TetrominoType) {
        if (this.type == type) {
            return;
        }
        if (this.monominoes) {
            this.monominoes.forEach((monomino) => monomino.destroy());
        }

        this.type = type;
        this.monominoes = Tetromino.shapes[type].tiles.map(
            ([row, col]) =>
                new Monomino(
                    this.type,
                    [this.position[0] + row, this.position[1] + col],
                    this.ownerId
                )
        );
        this.rotation = 0;
    }

    getOwnerId() {
        return this.ownerId;
    }

    setOwnerId(ownerId: 0 | 1 | 2 | 3) {
        this.ownerId = ownerId;
        this.monominoes.forEach((monomino) => monomino.setOwnerId(ownerId));
    }

    setRotatedPosition(position: [number, number], ccRotations: number) {
        ccRotations %= 4;
        let [newRow, newCol] = Tetromino.rotateCoords(
            position,
            BOARD_SIZE,
            ccRotations
        );
        // Compensate for position needing to be at top left
        const adjustment = Tetromino.shapes[this.type].width - 1;
        if (ccRotations == 1 || ccRotations == 2) {
            newCol -= adjustment;
        }
        if (ccRotations == 3 || ccRotations == 2) {
            newRow -= adjustment;
        }

        this.monominoes.forEach((monomino) => {
            monomino.position = [
                monomino.position[0] - this.position[0] + newRow,
                monomino.position[1] - this.position[1] + newCol,
            ];
        });
        this.position = [newRow, newCol];
    }

    dropSprites() {
        this.monominoes.forEach(
            (monomino, i) => (this.monominoes[i] = monomino.getCopy())
        );
    }

    draw(scene: Scene) {
        this.monominoes.forEach((monomino) => monomino.draw(scene));
    }

    static rotate(tetromino: Tetromino, rotation: number): TetrominoLookahead {
        const lookahead = tetromino.toTetrominoLookahead();
        if (tetromino.rotation == rotation % 4) {
            return lookahead;
        }

        lookahead.tiles = lookahead.tiles
            .map((tile) => {
                return Tetromino.rotateCoords(
                    [
                        tile[0] - lookahead.position[0],
                        tile[1] - lookahead.position[1],
                    ],
                    Tetromino.shapes[tetromino.type].width,
                    4 - lookahead.rotation + rotation // circular distance
                );
            })
            .map((tile) => {
                return [
                    tile[0] + lookahead.position[0],
                    tile[1] + lookahead.position[1],
                ];
            });
        lookahead.rotation = <0 | 1 | 2 | 3>(rotation % 4);
        return lookahead;
    }

    static rotateCW(tetromino: Tetromino): TetrominoLookahead {
        return Tetromino.rotate(tetromino, tetromino.rotation + 1);
    }

    static rotateCCW(tetromino: Tetromino): TetrominoLookahead {
        return Tetromino.rotate(tetromino, tetromino.rotation - 1);
    }

    static fall(tetromino: Tetromino): TetrominoLookahead {
        const lookahead = tetromino.toTetrominoLookahead();
        // fall down by 1
        lookahead.position[0] += 1;
        lookahead.tiles = lookahead.tiles.map(([row, col]) => [row + 1, col]);
        return lookahead;
    }

    static slide(direction: -1 | 1): (tetro: Tetromino) => TetrominoLookahead {
        // move left/right by 1
        return (tetromino) => {
            const lookahead = tetromino.toTetrominoLookahead();
            lookahead.position[1] += direction;
            lookahead.tiles = lookahead.tiles.map(([row, col]) => [
                row,
                col + direction,
            ]);
            return lookahead;
        };
    }
}
