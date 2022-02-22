import {rotateCoords} from "../utils";

describe("Test rotateCoords", () => {
    test("No rotation", () => {
        expect(rotateCoords([0, 4], 10, 4)).toEqual([0, 4])
    });
    test("Left player's top right", () => {
        expect(rotateCoords([0, 39], 39, 1)).toEqual([0, 0])
    });
    test("Down player's top right", () => {
        expect(rotateCoords([0, 39], 39, 2)).toEqual([39, 0])
    });
    test("Right player's top right", () => {
        expect(rotateCoords([0, 39], 39, 3)).toEqual([39, 39])
    });
});
