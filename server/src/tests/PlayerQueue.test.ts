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

    test("'requestRemainingPlayers' event", () => {
        const getRemainingPlayers = jest.spyOn(queue, "getRemainingPlayers");

        clientSocket.emit("requestRemainingPlayers");
        serverSocket.once("updateRemainingPlayers", () => {
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
