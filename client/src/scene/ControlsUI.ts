import { Scene } from "phaser";
import { TILE_SIZE, TILE_SCALE, BOARD_PX } from "common/shared";

export class ControlsUI {
    constructor(scene: Scene) {
        const startX = 2 * TILE_SIZE + 7 * TILE_SCALE;
        const startY = BOARD_PX - 11 * TILE_SIZE;

        const controlInfo = [
            "move left",
            "move right",
            "rotate ccw",
            "rotate cw",
            "soft drop",
        ];

        controlInfo.forEach((str, i) => {
            const y = startY + i * (15 * TILE_SCALE);
            scene.add.image(startX, y, "key", i).setScale(TILE_SCALE);
            scene.add
                .bitmapText(startX + 9 * TILE_SCALE, y, "brawl", str, 31.5)
                .setOrigin(0, 0.5);
        });
    }
}
