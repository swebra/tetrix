import { SceneGameArena } from "./SceneGameArena";
import { BOARD_SIZE } from "../../common/shared";

export class ScoreboardUI {
    private scene: SceneGameArena;
    private listOfScores: any[];
    private headerTextConfig: any;
    private regularTextConfig: any;

    constructor(SceneGameArena: SceneGameArena) {
        this.scene = SceneGameArena;
        this.listOfScores = [];

        // Configs used for the different text's.
        this.headerTextConfig = {
            fontSize: `${BOARD_SIZE}px`,
            fontFamily: "VT323"
        };
        this.regularTextConfig = {
            fontSize: `${BOARD_SIZE/2}px`,
            fontFamily: "VT323"
        };

        // Add in the 'leaderboard' header.
        this.scene.add
            .text(14 * BOARD_SIZE + 25, 16, "Leaderboard", this.headerTextConfig)
            .setTint(0xFF0000);

        let y: number = BOARD_SIZE * 1.5;
        this.listOfScores[0] = this.scene.add
                                .text(14 * BOARD_SIZE + 60, y, "Orange".padEnd(10) + "0", this.regularTextConfig)
                                .setTint(0xFFA500);

        this.listOfScores[1] = this.scene.add
                                .text(14 * BOARD_SIZE + 60, y + 30, "Green".padEnd(10) + "0", this.regularTextConfig)
                                .setTint(0x00FF00);

        this.listOfScores[2] = this.scene.add
                                .text(14 * BOARD_SIZE + 60, y + 60, "Pink".padEnd(10) + "0", this.regularTextConfig)
                                .setTint(0xFF00FF);

        this.listOfScores[3] = this.scene.add
                                .text(14 * BOARD_SIZE + 60, y + 90, "Blue".padEnd(10) + "0", this.regularTextConfig)
                                .setTint(0x00BFFF);

        this.listOfScores[4] = this.scene.add
                                .text(14 * BOARD_SIZE + 60, y + 120, "Level".padEnd(10) + "1", this.regularTextConfig)
                                .setTint(0xFFFFFF);
    }

    public updateScoreboard(playerPts: any) {
        // Add in the updated UI.
        let y: number = 30;
        for (let i = 0; i < playerPts.length; i++) {
            let text = `${playerPts[i].color}`.padEnd(10) + `${playerPts[i].points}`;
            this.listOfScores[i]
                .setText(text)
                .setTint(playerPts[i].hex);
        }
    }
}