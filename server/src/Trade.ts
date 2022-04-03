import { ToClientEvents, ToServerEvents } from "common/messages/trade";
import { TetrominoType } from "common/TetrominoType";
import { emitWarning } from "process";
import { Socket } from "socket.io";

export class Trade {
    currentOfferer: Socket<ToClientEvents, ToServerEvents> | null = null;
    tradeActive: boolean;
    currentTradeOffer: TetrominoType | null;
    pairNum: 1 | 2 | null;

    constructor(pairNum: 1 | 2 | null = null) {
        this.currentOfferer = null;
        this.tradeActive = false;
        this.currentTradeOffer = null;
        this.pairNum = pairNum;
    }
    public addTrade(
        socket: Socket<ToClientEvents, ToServerEvents>,
        tradeOffer: TetrominoType
    ) {
        if (!this.currentOfferer) {
            this.currentOfferer = socket;
            this.currentTradeOffer = tradeOffer;
            this.tradeActive = true;
        } else if (
            this.currentOfferer &&
            this.currentTradeOffer &&
            this.tradeActive
        ) {
            const acceptingSocket = socket;
            const acceptingTetromino = tradeOffer;
            if (this.pairNum) {
                acceptingSocket.emit(
                    "sendRandomPiece",
                    this.currentTradeOffer,
                    this.pairNum
                );
                this.currentOfferer.emit(
                    "sendRandomPiece",
                    acceptingTetromino,
                    this.pairNum
                );
                this.clearTrade();
            } else {
                acceptingSocket.emit("sendTradePiece", this.currentTradeOffer);
                this.currentOfferer.emit("sendTradePiece", acceptingTetromino);
            }

            console.log(
                `The pieces ${this.currentTradeOffer} and ${acceptingTetromino} were sent`
            );
        }
    }
    public clearTrade() {
        this.tradeActive = false;
        this.currentOfferer = null;
        this.currentTradeOffer = null;
    }
}
