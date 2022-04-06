import { Level } from "../Level";
import { SocketServerMock } from "socket.io-mock-ts";

describe("Testing 'Level'", () => {
    let level: Level;
    let clientSocket: any;
    let serverSocket: any;

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");

    beforeAll(() => {
        serverSocket = new SocketServerMock();
        clientSocket = serverSocket.clientMock;
    });

    beforeEach(() => {
        level = new Level(jest.fn());
    });

    test("'requestFallRate' event", () => {
        level.initSocketListeners(clientSocket);
        clientSocket.emit("requestFallRate", () => {
            expect(serverSocket.emit).toHaveBeenCalledWith(
                "updateFallRate",
                expect.any(Number)
            );
        });
    });

    test("[FR20 Game Leveling] ensure valid level increments", () => {
        level.checkUpdateLevel(10);
        expect(level.currentLevel).toBe(1);

        level.checkUpdateLevel(20);
        expect(level.currentLevel).toBe(2);
    });

    test("[FR7 Game Level Fall Rate] updating fall rate", () => {
        expect(level.currentFallRate).toBe(1000);

        level.checkUpdateLevel(20);
        expect(level.currentFallRate).toBe(793);
    });

    test("[FR24 Game Dynamic Fall Rate] spectator increasing fall rate & resetting fall rate after 20s", () => {
        expect(level.currentFallRate).toBe(1000);

        level.spectatorIncreaseFallRate();
        expect(level.currentFallRate).toBe(793);
        expect(setTimeout).toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20000);
    });

    test("[FR24 Game Dynamic Fall Rate] spectator decreasing fall rate & resetting fall rate after 20s", () => {
        expect(level.currentFallRate).toBe(1000);

        level.spectatorDecreaseFallRate();
        expect(level.currentFallRate).toBeCloseTo(1239, 0);
        expect(setTimeout).toHaveBeenCalled();
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
