import { GameState } from "./GameState";
import { RenderedTetromino } from "./RenderedTetromino";
import {
    MoveEvent
} from "../../common/message";

export class GameArenaScene extends Phaser.Scene {
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    gameState!: GameState;

    static blockSize: number = 20; // 20px width for a single square block
    currentTetro!: RenderedTetromino;

    frameElapsed: number = 0; // the ms time since the last frame is drawn

    constructor() {
        super({
            key: "GameArenaScene"
        });
    }

    preload() {
    }

    init(data: any) {
        this.gameState = data.gameState;
    }

    create() {
        // keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();

        // play area
        this.add.rectangle(
            25 * GameArenaScene.blockSize,
            25 * GameArenaScene.blockSize,
            10 * GameArenaScene.blockSize,
            50 * GameArenaScene.blockSize,
            0xdddddd
        );
        this.add.rectangle(
            25 * GameArenaScene.blockSize,
            25 * GameArenaScene.blockSize,
            50 * GameArenaScene.blockSize,
            10 * GameArenaScene.blockSize,
            0xdddddd
        );

        console.log("hello");

        // falling, controllable tetromino
        this.currentTetro = new RenderedTetromino(this.gameState.currentTetromino);
        this.currentTetro.draw(this);

        /*
         * for a player on the left side:
         * rec.x = oldrec.y
         * rec.y = height - oldrec.x
         *
         * for a player on the bottom
         * rec.x = width - oldrec.x
         * rec.y = height - oldrec.y
         *
         * for a player on the right
         * rec.x = width - oldrec.y
         * rec.y = oldrec.x
         **/
        // left player
        let renderedPlayerB = new RenderedTetromino(this.gameState.otherPieces[0]);
        renderedPlayerB.xyTransform = (x, y) => {
            return { x: y, y: GameArenaScene.blockSize * 50 - x };
        };

        // down player
        let renderedPlayerC = new RenderedTetromino(this.gameState.otherPieces[1]);
        renderedPlayerC.xyTransform = (x, y) => {
            return { x: GameArenaScene.blockSize * 50 - x, y: GameArenaScene.blockSize * 50 - y };
        };

        // right player
        let renderedPlayerD = new RenderedTetromino(this.gameState.otherPieces[2]);
        renderedPlayerD.xyTransform = (x, y) => {
            return { x: GameArenaScene.blockSize * 50 - y, y: x };
        };

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameState.fall();
                this.currentTetro.draw(this);
                renderedPlayerB.draw(this);
                renderedPlayerC.draw(this);
                renderedPlayerD.draw(this);
            },
            loop: true,
        });

        this.gameState.onPlayerAction = (otherPlayerAction) => {
            this.currentTetro.draw(this);
            renderedPlayerB.draw(this);
            renderedPlayerC.draw(this);
            renderedPlayerD.draw(this);
        }

        this.gameState.updateScoreboard = (playerPoints) => {
            this.updateScoreboard(playerPoints);
        }

        this.gameState.fullScoreboard = (playerPoints) => {
            this.scene.start("FullscreenScoreboard", { playerPoints: playerPoints, blockSize: GameArenaScene.blockSize, gameState: this.gameState });
        }

        console.log("game board: ", this.gameState.board);
    }

    update(time: number, delta: number) {
        // TODO: left and right bound
        this.frameElapsed += delta;
        if (this.frameElapsed > 1000 / 12) {
            // 12 fps
            if (this.cursors.left.isDown) {
                // FIXME gameState is directly modified, pass in keyboard events and use a update() method?
                let [row, col] = this.gameState.currentTetromino.position;

                this.gameState.currentTetromino.position = [row, Math.max(0, col - 1)]; // TODO

                console.log("emit left");
                this.gameState.socket.emit("playerAction", {
                    playerId: this.gameState.playerId,
                    event: MoveEvent.Left,
                });
            } else if (this.cursors.right.isDown) {
                let [row, col] = this.gameState.currentTetromino.position;
                this.gameState.currentTetromino.position = [row, Math.min(50, col + 1)]; // TODO

                this.gameState.socket.emit("playerAction", {
                    playerId: this.gameState.playerId,
                    event: MoveEvent.Right,
                });
            }
            this.currentTetro.draw(this);
            this.frameElapsed = 0;
        }
    }

    private updateScoreboard(playerPts: any) {
        // Wipe the existing scoreboard UI.
        this.add.rectangle(800, 16, 300, 600, 0x000);

        // Add in the updated UI.
        this.add
            .text(685, 16, "Leaderboards", { fontSize: "52px", fontFamily: "VT323" })
            .setTint(0xFF0000);

        let y = 30;

        for (let element of playerPts) {
            y += 50;
            let text = `${element.color}`.padEnd(10) + `${element.points}`;
            this.add
                .text(720, y, text, { fontSize: "32px", fontFamily: "VT323" })
                .setTint(element.hex);
        }
    }
}