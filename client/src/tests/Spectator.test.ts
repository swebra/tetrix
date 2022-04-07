/**
 * @vitest-environment jsdom
 */

import { SocketClientMock, SocketServerMock } from "socket.io-mock-ts";
import { GameState } from "../GameState";
import { useMockSockets, useMockScene } from "./utils";
import { SpectatorUI } from "../scene/SpectatorUI";
import { CookieTracker } from "../CookieTracker";

let gameState: GameState;
let serverSocket: SocketServerMock;
let clientSocket: SocketClientMock;
let spectatorUI: SpectatorUI;
let scene: any;

describe("Spectator", async () => {
    beforeEach(() => {
        [serverSocket, clientSocket] = useMockSockets();
        gameState = new GameState(clientSocket as any);
        scene = useMockScene(vi);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("[FR23 Spectator display voting] client can request for queue", async () => {
        const mockSocket = {
            emit: vi.fn(),
            removeListener: vi.fn(),
            on: vi.fn(),
        };
        spectatorUI = new SpectatorUI(scene, mockSocket as any);
        expect(mockSocket.emit).toHaveBeenCalledWith("requestVotingSequence");
    });

    it("[FR23 Spectator display voting] client can receive queue and start countdown", async () => {
        let requestedVotingSequence = false;
        let requestedVotingCountdown = false;
        serverSocket.on("requestVotingSequence", () => {
            requestedVotingSequence = true;
            serverSocket.emit("showVotingSequence", "initialDisplay", [0, 1]);
        });

        serverSocket.on("requestVotingCountdown", () => {
            requestedVotingCountdown = true;
        });

        spectatorUI = new SpectatorUI(scene, clientSocket as any);

        expect(requestedVotingSequence).toBeTruthy();
        expect(requestedVotingCountdown).toBeTruthy();
    });

    it("[FR23 Spectator display voting] client can react to hide countdown event", async () => {
        spectatorUI = new SpectatorUI(scene, clientSocket as any);
        const cookieTracker = new CookieTracker();
        cookieTracker.setCookie("hasVoted", "true");
        serverSocket.emit("hideVotingSequence");

        expect(cookieTracker.getCookie("hasVoted")).toEqual("");
    });
});
