import { Scene } from "phaser";
import { BOARD_PX, TILE_SCALE } from "common/shared";

export class ControlsUI {
    constructor(scene: Scene) {
        scene.add
            .image(
                7 * TILE_SCALE,
                BOARD_PX - 100 * TILE_SCALE,
                "container-controls"
            )
            .setOrigin(0, 0)
            .setScale(TILE_SCALE);

        // .5 needed to account for image centering
        const startX = 20.5 * TILE_SCALE;
        const startY = BOARD_PX - 86.5 * TILE_SCALE;

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
                .bitmapText(startX + 9.5 * TILE_SCALE, y, "brawl", str, 31.5)
                .setOrigin(0, 0.5);
        });
    }
}
