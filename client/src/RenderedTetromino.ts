import { Scene } from "phaser";
import { Tetromino } from "./Tetromino";
import { GameArenaScene } from "./SceneGameArena";

export class RenderedTetromino {
    // used to wrap around Tetromino and link blocks with sprites, used for rendering and colliding

    inner: Tetromino;
    cellSprites!: Array<Phaser.GameObjects.Rectangle>; // each representing one unit block.

    // transform the top-down falling tetromino to another direction. used for other players than the current one.
    xyTransform?: (x: number, y: number) => { x: number; y: number };

    constructor(tetromino: Tetromino) {
        this.inner = tetromino;
    }

    draw(scene: Scene) {
        if (this.cellSprites) this.cellSprites.forEach((rec) => rec.destroy());
        this.cellSprites = this.inner.cells.map(([row, col]) => {
            // transform relative block position on top of tetromino position
            let x = (this.inner.position[1] + col + 0.5) * GameArenaScene.blockSize;
            let y = (this.inner.position[0] + row + 0.5) * GameArenaScene.blockSize;

            if (this.xyTransform) {
                // rotate, needed for other players
                ({ x, y } = this.xyTransform(x, y));
            }

            let rec = scene.add.rectangle(
                x,
                y,
                GameArenaScene.blockSize,
                GameArenaScene.blockSize,
                0xff0000
            );
            return rec;
        });
    }
}