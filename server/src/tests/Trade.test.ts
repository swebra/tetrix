import { Trade } from "../Trade";
import SocketMock from "socket.io-mock-ts";
import { textSpanIntersectsWithTextSpan } from "typescript";
import { TetrominoType } from "../../../common/TetrominoType";

describe("Testing 'Trade'", () => {
    let clientSocket1: any;
    let clientSocket2: any;
    let randTrader: Trade;
    let trader: Trade;

    beforeAll(() => {
        clientSocket1 = new SocketMock();
        clientSocket2 = new SocketMock();
    });
    beforeEach(() => {
        randTrader = new Trade(1);
        trader = new Trade();
    });
    test("[FR21 Player Trade] The initial trade offer will be stored", () => {
        trader.addTrade(clientSocket1, TetrominoType.I);
        expect(trader.currentOfferer).toBe(clientSocket1);
        expect(trader.tradeActive).toBe(true);
        expect(trader.currentTradeOffer).toBe(TetrominoType.I);
        expect(trader.pairNum).toBe(null);
    });
    test("[FR22 Player Accept Trade] The second trade will transmit socket events", () => {
        clientSocket1.on("sendTradePiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.J);
        });
        clientSocket2.on("sendTradePiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.I);
        });
        trader.currentOfferer = clientSocket1;
        trader.tradeActive = true;
        trader.currentTradeOffer = TetrominoType.I;
        trader.addTrade(clientSocket2, TetrominoType.J);
    });
    test("[FR21 Player Trade] Trade will Clear", () => {
        trader.currentOfferer = clientSocket1;
        trader.tradeActive = true;
        trader.currentTradeOffer = TetrominoType.I;
        trader.clearTrade();
        expect(trader.currentOfferer).toBe(null);
        expect(trader.currentTradeOffer).toBe(null);
        expect(trader.tradeActive).toBe(false);
    });
    test("[FR26 Spectator Random Trade] The first Random Trade client information will be stored", () => {
        randTrader.addTrade(clientSocket1, TetrominoType.L);
        expect(randTrader.currentOfferer).toBe(clientSocket1);
        expect(randTrader.tradeActive).toBe(true);
        expect(randTrader.currentTradeOffer).toBe(TetrominoType.L);
    });
    test("[FR26 Spectator Random Trade] Storing the second Random Trade client information will transmit socket events", () => {
        clientSocket1.on("sendRandomPiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.J);
        });
        clientSocket2.on("sendRandomPiece", (tetromino: TetrominoType) => {
            expect(tetromino).toEqual(TetrominoType.I);
        });
        randTrader.currentOfferer = clientSocket1;
        randTrader.tradeActive = true;
        randTrader.currentTradeOffer = TetrominoType.I;
        randTrader.addTrade(clientSocket2, TetrominoType.J);
        //randTrader also clears the trades so these checks are needed
        expect(randTrader.currentOfferer).toBe(null);
        expect(randTrader.currentTradeOffer).toBe(null);
        expect(randTrader.tradeActive).toBe(false);
    });
});
