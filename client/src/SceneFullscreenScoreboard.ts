import Phaser from "phaser";
import { GameState } from "./GameState";
import { ScoreboardUI } from "./ScoreboardUI";

export class SceneFullscreenScoreboard extends Phaser.Scene {
    private playerData!: Array<{ color: string, hex: number, points: number }>;
    private blockSize!: number;
    private gameState!: GameState;
    private scoreboard!: ScoreboardUI;

    constructor () {
        super({
            key: "SceneFullscreenScoreboard"
        });
    }

    init(data: any) {
        this.playerData = data.playerPoints;
        this.blockSize = data.blockSize;
        this.gameState = data.gameState;
    }

    create() {
        // Add in the updated UI.
        this.scoreboard = new ScoreboardUI(this);
        this.scoreboard.createFullscreenScoreboard(this.blockSize, this.playerData);

        this.gameState.startSequence = () => {
            // FIXME: Return to starting sequence here...
        }
    }
}