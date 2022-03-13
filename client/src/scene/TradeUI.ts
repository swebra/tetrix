import { SceneGameArena } from "./SceneGameArena";
import { PlayerColor } from "common/PlayerAttributes";

export enum TradeState {
    NoTrade,
    Offered,
    Accepted,
    Pending,
}
export class TradeUI {
    tradeState: TradeState;
    tradeText: Phaser.GameObjects.Text;
    //Eventually should include who was offering the trade
    tradeMap: { [key in TradeState]: string } = {
        [TradeState.NoTrade]: "SHIFT to Trade",
        [TradeState.Offered]: "Trade Requested",
        [TradeState.Pending]: "SHIFT to Trade with",
        //likely empty text when accepted
        [TradeState.Accepted]: "",
    };
    constructor(scene: SceneGameArena) {
        const y = 50;
        this.tradeState = TradeState.NoTrade;
        this.tradeText = scene.add.text(20, y, this.tradeMap[this.tradeState], {
            fontSize: `20px`,
            fontFamily: "VT323",
        });
    }
    public updateNewTradeState(
        newTradeState: TradeState,
        userNum: number | null
    ) {
        this.tradeState = newTradeState;
        if (this.tradeState == TradeState.Pending && userNum != null) {
            this.tradeText.setText(
                `${this.tradeMap[newTradeState]} ${PlayerColor[userNum]}`
            );
        } else {
            this.tradeText.setText(this.tradeMap[newTradeState]);
        }
    }
    public clearText() {
        this.tradeText.setText("");
    }
}
