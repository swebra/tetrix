import { TetrominoState } from "common/message";
import { BOARD_SIZE, WALL_SIZE } from "common/shared";
import { SocketClientMock, SocketServerMock } from "socket.io-mock-ts";
import { GameState } from "../GameState";
import { Monomino } from "../Monomino";
import { RandomBag } from "../RandomBag";
import { Tetromino } from "../Tetromino";
import { useMockSockets, useMockScene } from "./utils";
import { TradeUI } from "../scene/TradeUI";
import { TradeState } from "common/TradeState";
import { TetrominoType } from "common/TetrominoType";

let gameState: GameState;
let serverSocket: SocketServerMock;
let clientSocket: SocketClientMock;
let scene: any;

describe("TestUI", async () => {
    beforeEach(() => {
        [serverSocket, clientSocket] = useMockSockets();
        gameState = new GameState(clientSocket as any);
        scene = useMockScene(vi);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });
    it("can start up", async () => {
        const ui = new TradeUI(scene as any, null);
    });

    it("[FR21 Player trade] a trade can be offered by the player", async () => {
        setupSimplePlayer(0);
        const mockSocket = setupOfferTrade();

        expect(mockSocket.emit).toHaveBeenCalledWith("playerTrade", 0, 0, 1);
    });

    it("[FR21 Player trade] an offered trade can be received by the player", async () => {
        setupSimplePlayer(0);
        const mockSocket = setupOfferTrade();

        serverSocket.emit(
            "playerTrade",
            1,
            TetrominoType.T,
            TradeState.Offered
        ); // from player1, type T, offered

        expect(gameState.tradeState).toEqual(TradeState.Pending);
        expect(gameState.tradeTetrominoType).toEqual(TetrominoType.T);
        expect(gameState.tradingPlayerId).toEqual(1);
        expect(mockSocket.emit).toHaveBeenCalledWith(
            "playerTrade",
            0,
            TetrominoType.I,
            TradeState.Offered
        );
    });

    it("[FR22 Player accept trade] an accepted trade can trigger a swap", async () => {
        setupSimplePlayer(0);
        const mockSocket = setupOfferTrade();

        expect(gameState.tradeState).toEqual(TradeState.Offered);
        expect(gameState.tradeTetrominoType).toEqual(TetrominoType.I);
        expect(gameState.tradingPlayerId).toBeNull();
        expect(mockSocket.emit).toHaveBeenCalledWith(
            "playerTrade",
            0,
            TetrominoType.I,
            TradeState.Offered
        );

        serverSocket.emit("sendTradePiece", TetrominoType.T);
        expect(gameState.tradeState).toEqual(TradeState.NoTrade);
        expect(gameState.tradeTetrominoType).toBeNull();
        expect(gameState.tradingPlayerId).toBeNull();
        expect(gameState.currentTetromino.getType()).toEqual(TetrominoType.T);
    });

    function setupSimplePlayer(type: number = 6) {
        // stub random bag
        const randomBag = new RandomBag(clientSocket as any);
        randomBag.getNextType = vi.fn().mockReturnValue(type);
        gameState.randomBag = randomBag;
        // init player
        serverSocket.emit("initPlayer", 0);
    }

    function setupOfferTrade() {
        const ui = new TradeUI(scene as any, null);
        gameState.tradeState = TradeState.Offered;
        gameState.tradeTetrominoType = gameState.currentTetromino.getType();
        const mockSocket = {
            emit: vi.fn(),
        };
        gameState.socket = mockSocket as any;
        gameState.emitTrade();
        return mockSocket;
    }
});
