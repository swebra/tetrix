import Phaser, { Scene, GameObjects } from "phaser";
import { io, Socket } from "socket.io-client";
import { cloneDeep } from "lodash";

import {
  MoveEvent,
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerPosition,
} from "common/message";

import { TetrominoType } from "common/TetrominoType";

const BOARD_SIZE = 40;

class MyScene extends Phaser.Scene {
  FRAMERATE: number = 12;

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  gameState!: GameState;

  static blockSize: number = 20; // 20px width for a single square block
  currentTetro!: RenderedTetromino;
  otherTetros!: Array<RenderedTetromino>;
  renderedBoard!: Array<Array<GameObjects.Rectangle | null>>;

  frameTimeElapsed: number = 0; // the ms time since the last frame is drawn

  preload() {}

  create() {
    this.gameState = new GameState();
    this.renderedBoard = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      let r = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        r.push(null);
      }
      this.renderedBoard.push(r);
    }

    let mid = Math.round(BOARD_SIZE / 2);
    let midH = mid;
    this.gameState.board[midH][mid - 2] = TetrominoType.Square;
    this.gameState.board[midH][mid - 1] = TetrominoType.Square;
    this.gameState.board[midH][mid - 0] = TetrominoType.Square;

    // keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // falling, controllable tetromino
    this.currentTetro = new RenderedTetromino(this.gameState.currentTetromino);
    this.otherTetros = [];
    for (let i = 0; i < 3; i++) {
      this.otherTetros.push(
        new RenderedTetromino(this.gameState.otherPieces[i])
      );
    }
    // left player
    // this.otherTetros[0].xyTransform = (x, y) => {
    //   return { x: y, y: MyScene.blockSize * BOARD_SIZE - x };
    // };
    // // down player
    // this.otherTetros[1].xyTransform = (x, y) => {
    //   return {
    //     x: MyScene.blockSize * BOARD_SIZE - x,
    //     y: MyScene.blockSize * BOARD_SIZE - y,
    //   };
    // };
    // // right player
    // this.otherTetros[2].xyTransform = (x, y) => {
    //   return { x: MyScene.blockSize * BOARD_SIZE - y, y: x };
    // };

    this.time.addEvent({
      delay: 1000,
      callback: () => updateFalling(this),
      loop: true,
    });
  }

  update(time: number, delta: number) {
    this.frameTimeElapsed += delta;

    if (this.frameTimeElapsed > 1000 / 12) {
      updateBoardFromFrozen(this)
      updateUserInput(this);
      updateDrawBoard(this.gameState, this);
      updateDrawPlayer(this);
      // updateDrawOtherPlayers(this);
      this.frameTimeElapsed = 0;
    }
  }
}

// the frozen board is all blocks that are placed. the board contains dynamic player blocks.
// this function sync the board with frozenboard, and add players on top
function updateBoardFromFrozen(scene: MyScene) {
    scene.gameState.board = cloneDeep(scene.gameState.frozenBoard)
    for (let i = 0; i < 3; i++) {
      //putTetroOnBoard(scene.otherTetros[i].inner, scene.gameState.board)
        let tetro = scene.otherTetros[i].inner;
        for (let cell of tetro.cells) {
            const rowAbsolute = cell[0] + tetro.position[0];
            const colAbsolute = cell[1] + tetro.position[1];
            let [row, col] = xyTransform(rowAbsolute, colAbsolute, i);
            scene.gameState.board[row][col] = tetro.type;
        }
    }

    function xyTransform(row: number, col: number, i: number): [number, number] {
        if (i === 0) {
            return [col, BOARD_SIZE - row] 
        } else if (i === 1) {
            return [BOARD_SIZE - row, BOARD_SIZE - col]
        } else if (i === 2) {
            return [BOARD_SIZE - col, row] 
        } else {
            return [row, col]
        }
       //  // left player
       //  this.otherTetros[0].xyTransform = (x, y) => {
       //    return { x: y, y: MyScene.blockSize * BOARD_SIZE - x };
       //  };
       //  // down player
       //  this.otherTetros[1].xyTransform = (x, y) => {
       //    return {
       //      x: MyScene.blockSize * BOARD_SIZE - x,
       //      y: MyScene.blockSize * BOARD_SIZE - y,
       //    };
       //  };
       //  // right player
       //  this.otherTetros[2].xyTransform = (x, y) => {
       //    return { x: MyScene.blockSize * BOARD_SIZE - y, y: x };
       //  };
    }
}

// TODO
// 1. these update functions can have unified interface
// 2. they have duplicate logic with the Phaser.Scene.time.addEvent, consider moving the falling down here, but we need a internal state/class instance for each of them to track time delta in order to have a different function
function updateUserInput(scene: MyScene) {
  if (scene.cursors.left.isDown) {
    let [row, col] = scene.gameState.currentTetromino.position;

    scene.gameState.currentTetromino.position = [row, Math.max(0, col - 1)]; // TODO

    scene.gameState.socket.emit(
      "playerMove",
      scene.gameState.playerId,
      MoveEvent.Left,
      scene.gameState.currentTetromino.reportPosition()
    );
  } else if (scene.cursors.right.isDown) {
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
  }
}

function updateDrawOtherPlayers(scene: MyScene) {
  for (let player of scene.otherTetros) {
    player.draw(scene);
  }
}

