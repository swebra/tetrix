import { Scene } from "phaser";
import { SceneGameArena } from "./SceneGameArena";

export enum TradeState{
    NoTrade,
    Offered,
    Accepted,
    Pending
}
export class TradeUI {
    tradeState: TradeState
    tradeText: Phaser.GameObjects.Text
    //Eventually should include who was offering the trade
    tradeMap:  { [key in TradeState]: string} = {[TradeState.NoTrade]: "Initiate Trade", [TradeState.Offered]: "Waiting for trade to happen", [TradeState.Pending]: "Trade is Available", [TradeState.Accepted]: "Trade Accepted"}
    constructor(scene: SceneGameArena) {
      const  y = 50;
      this.tradeState = TradeState.NoTrade;
      this.tradeText = scene.add.text(20, y, this.tradeMap[this.tradeState], {fontSize: `20px`, fontFamily: "VT323"});
    }
    public updateNewTradeState(newTradeState: TradeState, userNum: number | null) {
        this.tradeState = newTradeState;
        if (this.tradeState == TradeState.Pending && userNum != null) {
            this.tradeText.setText(`${this.tradeMap[newTradeState]} from user #${userNum +1}`);
        }
        else {
            this.tradeText.setText(this.tradeMap[newTradeState]);

        }
    }
}
