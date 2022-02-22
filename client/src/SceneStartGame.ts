import Phaser from "phaser";
import { GameState } from "./GameState";
import { BOARD_SIZE } from "common/shared";

export class SceneStartGame extends Phaser.Scene {
    private playersNeededText!: any;
    private button!: any;
    private gameState!: GameState;

    constructor () {
        super({
            key: "SceneStartGame"
        });
    }

    init(data: any) {
        this.gameState = data.gameState;
    }

    create() {
        this.add.text(BOARD_SIZE * 2.5, BOARD_SIZE * 5, "A new game is starting soon", { fontSize: "52px", fontFamily: "VT323" })
            .setTint(0xFF0000);
        this.add.text(BOARD_SIZE * 4.5, BOARD_SIZE * 6.5, "Click the button below to join!", { fontSize: "32px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        this.button = this.add.text(BOARD_SIZE * 6.5, BOARD_SIZE * 9, "> Join <", { fontSize: "82px", fontFamily: "VT323" })
            .setTint(0x53bb74)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => { this.isHovered(this.button, true) })
            .on("pointerout", () => { this.isHovered(this.button, false) })
            .on("pointerdown", () => { this.requestJoinGame() });

        this.playersNeededText = this.add.text(BOARD_SIZE * 6.7, BOARD_SIZE * 12, "Waiting on 4 more player(s)", { fontSize: "22px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        // Fixme: needs to go into the gameState handler thing.
        // this.scene.start("SceneGameArena", { gameState: this.gameState });
    }

    private isHovered(button: any, isHovered: boolean) {
        if (isHovered) {
            button.setTint(0xd4cb22);
        } else {
            button.setTint(0x53bb74);
        }
    }

    private requestJoinGame() {
        this.button.setText("");
    }

    private newPlayerJoined(playersInQueue: number) {
        this.playersNeededText.setText(`Waiting on ${4 - playersInQueue} more player(s)`);
    }
}