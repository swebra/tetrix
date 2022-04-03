import { Scene } from "phaser";
import { TILE_SCALE, COLORS, TILE_SIZE } from "common/shared";
import { TetrominoType } from "common/TetrominoType";
import { TradeState } from "common/TradeState";
import { Tetromino } from "../Tetromino";

export class TradeUI {
    scene: Scene;
    playerId: 0 | 1 | 2 | 3 | null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    lastUpdateArgs?: Array<any>;

    tradeState: TradeState;
    drawControls: boolean;

    offer: Phaser.GameObjects.BitmapText;
    tetrominoPosition: [number, number];
    tetromino?: Tetromino;
    controlImg?: Phaser.GameObjects.Image;
    control?: Phaser.GameObjects.BitmapText;

    constructor(scene: Scene, playerId: 0 | 1 | 2 | 3 | null) {
        this.scene = scene;
        this.playerId = playerId;
        this.tradeState = TradeState.NoTrade;
        this.drawControls = true;

        const centerX = 56 * TILE_SCALE;
        let startY = 33 * TILE_SCALE;
        this.offer = scene.add
            .bitmapText(centerX, startY, "brawl", "", 31.5)
            .setOrigin(0.5, 0);

        startY += 10 * TILE_SCALE;
        this.tetrominoPosition = [startY / TILE_SIZE, centerX / TILE_SIZE];

        if (this.playerId != null) {
            this.addControls(playerId as 0 | 1 | 2 | 3);
        }
    }

    public addControls(playerId: 0 | 1 | 2 | 3) {
        this.playerId = playerId;

        this.scene.add
            .image(7 * TILE_SCALE, 72 * TILE_SCALE, "container-trade-controls")
            .setOrigin(0, 0)
            .setScale(TILE_SCALE);

        const startX = 14 * TILE_SCALE;
        const y = 85.5 * TILE_SCALE; // .5 needed to account for image centering

        this.controlImg = this.scene.add
            .image(startX, y, "key-shift")
            .setOrigin(0, 0.5)
            .setScale(TILE_SCALE)
            .setVisible(false);
        this.control = this.scene.add
            .bitmapText(startX + 62.5 * TILE_SCALE, y, "brawl", "", 31.5)
            .setOrigin(0.5);
    }

    public update(
        tradeState: TradeState,
        drawControls: boolean,
        tetrominoType: TetrominoType | null,
        tradingPlayerId: 0 | 1 | 2 | 3 | null
    ) {
        /* eslint prefer-rest-params: "off" */
        const argsArr = [...arguments];
        if (
            this.lastUpdateArgs &&
            this.lastUpdateArgs.every((val, i) => argsArr[i] == val)
        ) {
            return;
        }
        this.lastUpdateArgs = argsArr;

        switch (tradeState) {
            case TradeState.NoTrade:
            case TradeState.Accepted:
                this.offer.setText("no offers").clearTint();
                if (this.tetromino) {
                    this.tetromino.destroy();
                }
                this.updateControls(drawControls, "offer");
                break;
            case TradeState.Offered:
                if (this.playerId == null || tetrominoType == null) return;
                this.offer.setText("you offered").clearTint();
                this.showTetromino(tetrominoType, this.playerId);
                this.updateControls(false, "");
                break;
            case TradeState.Pending:
                if (tradingPlayerId == null || tetrominoType == null) return;
                this.offer
                    .setText("offering")
                    .setTint(Object.values(COLORS)[tradingPlayerId]);
                this.showTetromino(tetrominoType, tradingPlayerId);
                this.updateControls(drawControls, "accept");
                break;
        }
    }

    private updateControls(drawControls: boolean, controlStr: string) {
        if (!this.controlImg || !this.control) {
            return;
        }

        if (drawControls) {
            this.controlImg.setVisible(true);
            this.control.setText(controlStr);
        } else {
            this.controlImg.setVisible(false);
            this.control.setText("");
        }
    }

    private showTetromino(tetrominoType: TetrominoType, owner: 0 | 1 | 2 | 3) {
        if (this.tetromino) {
            this.tetromino.destroy();
        }

        this.tetromino = new Tetromino(tetrominoType, owner);
        const [row, col] = this.tetrominoPosition;
        this.tetromino.setRotatedPosition(
            [row, col - Tetromino.shapes[tetrominoType].width / 2],
            0
        );
        this.tetromino.draw(this.scene);
    }
}
