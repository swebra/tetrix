import { TetrominoType } from "common/TetrominoType";
import { BOARD_SIZE } from "common/shared";
import { TetrominoState } from "common/message";

export class Tetromino {
    type: TetrominoType;
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    // individual square blocks inside a 3x3 virtual block containing the tetromino. ideally it should be 4x4? not sure if we want to go with this.
    // TODO rotate happens here? (matrix rotation)
    cells: Array<[number, number]>;

    constructor(type: TetrominoType) {
        this.type = type;
        this.position = [0, Math.round(BOARD_SIZE / 2) - 2]; // TODO hardcoded to the middle (10/2)
        this.rotation = 0; // default (no rotation)
        this.cells = [
            // TODO generate based on type
            [2, 0],
            [2, 1],
            [2, 2],
            [1, 1],
        ];
    }

    reportPosition(): TetrominoState {
        return {
            position: this.position,
            rotation: this.rotation,
            type: this.type,
        };
    }
}
