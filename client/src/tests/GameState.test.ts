import { TetrominoState } from "common/message";
import { BOARD_SIZE, WALL_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";
import { SocketClientMock, SocketServerMock } from "socket.io-mock-ts";
import { GameState } from "../GameState";
import { Monomino } from "../Monomino";
import { RandomBag } from "../RandomBag";
import { Tetromino } from "../Tetromino";
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
        setupSimplePlayer();
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

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
        setupSimplePlayer();
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

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

    it("[FR10 Tetromino movement restriction] test isInOppositeSection", () => {
        // init player
        serverSocket.emit("initPlayer", 0);

        gameState.currentTetromino.position = [BOARD_SIZE - 1, 19];
        gameState.currentTetromino.monominoes.forEach((monomino) => {
            monomino.position = [BOARD_SIZE - 1, 19];
        });
        expect(gameState.isInOppositeSection()).toBeTruthy();
    });

    it("[FR10 Tetromino movement restriction] test isInOppositeSection", () => {
        // init player
        serverSocket.emit("initPlayer", 0);

        gameState.currentTetromino.position = [BOARD_SIZE - 1, 19];
        gameState.currentTetromino.monominoes.forEach((monomino) => {
            monomino.position = [BOARD_SIZE - 1, 19];
        });
        expect(gameState.isInOppositeSection()).toBeTruthy();
    });

    it("[FR11 FR19 Tetromino fall through] test moveIfCan will trigger respawn if exceeded the bottom boundary", () => {
        // init player
        serverSocket.emit("initPlayer", 0);

        gameState.currentTetromino.position = [BOARD_SIZE - 1, 19];
        gameState.currentTetromino.monominoes.forEach((monomino) => {
            monomino.position = [BOARD_SIZE - 1, 19];
        });

        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        const result = gameState.moveIfCan(Tetromino.fall);
        expect(result).toBeTruthy();
        // assert that lose point event is emitted
        expect(mockedClientSocket.emit).toBeCalledWith("losePoints", 0);
        expect(gameState.currentTetromino.position[0]).toEqual(0);
    });

    it("[FR12 Player control move left] can move left", () => {
        testControl(Tetromino.slide(-1), {
            position: [0, 18],
            rotation: 0,
            type: 6,
        });
    });

    it("[FR13 Player control move down] can move down", () => {
        testControl(Tetromino.fall, {
            position: [1, 19],
            rotation: 0,
            type: 6,
        });
    });

    it("[FR14 Player control move right] can move right", () => {
        testControl(Tetromino.slide(1), {
            position: [0, 20],
            rotation: 0,
            type: 6,
        });
    });

    it("[FR15 Player control rotateCCW] can rotate counter clockwise", () => {
        testControl(Tetromino.rotateCCW, {
            position: [0, 19],
            rotation: 3,
            type: 6,
        });
    });

    it("[FR16 Player control rotateCW] can rotate clockwise", () => {
        testControl(Tetromino.rotateCW, {
            position: [0, 19],
            rotation: 1,
            type: 6,
        });
    });

    it("[FR17 Line clearing] clearing one line", () => {
        setupSimplePlayer();
        setupRowInBoard(
            3,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        gameState.moveIfCan(Tetromino.rotateCCW);
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        expect(mockedClientSocket.emit).toHaveBeenCalledTimes(0);

        gameState.updateFalling();
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [1, 23],
            rotation: 3,
            type: 6,
        });
        gameState.updateFalling();
        // assert that placing event happens
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerPlace", 0, {
            position: [1, 23],
            rotation: 3,
            type: 6,
        });

        // assert that line clearing happens
        gameState.updateLineClearing(0);
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [0, 19],
            rotation: 0,
            type: 6,
        });
        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "gainPoints",
            0,
            1
        );

        // assert line clearing result in the 4th row being cleared and block fall down
        assertRow(3, [23, 24]);
        assertRow(2, [24]);
    });

    it("[FR17, FR18 Line clearing two lines] clearing multiple separated lines", () => {
        setupSimplePlayer(0);
        setupRowInBoard(
            5,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        // this row won't be cleared
        setupRowInBoard(
            6,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 2).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(
            7,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(8, [24]);

        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        gameState.moveIfCan(Tetromino.rotateCCW);
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        expect(mockedClientSocket.emit).toHaveBeenCalledTimes(0);

        gameState.updateFalling();
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [1, 23],
            rotation: 3,
            type: 0,
        });

        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();

        // assert that placing event happens
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerPlace", 0, {
            position: [4, 23],
            rotation: 3,
            type: 0,
        });
        // reset to initial spawning position
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [0, 18],
            rotation: 0,
            type: 0,
        });

        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "gainPoints",
            0,
            3
        );

        assertRow(6, [24]);
        assertRow(7, [15, 16, 17, 18, 19, 20, 21, 22, 24]);
        assertRow(8, [24]);
    });

    it("[FR17, FR18 Line clearing tree lines] clearing multiple separated lines", () => {
        setupSimplePlayer(0);
        setupRowInBoard(
            5,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        // this row won't be cleared
        setupRowInBoard(
            6,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(
            7,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(8, [24]);

        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        gameState.moveIfCan(Tetromino.rotateCCW);
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        expect(mockedClientSocket.emit).toHaveBeenCalledTimes(0);

        gameState.updateFalling();
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [1, 23],
            rotation: 3,
            type: 0,
        });

        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();

        // assert that placing event happens
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerPlace", 0, {
            position: [4, 23],
            rotation: 3,
            type: 0,
        });
        // reset to initial spawning position
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [0, 18],
            rotation: 0,
            type: 0,
        });

        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "gainPoints",
            0,
            5
        );

        assertRow(7, [24]);
        assertRow(8, [24]);
    });

    it("[FR17, FR18 Line clearing four lines] clearing multiple separated lines", () => {
        setupSimplePlayer(0);

        setupRowInBoard(
            5,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(
            7,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        // this row won't be cleared
        setupRowInBoard(
            6,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(
            8,
            [...Array(BOARD_SIZE - 2 * WALL_SIZE - 1).keys()].map(
                (x) => x + WALL_SIZE
            )
        );

        setupRowInBoard(8, [24]);

        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        gameState.moveIfCan(Tetromino.rotateCCW);
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        gameState.moveIfCan(Tetromino.slide(1));
        expect(mockedClientSocket.emit).toHaveBeenCalledTimes(0);

        gameState.updateFalling();
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerMove", 0, {
            position: [1, 23],
            rotation: 3,
            type: 0,
        });

        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();
        gameState.updateFalling();

        // assert that placing event happens
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerPlace", 0, {
            position: [4, 23],
            rotation: 3,
            type: 0,
        });

        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "gainPoints",
            0,
            8
        );
        assertRow(8, [24]);
    });

    it("[FR26 Game force trade] client can react correctly to 'sendRandomPiece' event from server", () => {
        setupSimplePlayer(TetrominoType.I);
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;
        serverSocket.emit("sendRandomPiece", TetrominoType.T);

        // assert that tetromino is respawned to match event tetromino type
        expect(gameState.currentTetromino.getType()).toEqual(TetrominoType.T);
        expect(gameState.currentTetromino.isTraded).toBeTruthy();
        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "playerMove",
            0,
            gameState.currentTetromino.reportState()
        );
    });

    it("[FR27 Game end condition] game should end when the piece cannot place anymore", () => {
        setupSimplePlayer(TetrominoType.T);
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;
        // create a row in the second row
        setupRowInBoard(1, [18, 19, 20]);

        gameState.updateFalling();

        expect(mockedClientSocket.emit).toHaveBeenCalledWith("playerPlace", 0, {
            type: TetrominoType.T,
            position: [0, 19],
            rotation: 0,
        });

        // assert that end game event is emitted when the piece is blocked at the top when placed.
        expect(mockedClientSocket.emit).toHaveBeenCalledWith("endGame");

        expect(mockedClientSocket.emit).toHaveBeenCalledWith(
            "playerMove",
            0,
            gameState.currentTetromino.reportState()
        );
    });

    it("can update from a given boardState (sync update)", async () => {
        // create some rows in the board to create a remote board state
        setupRowInBoard(1, [0, 1, 2]);
        const remoteState = gameState.toBoardState();
        // assert remoteState is generated correctly
        expect(
            remoteState[1]
                .filter((x) => !!x)
                .map(
                    (monominoState, i) =>
                        monominoState && monominoState.position === [1, i]
                )
        );

        gameState = new GameState(clientSocket as any);
        gameState.lastPlacingTS = 0;
        gameState.fromBoardState(remoteState);

        expect(gameState.toBoardState()).toStrictEqual(remoteState);
    });

    it("can skip an update from a given boardState (sync update) if last placed is very recent", async () => {
        // create some rows in the board to create a remote board state
        setupRowInBoard(1, [0, 1, 2]);
        const remoteState = gameState.toBoardState();
        // assert remoteState is generated correctly
        expect(
            remoteState[1]
                .filter((x) => !!x)
                .map(
                    (monominoState, i) =>
                        monominoState && monominoState.position === [1, i]
                )
        );

        gameState = new GameState(clientSocket as any);
        const prev = gameState.toBoardState();
        gameState.fromBoardState(remoteState);

        expect(gameState.toBoardState()).toStrictEqual(prev);
    });

    function setupRowInBoard(row: number, cols: Array<number>) {
        cols.forEach((col) => {
            gameState.board[row][col] = new Monomino(0, [row, col], null);
        });
    }

    function assertRow(row: number, cols: Array<number>) {
        expect(
            gameState.board[row]
                .filter((x) => !!x)
                .map((x) => x && x.position[1])
        ).toEqual(cols);
    }

    function testControl(movefunc: any, expectedState: TetrominoState) {
        setupSimplePlayer();
        // spy on socket
        const mockedClientSocket = {
            on: vi.fn(),
            emit: vi.fn(),
        };
        gameState.socket = mockedClientSocket as any;

        const result = gameState.moveIfCan(movefunc);
        expect(result).toBeTruthy();
        expect(gameState.currentTetromino.reportState()).toEqual(expectedState);
    }

    function setupSimplePlayer(type: number = 6) {
        // stub random bag
        const randomBag = new RandomBag(clientSocket as any);
        randomBag.getNextType = vi.fn().mockReturnValue(type);
        gameState.randomBag = randomBag;
        // init player
        serverSocket.emit("initPlayer", 0);
    }
});
