import { Trade } from "../Trade";
import SocketMock from "socket.io-mock-ts";
import { textSpanIntersectsWithTextSpan } from "typescript";
import { TetrominoType } from "../../../common/TetrominoType";

describe("Testing 'Trade'", () => {
    let clientSocket1: any;
    let clientSocket2: any;
    let serverSocket: any;
    let randTrader: Trade;
    let trader: Trade;
    let client1Tetromino: TetrominoType | null;
    let client2Tetromino: TetrominoType | null;
    beforeAll(() => {
        client1Tetromino = null;
        client2Tetromino = null;
        clientSocket1 = new SocketMock();
        clientSocket2 = new SocketMock();
        // clientSocket1.on("sendRandomPiece", (tetromino: TetrominoType) => {
        //     client1Tetromino = tetromino;
        // });
        // clientSocket1.on("sendTradePiece", (tetromino: TetrominoType) => {
        //     client2Tetromino = tetromino;
        // });
        // clientSocket2.on("sendRandomPiece", () => {});
        // clientSocket2.on("sendTradePiece", () => {});
    });
    beforeEach(() => {
        randTrader = new Trade(1);
        trader = new Trade();
    });
    test("First Offer for regular trader", () => {
        trader.addTrade(clientSocket1, TetrominoType.I);
        expect(trader.currentOfferer).toBe(clientSocket1);
        expect(trader.tradeActive).toBe(true);
        expect(trader.currentTradeOffer).toBe(TetrominoType.I);
        expect(trader.pairNum).toBe(null);
    });
    test("Second Offer for regular trader", () => {
        trader.currentOfferer = clientSocket1;
        trader.tradeActive = true;
        trader.currentTradeOffer = TetrominoType.I;
        trader.addTrade(clientSocket2, TetrominoType.J);
        clientSocket1.on("sendTradePiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.J);
        });
        clientSocket2.on("sendTradePiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.I);
        });
    });
    test("Clear trade", () => {
        trader.currentOfferer = clientSocket1;
        trader.tradeActive = true;
        trader.currentTradeOffer = TetrominoType.I;
        trader.clearTrade();
        expect(trader.currentOfferer).toBe(null);
        expect(trader.currentTradeOffer).toBe(null);
        expect(trader.tradeActive).toBe(false);
    });
});
