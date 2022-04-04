import { Socket } from "socket.io-client";
import { Scene } from "phaser";

import { ColoredScore, COLORS, BOARD_PX, TILE_SCALE } from "common/shared";
import { ToServerEvents, ToClientEvents } from "common/messages/scoreboard";

type SocketScoreboard = Socket<ToClientEvents, ToServerEvents>;

export class ScoreboardUI {
    private socket: SocketScoreboard;
    private numbers!: { [text: string]: Phaser.GameObjects.BitmapText };

    constructor(
        scene: Scene,
        socket: SocketScoreboard,
        playerData?: Array<ColoredScore>
    ) {
        this.socket = socket;

        if (playerData) {
            this.createFullscreenScoreboard(scene, playerData);
            return;
        }
        this.createScoreboard(scene);
        this.initListeners();
        this.socket.emit("requestScoreboardData");
    }

    /**
     * Initialize listeners
     */
    private initListeners() {
        // Clean up any old listeners from a previous game.
        this.socket.removeListener("updateScoreboard");

        this.socket.on("updateScoreboard", (scores) => {
            this.updateScoreboard(scores);
        });
    }

    /**
     * Create the scoreboard.
     * @param scene The scene to add the scoreboard to
     */
    private createScoreboard(scene: Scene) {
        const startX = BOARD_PX - 92 * TILE_SCALE;
        let startY = 19 * TILE_SCALE;

        scene.add.bitmapText(startX, startY, "brawl", "scoreboard", 31.5);

        this.numbers = Object();
        Object.entries(COLORS)
            .slice(0, 4)
            .forEach(([colorStr, color]) => {
                startY += 55;
                scene.add
                    .bitmapText(startX, startY, "brawl", colorStr, 31.5)
                    .setTint(color);
                this.numbers[colorStr] = scene.add
                    .bitmapText(startX + 360, startY, "brawl", "0", 31.5)
                    .setOrigin(1, 0)
                    .setTint(color);
            });

        startY += 110;
        scene.add.bitmapText(startX, startY, "brawl", "level", 31.5);
        this.numbers["level"] = scene.add
            .bitmapText(startX + 360, startY, "brawl", "1", 31.5)
            .setOrigin(1, 0);
    }

    /**
     * Update the non-fullscreen scoreboard.
     * @param playerPts The array of objects containing player data (color + points).
     */
    private updateScoreboard(playerPts: Array<ColoredScore>) {
        playerPts.forEach((pts) => {
            this.numbers[pts.color].setText(pts.points.toString());
        });
    }

    /**
     * Create a fullscreen scoreboard for the game over scene.
     * @param scene The scene to add the fullscreen scoreboard to
     * @param playerData The array of objects containing player data (color + points).
     */
    public createFullscreenScoreboard(
        scene: Scene,
        playerData: Array<ColoredScore>
    ) {
        const center = BOARD_PX / 2;
        let startY = BOARD_PX / 3 + 0.5;

        scene.add
            .bitmapText(center, startY, "brawl", "game over", 84)
            .setOrigin(0.5);

        playerData.forEach((pts) => {
            startY += 15 * TILE_SCALE;
            const color =
                pts.color in COLORS
                    ? COLORS[<keyof typeof COLORS>pts.color]
                    : 0xffffff;
            scene.add
                .bitmapText(center - 250, startY, "brawl", pts.color, 42)
                .setTint(color);
            scene.add
                .bitmapText(
                    center + 250,
                    startY,
                    "brawl",
                    pts.points.toString(),
                    42
                )
                .setOrigin(1, 0)
                .setTint(color);
        });

        scene.add
            .bitmapText(
                center,
                startY + 35 * TILE_SCALE,
                "brawl",
                "new game starting soon",
                42
            )
            .setOrigin(0.5);
    }
}
