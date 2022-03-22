import { GameState } from "../GameState";
import Phaser from "phaser";
import { Tetromino } from "../Tetromino";
import { ScoreboardUI } from "../scene/ScoreboardUI";
import { SpectatorUI } from "../scene/SpectatorUI";
import { WebFontFile } from "../plugins/WebFontFile";

import { Socket } from "socket.io-client";

import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameArena";
import { ControlsUI } from "./ControlsUI";

type SocketGame = Socket<ToClientEvents, ToServerEvents>;

interface SceneDataGameArena {
    gameState: GameState;
}

export class SceneGameArena extends Phaser.Scene {
    FRAMERATE: number = 12;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    keys!: any; // Phaser doesn't provide nice typing for keyboard.addKeys
    gameState!: GameState;
    socket!: SocketGame;
    fallRateTimer!: Phaser.Time.TimerEvent | null;

    scoreboard!: ScoreboardUI;
    spectator!: SpectatorUI;
    controls!: ControlsUI | null;

    frameTimeElapsed: number = 0; // the ms time since the last frame is drawn

    constructor() {
        super("SceneGameArena");
    }

    preload() {
        this.load.addFile(new WebFontFile(this.load, "VT323"));
        this.load.bitmapFont(
            "brawl",
            "assets/barcade-brawl.png",
            "assets/barcade-brawl.xml"
        );

        this.load.spritesheet("monomino", "assets/monomino.png", {
            frameWidth: 8,
            frameHeight: 8,
        });
        this.load.spritesheet("key", "assets/keys.png", {
            frameWidth: 13,
            frameHeight: 13,
        });
    }

    init(data: SceneDataGameArena) {
        this.gameState = data.gameState;
        this.socket = this.gameState.socket;
    }

    create() {
        this.scoreboard = new ScoreboardUI(this, this.socket);
        this.spectator = new SpectatorUI(this, this.socket);

        // TODO: need to make sure playerId is valid when this scene is started
        new ControlsUI(this);

        // keyboard input
        this.keys = this.input.keyboard.addKeys(
            "w,up,a,left,s,down,d,right,q,z,e,x"
        );

        // Initialize the fall rate to 1000 until we get confirmation from the server.
        this.updateFallTimer(1000);
        this.socket.emit("requestFallRate");

        this.initListeners();

        // Initial board drawing
        this.gameState.board.forEach((row) =>
            row.forEach((monomino) => {
                if (monomino) {
                    monomino.draw(this);
                }
            })
        );
    }

    private initListeners() {
        // Clean out any old listeners to avoid accumulation.
        this.socket.removeListener("toSceneGameOver");
        this.socket.removeListener("updateFallRate");

        this.socket.on("updateFallRate", (fallRate) => {
            this.updateFallTimer(fallRate);
        });

        this.socket.on("toSceneGameOver", (playerPoints) => {
            this.scene.start("SceneGameOver", {
                gameState: this.gameState,
                playerPoints: playerPoints,
            });
        });
    }

    update(time: number, delta: number) {
        this.frameTimeElapsed += delta;

        // 12 fps
        if (this.frameTimeElapsed > 1000 / this.FRAMERATE) {
            this.updateUserInput();
            this.updateDrawPlayers();

            // start next frame
            this.frameTimeElapsed = 0;
        }
    }

    private updateFallTimer(interval: number) {
        if (this.fallRateTimer) {
            this.time.removeEvent(this.fallRateTimer);
        }

        this.fallRateTimer = this.time.addEvent({
            delay: interval,
            callback: () => this.updateFalling(),
            loop: true,
        });
    }

    private updateUserInput() {
        let moved = false;
        if (
            (this.keys.a.isDown || this.keys.left.isDown) &&
            this.gameState.playerId !== null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.slide(-1) // left
            );
        } else if (
            (this.keys.d.isDown || this.keys.right.isDown) &&
            this.gameState.playerId !== null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.slide(1) // right
            );
        } else if (
            (this.keys.q.isDown || this.keys.z.isDown) &&
            this.gameState.playerId !== null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.rotateCCW // counter clock wise
            );
        } else if (
            (this.keys.e.isDown || this.keys.x.isDown) &&
            this.gameState.playerId !== null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.rotateCW // clock wise
            );
        }

        if (moved) {
            this.gameState.emitPlayerMove();
        }
    }

    private updateDrawPlayers() {
        this.gameState.currentTetromino.draw(this);
        this.gameState.otherTetrominoes.forEach((tetromino) =>
            tetromino.draw(this)
        );
    }

    private updateFalling() {
        if (this.gameState.moveIfCan(Tetromino.fall)) {
            this.gameState.emitPlayerMove();
        } else {
            this.gameState.emitAndPlaceCurrentTetromino();
        }
    }
}
