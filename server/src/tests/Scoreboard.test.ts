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

    test("'requestScoreboardData' event", () => {
        board.initSocketListeners(clientSocket, level);
        clientSocket.emit("requestFallRate", () => {
            expect(serverSocket.emit).toHaveBeenCalledWith(
                "updateScoreboard",
                (eventData: any) => {
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
                }
            );
        });
    });

    test("[FR18 Scoring Line Clear] increment user scores", () => {
        const updateScoreboardUI = jest.spyOn(board, "updateScoreboardUI");

        expect(board.currentTeamScore).toBe(0);
        board.incrementScore(0, 10, level);

        expect(board.orangeScore).toBe(10);
        expect(board.currentTeamScore).toBe(10);
        expect(updateScoreboardUI).toHaveBeenCalled();
    });

    test("Reset scores", () => {
        expect(board.currentTeamScore).toBe(0);
        board.incrementScore(0, 10, level);
        expect(board.currentTeamScore).toBe(10);
        expect(board.accumulatedScore).toBe(10);
        board.resetScores();
        expect(board.currentTeamScore).toBe(0);
    });

    test("Resetting 'accumulatedScore' upon level increment", () => {
        const updateLevel = jest.spyOn(level, "checkUpdateLevel");

        expect(board.accumulatedScore).toBe(0);
        board.incrementScore(0, 10, level);
        expect(board.accumulatedScore).toBe(10);

        board.incrementScore(1, 10, level);
        expect(updateLevel).toHaveBeenCalled();
        expect(board.accumulatedScore).toBe(0);
    });

    test("[FR19 Scoring Fall Through] decrement user scores", () => {
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

    test("[FR28 Game Show Score] Get final scores", () => {
        expect(board.finalScores.length).toBe(0);
        expect(board.getFinalScores().length).toBe(5);

        // Increment the score and ensure its properly copied into the final scores.
        board.incrementScore(0, 10, level);
        expect(board.getFinalScores()[0].points).toBe(10);
    });
});
