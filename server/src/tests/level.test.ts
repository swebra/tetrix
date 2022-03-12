import { Level } from "../Level";

describe("Testing 'Level'", () => {
    let level: Level;

    beforeEach(() => {
        level = new Level();
    });

    test("Valid level increments", () => {
        level.checkUpdateLevel(10);
        expect(level.currentLevel).toBe(1);

        level.checkUpdateLevel(20);
        expect(level.currentLevel).toBe(2);
    });

    test("Updating Fall Rate", () => {
        expect(level.currentFallRate).toBe(1000);

        level.checkUpdateLevel(20);
        expect(level.currentFallRate).toBe(793);
    });

    test("Spectator Increasing Fall Rate & Resetting Fall Rate after 20s", () => {
        expect(level.currentFallRate).toBe(1000);

        level.spectatorIncreaseFallRate();
        expect(level.currentFallRate).toBe(793);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20000);
    });

    test("Spectator Decreasing Fall Rate & Resetting Fall Rate after 20s", () => {
        expect(level.currentFallRate).toBe(1000);

        level.spectatorIncreaseFallRate();
        expect(level.currentFallRate).toBeCloseTo(1239);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20000);
    });

    test("Reseting Level", () => {
        level.checkUpdateLevel(500);
        level.checkUpdateLevel(500);
        expect(level.currentLevel).toBe(3);

        level.resetLevel();
        expect(level.currentLevel).toBe(1);
        expect(level.currentFallRate).toBe(1000);
    });
});
