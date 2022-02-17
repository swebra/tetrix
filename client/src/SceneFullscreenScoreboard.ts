import Phaser from "phaser";
import { GameState } from "./GameState";

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
        this.add.rectangle(25 * this.blockSize, 25 * this.blockSize, 50 * this.blockSize, 50 * this.blockSize, 0x000000);

        // Add in the updated UI.
        this.add
            .text(15 * this.blockSize, 10 * this.blockSize, "Game Over!", { fontSize: "82px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        let y = 12 * this.blockSize;

        for (let element of this.playerData) {
            y += 50;
            let text = `${element.color}`.padEnd(20) + `${element.points}`;
            this.add
                .text(16 * this.blockSize, y, text, { fontSize: "32px", fontFamily: "VT323" })
                .setTint(element.hex);
        }

        this.add
            .text(11 * this.blockSize, y + 70, "New game starting in 30 seconds", { fontSize: "42px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        this.gameState.wipeScreen = () => {
            this.add.rectangle(25 * this.blockSize, 25 * this.blockSize, 50 * this.blockSize, 50 * this.blockSize, 0x000000);
        }
    }
}