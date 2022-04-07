import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "../Tetromino";

describe("Test rotateCoords", () => {
    test("No rotation", () => {
        expect(Tetromino.rotateCoords([0, 4], 10, 4)).toEqual([0, 4]);
    });
    test("90CW: Right player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 1)).toEqual([39, 39]);
    });
    test("180: Down player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 2)).toEqual([39, 0]);
    });
    test("90CCW: Left player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 3)).toEqual([0, 0]);
    });
});

describe("Tetromino spawning", () => {
    let tetromino: Tetromino;

    beforeEach(() => {
        tetromino = new Tetromino(
            6, // T shape
            null
        );
    });

    it("[FR5 Spawn position] is at the horizontal center of the section", () => {
        expect(tetromino.position).toEqual([0, 19]);
    });

    it("[FR5 Spawn position] has the longest flat-side facing down", () => {
        [...Array(7).keys()].forEach((type) => {
            tetromino = new Tetromino(type, null);
            const tiles = tetromino.monominoes.map((monomino) => {
                const [row, col] = monomino.position;
                const [tetroRow, tetroCol] = tetromino.position;
                return [row - tetroRow, col - tetroCol];
            });

            expect(tiles).toStrictEqual(
                Tetromino.shapes[type as TetrominoType].tiles
            );

            let horizontalTileCount = Array(
                Tetromino.shapes[type as TetrominoType].width
            ).fill(0);

            for (const [row, _] of tiles) {
                horizontalTileCount[row] += 1;
            }

            horizontalTileCount = horizontalTileCount.filter(
                (count) => count > 0
            );

            // ensure that the very bottom row is the row with the most monominoes
            expect(Math.max(...horizontalTileCount)).toEqual(
                horizontalTileCount.pop()
            );
        });
    });
});
