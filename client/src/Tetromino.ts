import { TetrominoType } from "./TetrominoType";

export class Tetromino {
    type: TetrominoType;
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    // individual square blocks inside a 3x3 virtual block containing the tetromino. ideally it should be 4x4? not sure if we want to go with this.
    // TODO rotate happens here? (matrix rotation)
    cells: Array<[number, number]>;

    constructor(type: TetrominoType) {
        this.type = type;
        this.position = [0, 23]; // TODO hardcoded to the middle (50/2)
        this.rotation = 0; // default (no rotation)
        this.cells = [
            // TODO generate based on type
            [2, 0],
            [2, 1],
            [2, 2],
            [1, 1],
        ];
    }

    fall() {
        // TODO boundary checks
        this.position[0] += 1;
        if (this.position[0] > 50) this.position[0] = 0;
    }
}