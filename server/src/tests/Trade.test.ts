import { Trade } from "../Trade";
import { SocketServerMock, SocketClientMock } from "socket.io-mock-ts";
import { textSpanIntersectsWithTextSpan } from "typescript";
import { TetrominoType } from "../../../common/TetrominoType";

describe("Testing 'Trade'", () => {
    let clientSocket1: any;
    let clientSocket2: any;
    let serverSocket: any;
    let randTrader: Trade;
    let trader: Trade;
    beforeAll(() => {
        serverSocket = new SocketServerMock();
        clientSocket1 = new SocketClientMock(serverSocket);
        clientSocket2 = new SocketClientMock(serverSocket);
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
});
