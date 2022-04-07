import { PlayerQueue } from "../PlayerQueue";
import { SocketServerMock } from "socket.io-mock-ts";

describe("Testing 'Level'", () => {
    let queue: PlayerQueue;
    let clientSocket: any;
    let serverSocket: any;

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");

    beforeAll(() => {
        serverSocket = new SocketServerMock();
        clientSocket = serverSocket.clientMock;
    });

    beforeEach(() => {
        queue = new PlayerQueue(jest.fn(), jest.fn());
        queue.initSocketListeners(clientSocket);
    });

    test("'joinQueue' event", () => {
        const joinQueue = jest.spyOn(queue, "addToQueue");

        clientSocket.emit("joinQueue", () => {
            expect(joinQueue).toHaveBeenCalled();
        });
    });

    test("[FR1 Game Start Condition] Upon receiving 4 join-queue requests, send out the 'initPlayer' event to start the game", () => {
        const clientSocket2 = serverSocket.clientMock;
        const clientSocket3 = serverSocket.clientMock;
        const clientSocket4 = serverSocket.clientMock;

        queue.initSocketListeners(clientSocket2);
        queue.initSocketListeners(clientSocket3);
        queue.initSocketListeners(clientSocket4);

        clientSocket.emit("joinQueue");
        clientSocket2.emit("joinQueue");
        clientSocket3.emit("joinQueue", () => {
            expect(serverSocket.emit).not.toHaveBeenCalled();
        });
        clientSocket4.emit("joinQueue", () => {
            expect(serverSocket.emit).toHaveBeenCalledWith(
                "initPlayer",
                expect.any(Number)
            );
        });
    });

    test("'requestRemainingPlayers' event", () => {
        const getRemainingPlayers = jest.spyOn(queue, "getRemainingPlayers");

        clientSocket.emit("requestRemainingPlayers", () => {
            expect(serverSocket.emit).toHaveBeenCalledWith(
                "updateRemainingPlayers"
            );
            expect(getRemainingPlayers).toHaveBeenCalled();
        });
    });

    test("'disconnect' event", () => {
        const removeFromQueue = jest.spyOn(queue, "removeFromQueue");

        clientSocket.emit("disconnect", () => {
            expect(removeFromQueue).toHaveBeenCalled();
        });
    });

    test("Remaining players", () => {
        clientSocket.emit("joinQueue", () => {
            expect(queue.getRemainingPlayers()).toBe(3);
        });

        clientSocket.emit("disconnect", () => {
            expect(queue.getRemainingPlayers()).toBe(4);
        });
    });

    test("Reset queue", () => {
        clientSocket.emit("joinQueue", () => {
            expect(queue.getRemainingPlayers()).toBe(3);
        });

        queue.resetQueue();
        expect(queue.getRemainingPlayers()).toBe(4);
    });
});
