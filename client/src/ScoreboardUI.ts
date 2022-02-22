import { SceneGameArena } from "./SceneGameArena";
import { BOARD_SIZE } from "../../common/shared";
import { SceneFullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { TextConfig } from "./TextConfig";

export class ScoreboardUI {
    private scene: SceneGameArena | SceneFullscreenScoreboard;
    private listOfScores: Array<Phaser.GameObjects.Text>;
    private headerTextConfig: TextConfig;
    private regularTextConfig: TextConfig;

    constructor(SceneGameArena: SceneGameArena | SceneFullscreenScoreboard, shouldLoadScoreboard: boolean = false) {
        this.scene = SceneGameArena;
        this.listOfScores = [];

        // Configs used for the different text's.
        this.headerTextConfig = {
            fontSize: `${BOARD_SIZE}px`,
            fontFamily: "VT323"
        };
        this.regularTextConfig = {
            fontSize: `${BOARD_SIZE / 2}px`,
            fontFamily: "VT323"
        };

        if (shouldLoadScoreboard) {
            this.loadScoreboard();
        }
    }

    /**
     * Load in the scoreboard.
     */
    public loadScoreboard() {
        // Add in the 'leaderboard' header.
        this.scene.add
            .text(14 * BOARD_SIZE + 25, 16, "Leaderboard", this.headerTextConfig)
            .setTint(0xFF0000);

        // Add in the individual player scores (initially 0).
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

    /**
     * Update the mini scoreboard found on the main game arena.
     * @param playerPts The array of objects containing player data (name + points + hex-color).
     */
    public updateScoreboard(playerPts: Array<{ color: string, hex: number, points: number }>) {
        for (let i = 0; i < playerPts.length; i++) {
            let text = `${playerPts[i].color}`.padEnd(10) + `${playerPts[i].points}`;
            this.listOfScores[i]
                .setText(text)
                .setTint(playerPts[i].hex);
        }
    }

    /**
     * Create a fullscreen scoreboard for the ending sequence.
     * @param blockSize The block size defined in the game arena.
     * @param playerData The array of objects containing player data (name + points + hex-color).
     */
    public createFullscreenScoreboard(blockSize: number, playerData: Array<{ color: string, hex: number, points: number }>) {
        this.scene.add
            .text(BOARD_SIZE * blockSize / 4, BOARD_SIZE * blockSize / 4, "Game Over!", { fontSize: "82px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        let y: number = 12 * blockSize;
        for (let element of playerData) {
            y += 50;
            let text = `${element.color}`.padEnd(20) + `${element.points}`;
            this.scene.add
                .text(11 * blockSize, y, text, { fontSize: "32px", fontFamily: "VT323" })
                .setTint(element.hex);
        }

        this.scene.add
            .text(5 * blockSize, y + 70, "New game starting in 30 seconds", { fontSize: "42px", fontFamily: "VT323" })
            .setTint(0xFF0000);
    }
}
