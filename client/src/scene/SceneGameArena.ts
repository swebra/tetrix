import { GameState } from "../GameState";
import Phaser from "phaser";
import { Tetromino } from "../Tetromino";
import { ScoreboardUI } from "../scene/ScoreboardUI";
import { SpectatorUI } from "../scene/SpectatorUI";

import { Socket } from "socket.io-client";

import { TILE_SCALE } from "common/shared";
import { ToClientEvents, ToServerEvents } from "common/messages/sceneGameArena";
import { ControlsUI } from "./ControlsUI";
import { ActiveEventsUI } from "./ActiveEventsUI";

import { TradeUI } from "./TradeUI";
import { TradeState } from "common/TradeState";

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

    trade!: TradeUI;
    spectator?: SpectatorUI;

    frameTimeElapsed: number = 0; // the ms time since the last frame is drawn

    constructor() {
        super("SceneGameArena");
    }

    preload() {
        this.load.image("arena-border", "assets/arena-border.png");
        this.load.image("container-controls", "assets/container-controls.png");
        this.load.image("container-voting", "assets/container-voting.png");

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
        this.add
            .image(0, 0, "arena-border")
            .setOrigin(0, 0)
            .setScale(TILE_SCALE);

        this.scoreboard = new ScoreboardUI(this, this.socket);
        new ActiveEventsUI(this, this.socket);
        if (this.gameState.playerId != null) {
            this.trade = new TradeUI(this);
            new ControlsUI(this);
        } else {
            this.spectator = new SpectatorUI(this, this.socket);
        }

        // keyboard input
        this.keys = this.input.keyboard.addKeys(
            "w,up,a,left,s,down,d,right,q,z,e,x,shift"
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
        this.socket.removeListener("initPlayer");

        this.socket.on("initPlayer", (playerId) => {
            new ControlsUI(this);
            this.spectator?.destroy();
            this.spectator = undefined;
            this.gameState.initializePlayer(playerId);
        });

        this.socket.on("updateFallRate", (fallRate) => {
            this.updateFallTimer(fallRate);
        });

        this.socket.on("toSceneGameOver", (playerPoints) => {
            this.scene.start("SceneGameOver", {
                gameState: this.gameState,
                playerPoints: playerPoints,
            });
        });

        this.socket.on("updateBoard", (boardState: any) => {
            const monominoesToDraw = this.gameState.fromBoardState(boardState);
            monominoesToDraw.forEach((monomino) => {
                monomino.draw(this);
            });
        });
        // request to sync with other players
        this.socket.emit("requestBoard");
    }

    update(time: number, delta: number) {
        this.frameTimeElapsed += delta;
        // 12 fps
        if (this.frameTimeElapsed > 1000 / this.FRAMERATE) {
            this.updateUserInput();
            this.updateDrawPlayers();
            this.updateFromTradeState();

            this.drawPendingMonominoes();
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

    private drawPendingMonominoes() {
        if (this.gameState.monominoesToDraw.length === 0) return;
        this.gameState.monominoesToDraw.forEach((monomino) =>
            monomino.draw(this)
        );
        this.gameState.monominoesToDraw = [];
    }

    private updateUserInput() {
        let moved = false;
        let tradeChanged = false;

        if (
            (this.keys.a.isDown || this.keys.left.isDown) &&
            this.gameState.playerId != null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.slide(-1) // left
            );
        } else if (
            (this.keys.s.isDown || this.keys.down.isDown) &&
            this.gameState.playerId != null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(Tetromino.fall); // down
        } else if (
            (this.keys.d.isDown || this.keys.right.isDown) &&
            this.gameState.playerId != null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.slide(1) // right
            );
        } else if (
            (this.keys.q.isDown || this.keys.z.isDown) &&
            this.gameState.playerId != null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.rotateCCW // counter clock wise
            );
        } else if (
            (this.keys.e.isDown || this.keys.x.isDown) &&
            this.gameState.playerId != null &&
            !this.gameState.isInOppositeSection()
        ) {
            moved = this.gameState.moveIfCan(
                Tetromino.rotateCW // clock wise
            );
        } else if (this.keys.shift.isDown && this.gameState.playerId != null) {
            if (
                this.gameState.currentTetromino.isTraded ||
                this.trade.tradeState == TradeState.Offered ||
                this.trade.tradeState == TradeState.Accepted
            ) {
                //ignore
            } else if (this.trade.tradeState == TradeState.NoTrade) {
                this.gameState.tradeState = TradeState.Offered;
                this.trade.updateNewTradeState(
                    this.gameState.tradeState,
                    this.gameState.tradingPlayerId
                );
                tradeChanged = true;
            } else if (this.trade.tradeState == TradeState.Pending) {
                this.gameState.tradeState = TradeState.Accepted;
                this.trade.updateNewTradeState(
                    this.gameState.tradeState,
                    this.gameState.tradingPlayerId
                );
                tradeChanged = true;
            }
        }

        if (moved) {
            this.gameState.emitPlayerMove();
        }
        if (tradeChanged) {
            this.gameState.emitTrade();
            //update the trade state immediately on emit
            this.updateFromTradeState();
        }
    }
    private updateFromTradeState() {
        this.trade.updateNewTradeState(
            this.gameState.tradeState,
            this.gameState.tradingPlayerId
        );
        if (this.gameState.currentTetromino.isTraded) {
            this.trade.existingText();
        }
    }

    private updateDrawPlayers() {
        if (this.gameState.playerId != null)
            this.gameState.currentTetromino.draw(this);
        this.gameState.otherTetrominoes.forEach((tetromino) =>
            tetromino.draw(this)
        );
    }

    private updateFalling() {
        if (this.gameState.playerId == null) {
            return;
        }
        if (this.gameState.moveIfCan(Tetromino.fall)) {
            this.gameState.emitPlayerMove();
        } else {
            const currentOwner = this.gameState.currentTetromino.ownerId;
            this.gameState.emitAndPlaceCurrentTetromino();
            this.gameState.updateLineClearing(currentOwner);
        }
    }
}
