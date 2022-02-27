import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { SharedState } from "..";
import { GameState } from "../GameState";
import { ScoreboardUI } from "./ScoreboardUI";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameOver";
import { ColoredScore } from "common/shared";

type SocketGameOver = Socket<ToClientEvents, ToServerEvents>;
type SceneDataGameOver = SharedState & { playerPoints: Array<ColoredScore> };
export class SceneGameOver extends Phaser.Scene {
    private playerData!: Array<ColoredScore>;
    private scoreboard!: ScoreboardUI;
    private sharedData!: SharedState;
    private socket!: SocketGameOver;

    constructor() {
        super({
            key: "SceneGameOver",
        });
    }

    init(data: SceneDataGameOver) {
        this.sharedData = data;
        this.playerData = data.playerPoints;
        this.socket = this.sharedData.socket;
    }

    create() {
        // Add in the updated UI.
        this.scoreboard = new ScoreboardUI(this, this.socket);
        this.scoreboard.createFullscreenScoreboard(this.playerData);

        this.socket.on("toSceneWaitingRoom", () => {
            // Clean up the listeners to avoid accumulation.
            this.socket.removeAllListeners();

            this.scene.start("SceneWaitingRoom", { ...this.sharedData });
        });
    }
}
