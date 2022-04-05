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

    test("Testing joinQueue event", () => {
        const joinQueue = jest.spyOn(queue, "addToQueue");

        clientSocket.emit("joinQueue", () => {
            expect(joinQueue).toHaveBeenCalled();
        });
    });

    test("Testing requestRemainingPlayers event", () => {
        const getRemainingPlayers = jest.spyOn(queue, "getRemainingPlayers");

        clientSocket.emit("requestRemainingPlayers");
        serverSocket.once("updateRemainingPlayers", () => {
            expect(getRemainingPlayers).toHaveBeenCalled();
        });
    });

    test("Testing disconnect event", () => {
        const removeFromQueue = jest.spyOn(queue, "removeFromQueue");

        clientSocket.emit("disconnect", () => {
            expect(removeFromQueue).toHaveBeenCalled();
        });
    });

    test("Test Remaining Players", () => {
        clientSocket.emit("joinQueue", () => {
            expect(queue.getRemainingPlayers()).toBe(3);
        });

        clientSocket.emit("disconnect", () => {
            expect(queue.getRemainingPlayers()).toBe(4);
        });
    });

    test("Test Reset Queue", () => {
        clientSocket.emit("joinQueue", () => {
            expect(queue.getRemainingPlayers()).toBe(3);
        });

        queue.resetQueue();
        expect(queue.getRemainingPlayers()).toBe(4);
    });
});
