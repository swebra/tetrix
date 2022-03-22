import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { GameState } from "../GameState";
import { ScoreboardUI } from "./ScoreboardUI";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameOver";
import { ColoredScore } from "common/shared";

type SocketGameOver = Socket<ToClientEvents, ToServerEvents>;

interface SceneDataGameOver {
    gameState: GameState;
    playerPoints: Array<ColoredScore>;
}

export class SceneGameOver extends Phaser.Scene {
    private playerData!: Array<ColoredScore>;
    private scoreboard!: ScoreboardUI;
    private gameState!: GameState;
    private socket!: SocketGameOver;

    constructor() {
        super("SceneGameOver");
    }

    init(data: SceneDataGameOver) {
        this.gameState = data.gameState;
        this.playerData = data.playerPoints;
        this.socket = this.gameState.socket;
    }

    create() {
        this.scoreboard = new ScoreboardUI(this, this.socket, this.playerData);

        // Clean out any old listeners to avoid accumulation.
        this.socket.removeListener("toSceneWaitingRoom");

        this.socket.on("toSceneWaitingRoom", () => {
            this.scene.start("SceneWaitingRoom", { gameState: this.gameState });
        });
    }
}
