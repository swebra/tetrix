import { ToClientEvents, ToServerEvents } from "common/messages/trade";
import { TetrominoType } from "common/TetrominoType";
import { Socket } from "socket.io";

export class Trade {
    //currentOffer should be a socket
    currentOfferer: Socket<ToClientEvents, ToServerEvents> | null = null;
    tradeActive: boolean = false;
    currentTradeOffer: TetrominoType | null = null;
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
            acceptingSocket.emit("sendTradePiece", this.currentTradeOffer);
            this.currentOfferer.emit("sendTradePiece", acceptingTetromino);
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