function updateDrawPlayer(scene: MyScene) {
  scene.currentTetro.draw(scene);
}
function updateGameOver(state: GameState, scene: MyScene) {
  // if the current tetromino is placed and is outside its section, game is over.
}

function updateFalling(scene: MyScene) {
  // fall the tetromino
  // if (can fall)
  //    fall
  // else
  //    place on board

  // NOTE: other players' tetrominoes are treated as static blocks, although they are synced shortly before this function

  const state = scene.gameState;
  const board = state.board;
  const tetro = state.currentTetromino;

  if (canTetroFall(tetro, board)) {
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

function canTetroFall(
  tetro: Tetromino,
  board: Array<Array<TetrominoType>>
): Boolean {
  const bottomRelative = Math.max(...tetro.cells.map((cell) => cell[0]));
  const bottomAbsolute = tetro.position[0] + bottomRelative;

  if (bottomAbsolute + 1 >= board.length) return false;

  return tetro.cells.every(
    (cell) =>
      cell[0] < bottomRelative ||
      board[bottomAbsolute + 1][tetro.position[1] + cell[1]] ==
        TetrominoType.Empty
  );
}

function updateDrawBoard(state: GameState, scene: MyScene) {
  const board = state.board;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      scene.renderedBoard[row][col]?.destroy();
      if (board[row][col] != TetrominoType.Empty) {
        let x = (col + 0.5) * MyScene.blockSize;
        let y = (row + 0.5) * MyScene.blockSize;
        scene.renderedBoard[row][col] = scene.add.rectangle(
          x,
          y,
          MyScene.blockSize,
          MyScene.blockSize,
          0xffee00
        );
      }
    }
  }
}

class Tetromino {
  type: TetrominoType;
  position: [number, number];
  rotation: 0 | 1 | 2 | 3;
  // individual square blocks inside a 3x3 virtual block containing the tetromino. ideally it should be 4x4? not sure if we want to go with this.
  // TODO rotate happens here? (matrix rotation)
  cells: Array<[number, number]>;

  constructor(type: TetrominoType) {
    this.type = type;
    this.position = [0, Math.round(BOARD_SIZE / 2) - 2]; // TODO hardcoded to the middle (10/2)
    this.rotation = 0; // default (no rotation)
    this.cells = [
      // TODO generate based on type
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 1],
    ];
  }

  reportPosition(): PlayerPosition {
    return {
      tetroPosition: this.position,
      rotation: this.rotation,
      tetroType: this.type,
    };
  }
}

class RenderedTetromino {
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
      let x = (this.inner.position[1] + col + 0.5) * MyScene.blockSize;
      let y = (this.inner.position[0] + row + 0.5) * MyScene.blockSize;

      if (this.xyTransform) {
        // rotate, needed for other players
        ({ x, y } = this.xyTransform(x, y));
      }

      let rec = scene.add.rectangle(
        x,
        y,
        MyScene.blockSize,
        MyScene.blockSize,
        0xff0000
      );
      return rec;
    });
  }
}

class GameState {
  // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
  socket!: Socket<ServerToClientEvents, ClientToServerEvents>;

  // frozen board is the board without moving players, NOTE: frozenBoard is the truth of placed blocks
  frozenBoard: Array<Array<TetrominoType>>;
  // board is the final product being rendered. contains all 3 other players
  board: Array<Array<TetrominoType>>;

  // synced to server
  currentTetromino: Tetromino;
  // synced from server
  otherPieces: Array<Tetromino>;
  playerId!: 0 | 1 | 2 | 3;

  private blankBoard() {
    let board = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      let row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push(TetrominoType.Empty);
      }
      board.push(row);
    }
    return board;
  }

  constructor() {
    this.board = this.blankBoard();
    this.frozenBoard = this.blankBoard();

    this.currentTetromino = new Tetromino(TetrominoType.T);
    // other player's moving piece, TODO this is synchronized with the server
    // how they are rendered is not concerned.
    this.otherPieces = [
      // FIXME not good?
      new Tetromino(TetrominoType.T),
      new Tetromino(TetrominoType.T),
      new Tetromino(TetrominoType.T),
    ];

    this.socket = io((import.meta.env.PROD && "https://tetrix-web.herokuapp.com/") || "http://localhost:3001/");
    console.log(this.socket);

    this.socket.on("initPlayer", (playerId) => {
      this.playerId = playerId;
      console.log("playerId: ", playerId);
    });

    // other player is sending in some action, should re-render using onPlayerAction
    this.socket.on("playerMove", (playerId, event, position) => {
      console.log("received remote action: ", event, ", from ", playerId);
      let otherPlayerIndex = ((playerId + 4 - this.playerId) % 4) - 1; // FIXME hack.
      console.log("this otherplayer is: ", otherPlayerIndex);

      this.otherPieces[otherPlayerIndex].position = position.tetroPosition;
      this.otherPieces[otherPlayerIndex].rotation = position.rotation;
      this.otherPieces[otherPlayerIndex].type = position.tetroType;
      this.onRemoteUpdate();
    });
  }

  onRemoteUpdate: () => void = () => {};
}

const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 40 * MyScene.blockSize,
  height: 40 * MyScene.blockSize,
  scene: MyScene,
};
export const game = new Phaser.Game(config);
