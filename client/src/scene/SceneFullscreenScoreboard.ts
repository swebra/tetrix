import Phaser from "phaser";
import { Socket } from "socket.io-client";
import { SharedState } from "..";
import { GameState } from "../GameState";
import { ScoreboardUI } from "./ScoreboardUI";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneFullscreenScoreboard";
import { ColoredScore } from "common/shared";

type SocketFullscreenScoreboard = Socket<ToClientEvents, ToServerEvents>;
type SceneDataFullscreen = SharedState & {playerPoints: Array<ColoredScore>};
export class SceneFullscreenScoreboard extends Phaser.Scene {
    private playerData!: Array<ColoredScore>;
    private gameState!: GameState;
    private scoreboard!: ScoreboardUI;
    private socket!: SocketFullscreenScoreboard;

    constructor () {
        super({
            key: "SceneFullscreenScoreboard"
        });
    }

    init(data: SceneDataFullscreen) {
        this.playerData = data.playerPoints;
        this.gameState = data.gameState;
        this.socket = data.socket;
    }

    create() {
        // Add in the updated UI.
        this.scoreboard = new ScoreboardUI(this, this.socket);
        this.scoreboard.createFullscreenScoreboard(this.playerData);

        this.socket.on("toSceneStartGame", () => {
            this.scene.start("SceneStartGame", { gameState: this.gameState, socket: this.socket });
            // FIXME: Possibly remove all our listeners here?
        });
    }
}