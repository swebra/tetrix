import { BOARD_SIZE, WALL_SIZE } from "common/shared";
import { SocketClientMock, SocketServerMock } from "socket.io-mock-ts";
import { GameState } from "../GameState";
import { Monomino } from "../Monomino";
import { RandomBag } from "../RandomBag";
import { useMockSockets } from "./utils";

let gameState: GameState;
let serverSocket: SocketServerMock;
let clientSocket: SocketClientMock;

beforeEach(() => {
    [serverSocket, clientSocket] = useMockSockets();
    gameState = new GameState(clientSocket as any);
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
        const randomBag = new RandomBag(clientSocket as any);
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

    it("[FR7 Level fall rate] the tetromino can fall by 1 row", () => {
        serverSocket.emit("initPlayer", 0);

        const [oldRow, oldCol] = gameState.currentTetromino.position;
        gameState.updateFalling();
        const [row, col] = gameState.currentTetromino.position;

        expect(col).toEqual(oldCol);
        expect(row).toEqual(oldRow + 1);
    });

    it("[FR8 Level fall rate] the tetromino is placed if cannot fall", async () => {
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        // stub random bag
        const randomBag = new RandomBag(clientSocket as any);
        randomBag.getNextType = vi.fn().mockReturnValue(6);
        gameState.randomBag = randomBag;

        // init player
        serverSocket.emit("initPlayer", 0);

        // generate a wall at row=5 in the arena to stop the tetromino
        for (let col = WALL_SIZE; col < BOARD_SIZE - WALL_SIZE - 2; col++) {
            gameState.board[5][col] = new Monomino(0, [5, col], null);
        }

        // assert that a placing event is emitted after 4 fall calls
        for (let i = 0; i < 5; i++) {
            gameState.updateFalling();
        }
        expect(mockedClientSocket.emit).toHaveBeenNthCalledWith(
            4,
            "playerPlace",
            0,
            { position: [3, 19], rotation: 0, type: 6 }
        );
    });

    it("[FR9 Tetromino collision] can collide into other tetromino", () => {
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        // stub random bag
        const randomBag = new RandomBag(clientSocket as any);
        randomBag.getNextType = vi.fn().mockReturnValue(6);
        gameState.randomBag = randomBag;

        // init player
        serverSocket.emit("initPlayer", 0);
        const anotherPlayer = gameState.otherTetrominoes[1]; // assumed id = 2
        // simulat another player who is at row 5
        anotherPlayer.position[0] = 5;
        anotherPlayer.monominoes.forEach(
            (monomino) => (monomino.position[0] = 5)
        );

        // assert that a placing event is emitted after 4 fall calls
        // simulating a collision with the anotherPlayer
        for (let i = 0; i < 5; i++) {
            gameState.updateFalling();
        }

        expect(mockedClientSocket.emit).toHaveBeenNthCalledWith(
            4,
            "playerPlace",
            0,
            { position: [3, 19], rotation: 0, type: 6 }
        );
    });

    it("[FR9 Tetromino collision] can freeze when others collide into us", () => {
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        // stub random bag
        const randomBag = new RandomBag(clientSocket as any);
        randomBag.getNextType = vi.fn().mockReturnValue(6);
        gameState.randomBag = randomBag;

        gameState.emitAndPlaceCurrentTetromino = vi.fn();
        // init player
        serverSocket.emit("initPlayer", 0);

        const anotherPlayer = gameState.otherTetrominoes[1]; // assumed id = 2
        // simulate another player who is at row 5
        gameState.otherTetrominoes[1].position = [0, 18];
        gameState.otherTetrominoes[1].setType(0);
        gameState.otherTetrominoes[1].monominoes.forEach(
            (monomino) => (monomino.position[0] = 1)
        );

        // simulate remote event of player moving in an colliding
        serverSocket.emit("playerMove", 2, anotherPlayer.reportState());
        serverSocket.emit("playerPlace", 2, anotherPlayer.reportState());

        // assert that the local game also emit a collision event and respawned
        expect(gameState.emitAndPlaceCurrentTetromino).toHaveBeenCalledOnce();
        expect(randomBag.getNextType).toHaveBeenCalledOnce();
    });
});
