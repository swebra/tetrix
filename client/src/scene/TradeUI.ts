import { SceneGameArena } from "./SceneGameArena";
import { PlayerColor } from "common/PlayerAttributes";
import { TradeState } from "common/TradeState";

export class TradeUI {
    tradeState: TradeState;
    tradeText: Phaser.GameObjects.BitmapText;
    tradingUser: number | null;
    //Eventually should include who was offering the trade
    tradeMap: { [key in TradeState]: string } = {
        [TradeState.NoTrade]: "shift to trade",
        [TradeState.Offered]: "trade requested",
        [TradeState.Pending]: "shift to trade with",
        //likely empty text when accepted
        [TradeState.Accepted]: "",
    };
    constructor(scene: SceneGameArena) {
        const y = 50;
        this.tradeState = TradeState.NoTrade;
        this.tradingUser = null;
        this.tradeText = scene.add.bitmapText(
            20,
            y,
            "brawl",
            this.tradeMap[this.tradeState]
        );
    }
    public updateNewTradeState(
        newTradeState: TradeState,
        userNum: number | null
    ) {
        this.tradeState = newTradeState;
        if (this.tradeState == TradeState.Pending && userNum != null) {
            this.tradeText.setText(
                `${this.tradeMap[newTradeState]} ${PlayerColor[
                    userNum
                ].toLowerCase()}`
            );
            this.tradingUser = userNum;
        } else {
            this.tradeText.setText(this.tradeMap[newTradeState]);
            this.tradingUser = null;
        }
    }
    public existingText() {
        if (this.tradeState == TradeState.Pending && this.tradingUser != null) {
            this.tradeText.setText(
                `${PlayerColor[this.tradingUser].toLowerCase()} wants to trade`
            );
        } else {
            this.tradeText.setText("");
        }
    }
}
