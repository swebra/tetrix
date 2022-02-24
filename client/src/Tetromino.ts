import { TetrominoType } from "common/TetrominoType";
import { BOARD_SIZE } from "common/shared";
import { TetrominoState } from "common/message";
import { rotateCoords } from "./utils"
import { cloneDeep } from "lodash";

type Shape = {
    width: number;
    tiles: Array<[number, number]>;
};

export class Tetromino {
    static readonly shapes: {[key in TetrominoType]: Shape} = {
        [TetrominoType.I]: {width: 4, tiles: [[1, 0], [1, 1], [1, 2], [1, 3]]},
        [TetrominoType.J]: {width: 3, tiles: [[0, 0], [1, 0], [1, 1], [1, 2]]},
        [TetrominoType.L]: {width: 3, tiles: [[0, 2], [1, 0], [1, 1], [1, 2]]},
        [TetrominoType.O]: {width: 2, tiles: [[0, 0], [0, 1], [1, 0], [1, 1]]},
        [TetrominoType.S]: {width: 3, tiles: [[0, 1], [0, 2], [1, 0], [1, 1]]},
        [TetrominoType.T]: {width: 3, tiles: [[0, 1], [1, 0], [1, 1], [1, 2]]},
        [TetrominoType.Z]: {width: 3, tiles: [[0, 0], [0, 1], [1, 1], [1, 2]]}
    };

    type: TetrominoType;
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    cells: Array<[number, number]>;

    constructor(type: TetrominoType) {
        this.type = type;
        this.cells = cloneDeep(Tetromino.shapes[type].tiles);
        this.position = [0, Math.round((BOARD_SIZE - Tetromino.shapes[type].width) / 2)];
        this.rotation = 0; // default (no rotation)
    }

    reportPosition(): TetrominoState {
        return {
            type: this.type,
            position: this.position,
            rotation: this.rotation,
        };
    }

    setType(type: TetrominoType) {
        if (this.type == type) { return; }
        this.type = type;
        this.cells = cloneDeep(Tetromino.shapes[type].tiles);
    }

    setRotatedPosition(position: [number, number], ccRotations: number) {
        ccRotations %= 4;
        let [row, col] = rotateCoords(position, BOARD_SIZE, ccRotations);
        // Compensate for position needing to be at top left
        let adjustment = Tetromino.shapes[this.type].width - 1;
        if (ccRotations == 1 || ccRotations == 2) {
            col -= adjustment;
        }
        if (ccRotations == 3 || ccRotations == 2) {
            row -= adjustment;
        }
        this.position = [row, col];
    }

    setRotation(rotation: number): boolean {
        if (!this.canRotate()) { return false; }
        if (this.rotation == rotation % 4) { return true; }
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = rotateCoords(
                this.cells[i],
                Tetromino.shapes[this.type].width,
                4 - this.rotation + rotation // circular distance
            );
        }
        this.rotation = <0 | 1 | 2 | 3> (rotation % 4);
        return true;
    }

    rotateCW(): boolean {
        return this.setRotation(this.rotation + 1);
    }

    rotateCCW(): boolean {
        return this.setRotation(4 + this.rotation - 1);
    }

    // TODO
    private canRotate(): boolean {
        return true;
    }
}
