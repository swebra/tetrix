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
    noTradeText: string = "Initiate Trade"
    offeredText: string = "Waiting for trade to happen"
    waitingText: string = "Waiting Trade"
    acceptedText: string = "Accept Trade"
    constructor(scene: SceneGameArena) {
      const  y = 50;
      this.tradeState = TradeState.NoTrade;
      this.tradeText = scene.add.text(20, y, this.noTradeText, {fontSize: `20px`, fontFamily: "VT323"});
    }
    public updateNewTradeState(newTradeState: TradeState) {
        this.tradeState = newTradeState;
        this.tradeText.setText(this.tradeMap[newTradeState]);
    }
}
