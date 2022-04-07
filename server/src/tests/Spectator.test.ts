import { Spectator } from "../Spectator";
import { Level } from "../Level";
import { SocketServerMock } from "socket.io-mock-ts";

describe("Testing 'Spectator'", () => {
    let spectator: Spectator;
    let clientSocket: any;
    let serverSocket: any;
    const level: Level = new Level(jest.fn());

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
    jest.spyOn(global, "setInterval");

    beforeAll(() => {
        serverSocket = new SocketServerMock();
        clientSocket = serverSocket.clientMock;
    });

    beforeEach(() => {
        spectator = new Spectator(
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn()
        );
    });

    test("'vote' event", () => {
        const getResult = jest.spyOn(spectator, "getResult");

        spectator.initSocketListeners(clientSocket);
        clientSocket.emit("vote", () => {
            expect(getResult).toHaveBeenCalled();
        });
    });

    test("'requestVotingSequence' event", () => {
        spectator.initSocketListeners(clientSocket);
        clientSocket.emit("requestVotingSequence", () => {
            expect(serverSocket.emit).toHaveBeenCalledWith(
                "showVotingSequence",
                expect.any(String),
                expect.any(Array)
            );
        });
    });

    test("Ensure voting state is maintained", () => {
        expect(spectator.isVoteRunning()).toBe("");
        spectator.generateFirstVotingSequence(level);
        expect(spectator.isVoteRunning()).toBe("initialDisplay");
    });

    test("[FR23 Spectator Display Voting] first voting sequence", () => {
        expect(spectator.countdownValue).toBe(10);
        spectator.generateFirstVotingSequence(level);

        jest.runAllTimers();
        expect(spectator.countdownValue).toBe(9);

        expect(setTimeout).toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 12000);
    });

    test("Reset voting data before starting another", () => {
        expect(spectator.countdownValue).toBe(10);
        spectator.generateFirstVotingSequence(level);
        jest.runAllTimers();
        expect(spectator.countdownValue).toBe(9);
        spectator.generateFirstVotingSequence(level);
        expect(spectator.countdownValue).toBe(10);
    });

    test("[FR23 Spectator Display Voting] Second Voting Sequence", () => {
        expect(spectator.countdownValue).toBe(10);
        spectator.generateSecondVotingSequence("", level);

        jest.runAllTimers();
        expect(spectator.countdownValue).toBe(9);

        expect(setTimeout).toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 12000);
    });

    test("Ensure a new voting sequence is called every ~40 seconds", () => {
        spectator.startVotingLoop(level);
        expect(setInterval).toHaveBeenCalled();

        // Using 44 seconds here but the clients will still experience it every 40 seconds.
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 44000);
    });

    test("Ensure voting sequence is reset when starting a voting sequence", () => {
        const resetVotingRound = jest.spyOn(
            Spectator.prototype as any,
            "resetVotingRound"
        );

        spectator.generateFirstVotingSequence(level);
        expect(resetVotingRound).toHaveBeenCalled();

        spectator.generateSecondVotingSequence("", level);
        expect(resetVotingRound).toHaveBeenCalled();
    });

    test("[FR24 Game Dynamic Fall Rate] voting decision - IncreaseFallRate", () => {
        const increaseFallRate = jest.spyOn(level, "spectatorIncreaseFallRate");
        const secondVotingSequence = jest.spyOn(
            spectator,
            "generateSecondVotingSequence"
        );

        expect(spectator.isVoteRunning()).toBe("");
        spectator.startVotingLoop(level);
        spectator.generateFirstVotingSequence(level);
        expect(spectator.isVoteRunning()).toBe("initialDisplay");
        spectator.getResult("option1");
        spectator.makeDecision(level);
        expect(spectator.isVoteRunning()).toBe("fallRate");

        // Second voting round should commence.
        expect(secondVotingSequence).toHaveBeenCalled();

        // Simulate a vote on "option1" (increase fall rate).
        spectator.getResult("option1");
        spectator.makeDecision(level);

        expect(increaseFallRate).toHaveBeenCalled();
    });

    test("[FR24 Game Dynamic Fall Rate] voting decision - DecreaseFallRate", () => {
        const decreaseFallRate = jest.spyOn(level, "spectatorDecreaseFallRate");
        const secondVotingSequence = jest.spyOn(
            spectator,
            "generateSecondVotingSequence"
        );

        expect(spectator.isVoteRunning()).toBe("");
        spectator.startVotingLoop(level);
        spectator.generateFirstVotingSequence(level);
        expect(spectator.isVoteRunning()).toBe("initialDisplay");
        spectator.getResult("option1");
        spectator.makeDecision(level);
        expect(spectator.isVoteRunning()).toBe("fallRate");

        // Second voting round should commence.
        expect(secondVotingSequence).toHaveBeenCalled();

        // Simulate a vote on "option1" (increase fall rate).
        spectator.getResult("option2");
        spectator.makeDecision(level);

        expect(decreaseFallRate).toHaveBeenCalled();
    });

    test("[FR25 Game Change Block Sequence] voting decision - Spawn New Blocks", () => {
        const secondVotingSequence = jest.spyOn(
            spectator,
            "generateSecondVotingSequence"
        );

        expect(spectator.isVoteRunning()).toBe("");
        spectator.startVotingLoop(level);
        spectator.generateFirstVotingSequence(level);
        expect(spectator.isVoteRunning()).toBe("initialDisplay");
        spectator.getResult("option2");
        spectator.makeDecision(level);
        expect(spectator.isVoteRunning()).toBe("tetrominoSelection");

        // Second voting round should commence.
        expect(secondVotingSequence).toHaveBeenCalled();

        // Simulate a vote on "option1" (increase fall rate).
        spectator.getResult("option1");
        spectator.makeDecision(level);

        expect(spectator.randTetros.length).toBe(3);
    });

    test("[FR26 Game Forced Trade] voting decision - Forced Trade", () => {
        const secondVotingSequence = jest.spyOn(
            spectator,
            "generateSecondVotingSequence"
        );

        expect(spectator.isVoteRunning()).toBe("");
        spectator.startVotingLoop(level);
        spectator.generateFirstVotingSequence(level);
        expect(spectator.isVoteRunning()).toBe("initialDisplay");
        spectator.getResult("option3");
        spectator.makeDecision(level);

        // No further voting sequences should be created.
        expect(secondVotingSequence).not.toHaveBeenCalled();
    });
});
