import { Scoreboard } from "../Scoreboard";
import { Level } from "../Level";
import { SocketServerMock } from "socket.io-mock-ts";

describe("Testing 'Spectator'", () => {
    let board: Scoreboard;
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
        board = new Scoreboard(jest.fn());
        level = new Level(jest.fn());
    });

    test("Test requestScoreboardData event", () => {
        board.initSocketListeners(clientSocket, level);
        clientSocket.emit("requestFallRate");
        serverSocket.once("updateScoreboard", (eventData: any) => {
            expect(eventData).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        color: "orange",
                        points: 0,
                    }),
                    expect.objectContaining({
                        color: "green",
                        points: 0,
                    }),
                    expect.objectContaining({
                        color: "pink",
                        points: 0,
                    }),
                    expect.objectContaining({
                        color: "blue",
                        points: 0,
                    }),
                    expect.objectContaining({
                        color: "level",
                        points: 1,
                    }),
                ])
            );
        });
    });

    test("Test Increment User Scores", () => {
        const updateScoreboardUI = jest.spyOn(board, "updateScoreboardUI");

        expect(board.currentTeamScore).toBe(0);
        board.incrementScore(0, 10, level);

        expect(board.orangeScore).toBe(10);
        expect(board.currentTeamScore).toBe(10);
        expect(updateScoreboardUI).toHaveBeenCalled();
    });

    test("Reset Scores", () => {
        expect(board.currentTeamScore).toBe(0);
        board.incrementScore(0, 10, level);
        expect(board.currentTeamScore).toBe(10);
        expect(board.accumulatedScore).toBe(10);
        board.resetScores();
        expect(board.currentTeamScore).toBe(0);
    });

    test("Test Resetting AccumulatedScore Upon Level Increment", () => {
        const updateLevel = jest.spyOn(level, "checkUpdateLevel");

        expect(board.accumulatedScore).toBe(0);
        board.incrementScore(0, 10, level);
        expect(board.accumulatedScore).toBe(10);

        board.incrementScore(1, 10, level);
        expect(updateLevel).toHaveBeenCalled();
        expect(board.accumulatedScore).toBe(0);
    });

    test("Test Decrement User Scores", () => {
        const updateScoreboardUI = jest.spyOn(board, "updateScoreboardUI");

        expect(board.orangeScore).toBe(0);
        board.decrementScore(0, 10, level.currentLevel);
        expect(board.orangeScore).toBe(0);

        board.incrementScore(0, 10, level);
        expect(board.orangeScore).toBe(10);

        board.decrementScore(0, 10, level.currentLevel);
        expect(board.orangeScore).toBe(0);
        expect(updateScoreboardUI).toHaveBeenCalled();
    });

    test("Test Get Final Scores", () => {
        expect(board.finalScores.length).toBe(0);
        expect(board.getFinalScores().length).toBe(5);

        // Increment the score and ensure its properly copied into the final scores.
        board.incrementScore(0, 10, level);
        expect(board.getFinalScores()[0].points).toBe(10);
    });
});
