import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { SharedState } from "..";
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
        super("SceneGameOver");
    }

    init(data: SceneDataGameOver) {
        this.sharedData = data;
        this.playerData = data.playerPoints;
        this.socket = data.socket;
    }

    create() {
        // Add in the updated UI.
        this.scoreboard = new ScoreboardUI(this, this.socket);
        this.scoreboard.createFullscreenScoreboard(this.playerData);

        // Clean out any old listeners to avoid accumulation.
        this.socket.removeListener("toSceneWaitingRoom");

        this.socket.on("toSceneWaitingRoom", () => {
            this.scene.start("SceneWaitingRoom", { ...this.sharedData });
        });
    }
}
