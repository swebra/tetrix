import Phaser, { Scene } from "phaser";

import { TILE_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";

export class Monomino {
    public position: [number, number];

    private type: TetrominoType;
    private ownerId!: 0 | 1 | 2 | 3 | null;
    private sprite?: Phaser.GameObjects.Image;

    constructor(
        type: TetrominoType,
        position: [number, number],
        ownerId: 0 | 1 | 2 | 3 | null
    ) {
        this.type = type;
        this.position = position;
        this.setOwnerId(ownerId);
    }

    public destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    public getCopy(): Monomino {
        return new Monomino(this.type, this.position, this.ownerId);
    }

    public setOwnerId(ownerId: 0 | 1 | 2 | 3 | null) {
        this.destroy();
        this.ownerId = ownerId;
    }

    public draw(scene: Scene) {
        const x = this.position[1] * TILE_SIZE;
        const y = this.position[0] * TILE_SIZE;

        if (this.sprite) {
            this.sprite.setPosition(x, y);
            return;
        }

        const spriteInd =
            this.ownerId == null ? 12 : this.ownerId * 3 + (this.type % 3);
        this.sprite = scene.add.image(x, y, "monomino", spriteInd);
        this.sprite.setOrigin(0, 0);
        this.sprite.setScale(TILE_SIZE / 8);
    }
}
