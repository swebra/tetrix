import { Scene } from "phaser";
import { SceneGameArena } from "./SceneGameArena";

export enum Trade{
    Offer,
    Accept, 
    Progress
}
export class TradeUI {
    tradeType: Trade
    tradeText: Phaser.GameObjects.Text
    offerText: string = "Initiate Trade"
    acceptText: string = "Accept Trade"
    progressText: string = "Waiting Trade"
    constructor(scene: SceneGameArena) {
      const  y = 50;
      this.tradeType = Trade.Offer;
      this.tradeText = scene.add.text(20, y, this.offerText, {fontSize: `20px`, fontFamily: "VT323"});
    }
    public displayOffer() {
        this.tradeType = Trade.Offer;
        this.tradeText.setText(this.offerText)
    }
    public displayAccept() {
        this.tradeType = Trade.Accept
        this.tradeText.setText(this.acceptText)
    }
    public displayProgress() {
        this.tradeType = Trade.Progress
        this.tradeText.setText(this.progressText)
    }
}
