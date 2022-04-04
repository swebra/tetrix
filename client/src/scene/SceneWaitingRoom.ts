import Phaser from "phaser";
import { Socket } from "socket.io-client";

import { BOARD_SIZE, BOARD_PX, TILE_SCALE, COLORS } from "common/shared";
import {
    ToClientEvents,
    ToServerEvents,
} from "common/messages/sceneWaitingRoom";
import { GameState } from "../GameState";

type SocketWaitingRoom = Socket<ToClientEvents, ToServerEvents>;

interface SceneDataWaitingRoom {
    gameState: GameState;
}

export class SceneWaitingRoom extends Phaser.Scene {
    private socket!: SocketWaitingRoom;
    private gameState!: GameState;
    private playersRemaining!: Phaser.GameObjects.BitmapText;
    private headerText!: Phaser.GameObjects.BitmapText;
    private button!: Phaser.GameObjects.BitmapText;

    constructor() {
        super("SceneWaitingRoom");
    }

    init(data: SceneDataWaitingRoom) {
        this.gameState = data.gameState;
        this.socket = this.gameState.socket;
    }

    preload() {
        this.load.bitmapFont(
            "brawl",
            "assets/barcade-brawl.png",
            "assets/barcade-brawl.xml"
        );
        this.load.image("border", "assets/waiting-room-border.png");
        this.load.image("logo", "assets/logo.png");
    }

    create() {
        this.initListeners();
        this.socket.emit("requestCurrentScene");
    }

    /**
     * Initialize event listeners.
     */
    private initListeners() {
        // Remove old listeners to avoid accumulation.
        this.socket.removeListener("updateRemainingPlayers");
        this.socket.removeListener("toSceneWaitingRoom");
        this.socket.removeListener("toSceneGameArena");
        this.socket.removeListener("toSceneGameOver");

        // Assign the new listeners.
        this.socket.on("toSceneWaitingRoom", () => {
            this.renderWaitingRoom();
        });

        this.socket.on("toSceneGameArena", () => {
            this.scene.start("SceneGameArena", { gameState: this.gameState });
        });

        this.socket.on("toSceneGameOver", (playerPoints) => {
            this.scene.start("SceneGameOver", {
                gameState: this.gameState,
                playerPoints,
            });
        });
    }

    /**
     * Render in the waiting room if it's the active scene.
     */
    private renderWaitingRoom() {
        const center = BOARD_PX / 2;

        this.add
            .image(0, 0, "border")
            .setOrigin(0, 0)
            .setScale((TILE_SCALE * BOARD_SIZE) / 8);
        this.add.image(center, 560, "logo").setScale(TILE_SCALE * 4);

        this.headerText = this.add
            .bitmapText(
                center,
                750,
                "brawl",
                "click the button below to join",
                31.5
            )
            .setOrigin(0.5);

        this.button = this.add
            .bitmapText(center, 825, "brawl", "> join <", 31.5)
            .setOrigin(0.5)
            .setTint(COLORS.green)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                this.button.setTint(COLORS.lGreen);
            })
            .on("pointerout", () => {
                this.button.setTint(COLORS.green);
            })
            .on("pointerup", () => {
                this.requestJoinGame();
            });

        this.playersRemaining = this.add
            .bitmapText(center, 900, "brawl", "", 31.5)
            .setOrigin(0.5);
        this.updatePlayersRemaining(4);

        this.socket.on("updateRemainingPlayers", (remainingPlayers: number) => {
            this.updatePlayersRemaining(remainingPlayers);
        });
        this.socket.emit("requestRemainingPlayers");
    }

    /**
     * Updates the players remaining text
     * @param players The number of players remaining
     */
    private updatePlayersRemaining(players: number) {
        this.playersRemaining.setText(`waiting on ${players} more player(s)`);
    }

    /**
     * If the join button was clicked, update UI and send a join request.
     */
    private requestJoinGame() {
        this.headerText.destroy();
        this.button
            .removeInteractive()
            .setText("join request sent")
            .setTint(COLORS.green);
        this.socket.emit("joinQueue");
    }
}
