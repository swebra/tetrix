import { Tetromino } from "../Tetromino";

describe("Test rotateCoords", () => {
    test("No rotation", () => {
        expect(Tetromino.rotateCoords([0, 4], 10, 4)).toEqual([0, 4])
    });
    test("90CW: Right player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 1)).toEqual([39, 39])
    });
    test("180: Down player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 2)).toEqual([39, 0])
    });
    test("90CCW: Left player's view to top player's", () => {
        expect(Tetromino.rotateCoords([0, 39], 40, 3)).toEqual([0, 0])
    });
});
