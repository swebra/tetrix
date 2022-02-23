import Phaser, { Scene } from "phaser";
import { Tetromino } from "./Tetromino";
import { TILE_SIZE } from "common/shared";

export class RenderedTetromino {
    // used to wrap around Tetromino and link blocks with sprites, used for rendering and colliding

    inner: Tetromino;
    cellSprites!: Array<Phaser.GameObjects.Rectangle>; // each representing one unit block.

    constructor(tetromino: Tetromino) {
        this.inner = tetromino;
    }

    draw(scene: Scene) {
        if (this.cellSprites) this.cellSprites.forEach((rec) => rec.destroy());
        this.cellSprites = this.inner.cells.map(([row, col]) => {
            // transform relative block position on top of tetromino position
            let x = (this.inner.position[1] + col + 0.5) * TILE_SIZE;
            let y = (this.inner.position[0] + row + 0.5) * TILE_SIZE;

            let rec = scene.add.rectangle(
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
