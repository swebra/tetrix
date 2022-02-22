import { GameState } from "./GameState";
import Phaser, { GameObjects } from "phaser";
import { RenderedTetromino } from "./RenderedTetromino";
import { BOARD_SIZE } from "../../common/shared";
import { cloneDeep } from "lodash";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { rotateCoords } from "./utils";
import { MoveEvent } from "common/message";
import { ScoreboardUI } from "./ScoreboardUI";

export class SceneGameArena extends Phaser.Scene {
    FRAMERATE: number = 12;

    keys!: any; // Phaser doesn't provide nice typing for keyboard.addKeys
    gameState!: GameState;

    static blockSize: number = 20; // 20px width for a single square block
    currentTetro!: RenderedTetromino;
    otherTetros!: Array<RenderedTetromino>;
    renderedBoard!: Array<Array<GameObjects.Rectangle | null>>;

    scoreboard!: ScoreboardUI;

    frameTimeElapsed: number = 0; // the ms time since the last frame is drawn

    constructor() {
        super({
            key: "GameArenaScene"
        });
    }

    preload() { }

    init(data: any) {
        this.gameState = data.gameState;
    }

    create() {
        this.gameState = new GameState();
        this.scoreboard = new ScoreboardUI(this, true);
        this.gameState.requestScoreboardData();

        // initialize an empty rendered board
        this.renderedBoard = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            let r = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                r.push(null);
            }
            this.renderedBoard.push(r);
        }

        // keyboard input
        this.keys = this.input.keyboard.addKeys("w,up,a,left,s,down,d,right,q,z,e,x");

        // falling, controllable tetromino
        this.currentTetro = new RenderedTetromino(this.gameState.currentTetromino);
        this.otherTetros = [];
        for (let i = 0; i < 3; i++) {
            this.otherTetros.push(
                new RenderedTetromino(this.gameState.otherPieces[i])
            );
        }

        // 1s interval falling rate, TODO put inside update()?
        this.time.addEvent({
            delay: 1000,
            callback: () => this.updateFalling(this),
            loop: true,
        });

        this.gameState.updateScoreboard = (playerPoints) => {
            this.scoreboard.updateScoreboard(playerPoints);
        }

        this.gameState.fullScoreboard = (playerPoints) => {
            this.scene.start("SceneFullscreenScoreboard", { playerPoints: playerPoints, blockSize: SceneGameArena.blockSize, gameState: this.gameState });
        }
    }

    update(time: number, delta: number) {
        this.frameTimeElapsed += delta;

        // 12 fps
        if (this.frameTimeElapsed > 1000 / this.FRAMERATE) {
            this.updateBoardFromFrozen(this);
            this.updateUserInput(this);
            this.updateDrawBoard(this.gameState, this);
            this.updateDrawPlayer(this);

            // start next frame
            this.frameTimeElapsed = 0;
        }
    }

    // the frozen board is all blocks that are placed. the board contains dynamic player blocks.
    // this function sync the board with frozenboard, and add players on top
    private updateBoardFromFrozen(scene: SceneGameArena) {
        scene.gameState.board = cloneDeep(scene.gameState.frozenBoard);
        for (let i = 0; i < 3; i++) {
            //putTetroOnBoard(scene.otherTetros[i].inner, scene.gameState.board)
            let tetro = scene.otherTetros[i].inner;
            for (let cell of tetro.cells) {
                const rowAbsolute = cell[0] + tetro.position[0];
                const colAbsolute = cell[1] + tetro.position[1];
                let [row, col] = rotateCoords([rowAbsolute, colAbsolute], BOARD_SIZE, i);
                scene.gameState.board[row][col] = tetro.type;
            }
        }
    }

    // TODO
    // 1. these update functions can have unified interface
    // 2. they have duplicate logic with the Phaser.Scene.time.addEvent, consider moving the falling down here, but we need a internal state/class instance for each of them to track time delta in order to have a different function
    private updateUserInput(scene: SceneGameArena) {
        if (scene.keys.a.isDown || scene.keys.left.isDown) {
            let [row, col] = scene.gameState.currentTetromino.position;

            scene.gameState.currentTetromino.position = [row, Math.max(0, col - 1)]; // TODO

            scene.gameState.socket.emit(
                "playerMove",
                scene.gameState.playerId,
                MoveEvent.Left,
                scene.gameState.currentTetromino.reportPosition()
            );
        } else if (scene.keys.d.isDown || scene.keys.right.isDown) {
            let [row, col] = scene.gameState.currentTetromino.position;
            scene.gameState.currentTetromino.position = [
                row,
                Math.min(BOARD_SIZE, col + 1),
            ]; // TODO

            scene.gameState.socket.emit(
                "playerMove",
                scene.gameState.playerId,
                MoveEvent.Right,
                scene.gameState.currentTetromino.reportPosition()
            );
        } else if (scene.keys.q.isDown || scene.keys.z.isDown) {
            if (scene.gameState.currentTetromino.rotateCCW()) {
                // TODO: emit
            };
        } else if (scene.keys.e.isDown || scene.keys.x.isDown) {
            if (scene.gameState.currentTetromino.rotateCW()) {
                // TODO: emit
            };
        }
    }

    private updateDrawBoard(state: GameState, scene: SceneGameArena) {
        // re-render the board
        const board = state.board;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                scene.renderedBoard[row][col]?.destroy();
                if (board[row][col]) {
                    let x = (col + 0.5) * SceneGameArena.blockSize;
                    let y = (row + 0.5) * SceneGameArena.blockSize;
                    scene.renderedBoard[row][col] = scene.add.rectangle(
                        x,
                        y,
                        SceneGameArena.blockSize,
                        SceneGameArena.blockSize,
                        0xffee00
                    );
                }
            }
        }
    }

    private updateDrawPlayer(scene: SceneGameArena) {
        scene.currentTetro.draw(scene);
    }

    private updateFalling(scene: SceneGameArena) {
        // fall the tetromino
        // if (can fall)
        //    fall
        // else
        //    TODO place on board

        // NOTE: other players' tetrominoes are treated as static blocks, although they are synced shortly before this function

        const state = scene.gameState;
        const board = state.board;
        const tetro = state.currentTetromino;

        if (this.canTetroFall(tetro, board)) {
            tetro.position[0] += 1;

            scene.gameState.socket.emit(
                "playerMove",
                scene.gameState.playerId,
                MoveEvent.Down,
                scene.gameState.currentTetromino.reportPosition()
            );
        } else {
            console.log(tetro, "cannot fall!");
            // TODO place on state.board and emit events to the server
        }
    }

    private canTetroFall(
        tetro: Tetromino,
        board: Array<Array<TetrominoType | null>>
    ): Boolean {
        // if the blocks right below this tetro are all empty, it can fall.
        const bottomRelative = Math.max(...tetro.cells.map((cell) => cell[0])); // the lowest block in the tetro cells, ranging from 0-3
        const bottomAbsolute = tetro.position[0] + bottomRelative; // the row of which the lowest block of the tetro is at in the board

        if (bottomAbsolute + 1 >= board.length) return false;

        return tetro.cells.every(
            (cell: any) =>
                cell[0] < bottomRelative || // either the cell is not the bottom cells which we don't care
                board[bottomAbsolute + 1][tetro.position[1] + cell[1]] == null // or the room below it has to be empty
        );
    }
}
