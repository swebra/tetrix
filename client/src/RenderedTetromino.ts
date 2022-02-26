import Phaser, { Scene } from "phaser";
import { Tetromino } from "./Tetromino";
import { TILE_SIZE } from "common/shared";

export class RenderedTetromino {
    // used to wrap around Tetromino and link blocks with sprites, used for rendering and colliding

    inner: Tetromino;
    tileSprites!: Array<Phaser.GameObjects.Rectangle>; // each representing one unit block.

    constructor(tetromino: Tetromino) {
        this.inner = tetromino;
    }

    draw(scene: Scene) {
        if (this.tileSprites) this.tileSprites.forEach((rec) => rec.destroy());
        this.tileSprites = this.inner.tiles.map(([row, col]) => {
            // transform relative block position on top of tetromino position
            const x = (this.inner.position[1] + col + 0.5) * TILE_SIZE;
            const y = (this.inner.position[0] + row + 0.5) * TILE_SIZE;

            const rec = scene.add.rectangle(
                x,
                y,
                TILE_SIZE,
                TILE_SIZE,
                0xff0000
            );
            return rec;
        });
    }
}
