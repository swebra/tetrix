import Phaser from "phaser";
import { GameState } from "./GameState";
import { BOARD_SIZE } from "common/shared";

export class SceneFullscreenScoreboard extends Phaser.Scene {
    private playerData!: any;
    private blockSize!: number;
    private gameState!: GameState;

    constructor () {
        super({
            key: "SceneFullscreenScoreboard"
        });
    }

    init(data: any) {
        this.playerData = data.playerPoints;
        this.blockSize = data.blockSize;
        this.gameState = data.gameState;
    }

    create() {
        // Wipe the screen.
        this.add.rectangle(BOARD_SIZE * this.blockSize, BOARD_SIZE * this.blockSize, BOARD_SIZE * this.blockSize, BOARD_SIZE * this.blockSize, 0x000000);

        // Add in the updated UI.
        this.add
            .text(BOARD_SIZE * this.blockSize / 4, BOARD_SIZE * this.blockSize / 4, "Game Over!", { fontSize: "82px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        let y: number = 12 * this.blockSize;
        for (let element of this.playerData) {
            y += 50;
            let text = `${element.color}`.padEnd(20) + `${element.points}`;
            this.add
                .text(11 * this.blockSize, y, text, { fontSize: "32px", fontFamily: "VT323" })
                .setTint(element.hex);
        }

        this.add
            .text(5 * this.blockSize, y + 70, "New game starting in 30 seconds", { fontSize: "42px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        this.gameState.wipeScreen = () => {
            this.add.rectangle(25 * this.blockSize, 25 * this.blockSize, 50 * this.blockSize, 50 * this.blockSize, 0x000000);
        }
    }
}