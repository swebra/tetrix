import { SceneTracker } from "../SceneTracker";
import { Scoreboard } from "../Scoreboard";
import { SocketServerMock } from "socket.io-mock-ts";

describe("Testing 'Level'", () => {
    let scene: SceneTracker;
    let scoreboard: Scoreboard;
    let clientSocket: any;
    let serverSocket: any;

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");

    beforeAll(() => {
        serverSocket = new SocketServerMock();
        clientSocket = serverSocket.clientMock;
        scoreboard = new Scoreboard(jest.fn());
    });

    beforeEach(() => {
        scene = new SceneTracker();
        scene.initSocketListeners(clientSocket, scoreboard.getFinalScores());
    });

    test("Testing requestCurrentScene event", () => {
        clientSocket.emit("requestCurrentScene");
        serverSocket.once("toSceneWaitingRoom");

        scene.setScene("SceneGameOver");

        clientSocket.emit("requestCurrentScene");
        serverSocket.once("toSceneGameOver");
    });
});
