import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { GameState } from "../GameState";
import { ScoreboardUI } from "./ScoreboardUI";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameOver";
import { TILE_SCALE, ColoredScore } from "common/shared";

type SocketGameOver = Socket<ToClientEvents, ToServerEvents>;

interface SceneDataGameOver {
    gameState: GameState;
    playerPoints: Array<ColoredScore>;
}

export class SceneGameOver extends Phaser.Scene {
    private playerData!: Array<ColoredScore>;
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

    preload() {
        this.load.image("game-over-border", "assets/game-over-border.png");

        this.load.bitmapFont(
            "brawl",
            "assets/barcade-brawl.png",
            "assets/barcade-brawl.xml"
        );
    }

    create() {
        this.add
            .image(0, 0, "game-over-border")
            .setOrigin(0, 0)
            .setScale(TILE_SCALE);
        new ScoreboardUI(this, this.socket, this.playerData);

        // Clean out any old listeners to avoid accumulation.
        this.socket.removeListener("toSceneWaitingRoom");

        this.socket.on("toSceneWaitingRoom", () => {
            this.gameState.initialize();
            this.scene.start("SceneWaitingRoom", { gameState: this.gameState });
        });
    }
}
