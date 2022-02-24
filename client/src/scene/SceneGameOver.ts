import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { SharedState } from "..";
import { GameState } from "../GameState";
import { ScoreboardUI } from "./ScoreboardUI";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameOver";
import { ColoredScore } from "common/shared";

type SocketGameOver = Socket<ToClientEvents, ToServerEvents>;
type SceneDataGameOver = SharedState & {playerPoints: Array<ColoredScore>};
export class SceneGameOver extends Phaser.Scene {
    private playerData!: Array<ColoredScore>;
    private gameState!: GameState;
    private scoreboard!: ScoreboardUI;
    private socket!: SocketGameOver;

    constructor () {
        super({
            key: "SceneGameOver"
        });
    }

    init(data: SceneDataGameOver) {
        this.playerData = data.playerPoints;
        this.gameState = data.gameState;
        this.socket = data.socket;
    }

    create() {
        // Add in the updated UI.
        this.scoreboard = new ScoreboardUI(this, this.socket);
        this.scoreboard.createFullscreenScoreboard(this.playerData);

        this.socket.on("toSceneWaitingRoom", () => {
            this.scene.start("SceneWaitingRoom", {gameState: this.gameState, socket: this.socket});
            // FIXME: Possibly remove all our listeners here?
        });
    }
}