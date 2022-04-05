import { GameState } from "../GameState";
import SocketMock from "socket.io-mock";
import { Socket as ClientSocket } from "socket.io-client";
import { RandomBag } from "../RandomBag";

let gameState: GameState;
let serverSocket: any;
let clientSocket: ClientSocket;

beforeEach(() => {
    serverSocket = new SocketMock();
    clientSocket = serverSocket.socketClient;
    gameState = new GameState(clientSocket);
});
// FR1 skipped

describe("GameState", () => {
    it("initialize as a spectator by default", () => {
        expect(gameState.otherTetrominoes).toHaveLength(4);
        expect(gameState.playerId).toBeNull();
    });

    it("[FR2 Player view] can initialize as a player0 with correct `otherTetrominoes`", () => {
        expect(gameState.playerId).toBeNull();
        serverSocket.emit("initPlayer", 0);

        expect(gameState.playerId).toEqual(0);
        // three other players
        expect(gameState.otherTetrominoes).toHaveLength(3);
        [1, 2, 3].forEach((id) => {
            // with the correct id
            expect(gameState.otherTetrominoes[id - 1].ownerId).toEqual(id);

            // with all T types
            expect(gameState.otherTetrominoes[id - 1].getType()).toEqual(6);

            // with correct Tetromino rotation
            expect(gameState.otherTetrominoes[id - 1].rotation).toEqual(id);
        });
        // at the correct positions
        expect(gameState.otherTetrominoes[0].position).toEqual([19, 37]);
        expect(gameState.otherTetrominoes[1].position).toEqual([37, 18]);
        expect(gameState.otherTetrominoes[2].position).toEqual([18, 0]);
    });

    it("[FR2 Player view] can initialize as a player3 with correct `otherTetrominoes`", () => {
        expect(gameState.playerId).toBeNull();
        serverSocket.emit("initPlayer", 3);

        expect(gameState.playerId).toEqual(3);
        // three other players
        expect(gameState.otherTetrominoes).toHaveLength(3);
        [0, 1, 2].forEach((id) => {
            // with the correct id
            expect(gameState.otherTetrominoes[id].ownerId).toEqual(id);

            // with all T types
            expect(gameState.otherTetrominoes[id].getType()).toEqual(6);

            // with correct Tetromino rotation
            expect(gameState.otherTetrominoes[id].rotation).toEqual(id + 1);
        });

        // at the correct positions
        expect(gameState.otherTetrominoes[0].position).toEqual([19, 37]);
        expect(gameState.otherTetrominoes[1].position).toEqual([37, 18]);
        expect(gameState.otherTetrominoes[2].position).toEqual([18, 0]);
    });

    it("[FR3 Spectator view] correctly initialize as a spectator", () => {
        expect(gameState.otherTetrominoes).toHaveLength(4);
        expect(gameState.playerId).toBeNull();

        [0, 1, 2, 3].forEach((id) => {
            // with the correct id
            expect(gameState.otherTetrominoes[id].ownerId).toBeNull();

            // with all T types
            expect(gameState.otherTetrominoes[id].getType()).toEqual(6);

            // with correct Tetromino rotation
            expect(gameState.otherTetrominoes[id].rotation).toEqual(
                (id + 1) % 4
            );
        });
        // at the correct positions
        expect(gameState.otherTetrominoes[0].position).toEqual([19, 37]);
        expect(gameState.otherTetrominoes[1].position).toEqual([37, 18]);
        expect(gameState.otherTetrominoes[2].position).toEqual([18, 0]);
        expect(gameState.otherTetrominoes[3].position).toEqual([0, 19]);
    });

    it("[FR4 Tetromino spawning] starts currentTetromino at the top of the game", async () => {
        // mock randomBag
        const randomBag = new RandomBag(clientSocket);
        randomBag.getNextType = vi.fn().mockReturnValue(6);
        const spyRandomBag = vi.spyOn(randomBag, "getNextType");
        gameState.randomBag = randomBag;

        expect(gameState.playerId).toBeNull();
        expect(gameState.currentTetromino).toBeUndefined();

        serverSocket.emit("initPlayer", 3);

        expect(gameState.currentTetromino.position).toEqual([0, 19]);
        expect(gameState.currentTetromino.rotation).toEqual(0);
        expect(spyRandomBag).toHaveBeenCalledOnce();
        vi.clearAllMocks();
    });
});
