import { SceneGameArena } from "./SceneGameArena";
import { BOARD_SIZE } from "common/shared";
import { SceneFullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { TextConfig } from "../TextConfig";

import { Socket } from "socket.io-client";
import { ToServerEvents, ToClientEvents } from "common/messages/scoreboard";
import { ColoredScore } from "common/shared";
import { TILE_SIZE } from "common/shared";

type SocketScoreboard = Socket<ToClientEvents, ToServerEvents>;

export class ScoreboardUI {
    private scene: SceneGameArena | SceneFullscreenScoreboard;
    private listOfScores: Array<Phaser.GameObjects.Text>;
    private headerTextConfig: TextConfig;
    private regularTextConfig: TextConfig;
    private socket: SocketScoreboard;

    constructor(SceneGameArena: SceneGameArena | SceneFullscreenScoreboard, socket: SocketScoreboard, shouldLoadScoreboard: boolean = false) {
        this.scene = SceneGameArena;
        this.listOfScores = [];
        this.socket = socket;
        this.initListeners();
        console.log("init scoreboard: ", this.socket)

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

    requestScoreboardData() {
        this.socket.emit("requestScoreboardData");
    }

    initListeners() {
        if (this.socket == null) {
            return;
        }

        this.socket.on("updateScoreboard", (scores) => {
            this.updateScoreboard(scores);
        })
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
    public updateScoreboard(playerPts: Array<ColoredScore>) {
        for (let i = 0; i < playerPts.length; i++) {
            let text = `${playerPts[i].color}`.padEnd(10) + `${playerPts[i].points}`;
            this.listOfScores[i]
                .setText(text)
                .setTint(playerPts[i].hex);
        }
    }

    /**
     * Create a fullscreen scoreboard for the ending sequence.
     * @param TILE_SIZE The block size defined in the game arena.
     * @param playerData The array of objects containing player data (name + points + hex-color).
     */
    public createFullscreenScoreboard(playerData: Array<ColoredScore>) {
        this.scene.add
            .text(BOARD_SIZE * TILE_SIZE / 4, BOARD_SIZE * TILE_SIZE / 4, "Game Over!", { fontSize: "82px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        let y: number = 12 * TILE_SIZE;
        for (let element of playerData) {
            y += 50;
            let text = `${element.color}`.padEnd(20) + `${element.points}`;
            this.scene.add
                .text(11 * TILE_SIZE, y, text, { fontSize: "32px", fontFamily: "VT323" })
                .setTint(element.hex);
        }

        this.scene.add
            .text(5 * TILE_SIZE, y + 70, "New game starting in 30 seconds", { fontSize: "42px", fontFamily: "VT323" })
            .setTint(0xFF0000);
    }
}
