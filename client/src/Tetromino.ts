import { TetrominoType } from "common/TetrominoType";
import { BOARD_SIZE } from "common/shared";
import { TetrominoState } from "common/message";
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

    /**
     * @param coords A `[row, column]` coordinate pair
     * @param size The grid size in which the coordinates exist
     * @param ccRotations The number of clockwise rotations to perform
     * @returns The rotated coordinates
     */
    static rotateCoords(coords: [number, number], size: number, ccRotations: number): [number, number] {
        let maxCoord = size - 1;
        switch (ccRotations % 4) {
            case 1: // 90 degree clockwise
                return [coords[1], maxCoord - coords[0]];
            case 2: // 180 degree
                return [maxCoord - coords[0], maxCoord - coords[1]];
            case 3: // 90 degree counterclockwise
                return [maxCoord - coords[1], coords[0]];
            default: // 0 degree
                return coords;
        }
    }

    type: TetrominoType;
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    tiles: Array<[number, number]>;

    constructor(type: TetrominoType) {
        this.type = type;
        this.tiles = cloneDeep(Tetromino.shapes[type].tiles);
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
        this.tiles = cloneDeep(Tetromino.shapes[type].tiles);
    }

    setRotatedPosition(position: [number, number], ccRotations: number) {
        ccRotations %= 4;
        let [row, col] = Tetromino.rotateCoords(position, BOARD_SIZE, ccRotations);
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

    setRotation(rotation: number) {
        if (this.rotation == rotation % 4) { return; }
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = Tetromino.rotateCoords(
                this.tiles[i],
                Tetromino.shapes[this.type].width,
                4 - this.rotation + rotation // circular distance
            );
        }
        this.rotation = <0 | 1 | 2 | 3> (rotation % 4);
    }

    // TODO: Properly verify movement is possible before allowing it
    move(colDelta: number): boolean {
        let newCol = this.position[1] + colDelta;
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
        if (!this.canRotate()) { return false; }
        this.setRotation(this.rotation + 1);
        return true;
    }

    rotateCCW(): boolean {
        if (!this.canRotate()) { return false; }
        this.setRotation(4 + this.rotation - 1);
        return true;
    }
}
