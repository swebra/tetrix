import Phaser, { Scene } from "phaser";
import { io, Socket } from "socket.io-client";
import { FullscreenScoreboard } from "./FullscreenScoreboard";
import {
  PlayerAction,
  MoveEvent,
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../common/message";

class MyScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  gameState!: GameState;

  static blockSize: number = 20; // 20px width for a single square block
  currentTetro!: RenderedTetromino;

  frameElapsed: number = 0; // the ms time since the last frame is drawn

  preload() {
  }

  create() {
    this.gameState = new GameState();

    // keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // play area
    this.add.rectangle(
      25 * MyScene.blockSize,
      25 * MyScene.blockSize,
      10 * MyScene.blockSize,
      50 * MyScene.blockSize,
      0xdddddd
    );
    this.add.rectangle(
      25 * MyScene.blockSize,
      25 * MyScene.blockSize,
      50 * MyScene.blockSize,
      10 * MyScene.blockSize,
      0xdddddd
    );

    console.log("hello");

    // falling, controllable tetromino
    this.currentTetro = new RenderedTetromino(this.gameState.currentTetromino);
    this.currentTetro.draw(this);

    /*
     * for a player on the left side:
     * rec.x = oldrec.y
     * rec.y = height - oldrec.x
     *
     * for a player on the bottom
     * rec.x = width - oldrec.x
     * rec.y = height - oldrec.y
     *
     * for a player on the right
     * rec.x = width - oldrec.y
     * rec.y = oldrec.x
     **/
    // left player
    let renderedPlayerB = new RenderedTetromino(this.gameState.otherPieces[0]);
    renderedPlayerB.xyTransform = (x, y) => {
      return { x: y, y: MyScene.blockSize * 50 - x };
    };

    // down player
    let renderedPlayerC = new RenderedTetromino(this.gameState.otherPieces[1]);
    renderedPlayerC.xyTransform = (x, y) => {
      return { x: MyScene.blockSize * 50 - x, y: MyScene.blockSize * 50 - y };
    };

    // right player
    let renderedPlayerD = new RenderedTetromino(this.gameState.otherPieces[2]);
    renderedPlayerD.xyTransform = (x, y) => {
      return { x: MyScene.blockSize * 50 - y, y: x };
    };

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameState.fall();
        this.currentTetro.draw(this);
        renderedPlayerB.draw(this);
        renderedPlayerC.draw(this);
        renderedPlayerD.draw(this);
      },
      loop: true,
    });

    this.gameState.onPlayerAction = (otherPlayerAction) => {
        this.currentTetro.draw(this);
        renderedPlayerB.draw(this);
        renderedPlayerC.draw(this);
        renderedPlayerD.draw(this);
    }

    this.gameState.updateScoreboard = (playerPoints) => {
      this.updateScoreboard(playerPoints);
    }

    this.gameState.fullScoreboard = (playerPoints) => {
      this.scene.launch("FullscreenScoreboard");
    }

    console.log("game board: ", this.gameState.board);
  }

  update(time: number, delta: number) {
    // TODO: left and right bound
    this.frameElapsed += delta;
    if (this.frameElapsed > 1000 / 12) {
      // 12 fps
      if (this.cursors.left.isDown) {
        // FIXME gameState is directly modified, pass in keyboard events and use a update() method?
        let [row, col] = this.gameState.currentTetromino.position;

        this.gameState.currentTetromino.position = [row, Math.max(0, col - 1)]; // TODO

        console.log("emit left");
        this.gameState.socket.emit("playerAction", {
          playerId: this.gameState.playerId,
          event: MoveEvent.Left,
        });
      } else if (this.cursors.right.isDown) {
        let [row, col] = this.gameState.currentTetromino.position;
        this.gameState.currentTetromino.position = [row, Math.min(50, col + 1)]; // TODO

        this.gameState.socket.emit("playerAction", {
          playerId: this.gameState.playerId,
          event: MoveEvent.Right,
        });
      }
      this.currentTetro.draw(this);
      this.frameElapsed = 0;
    }
  }

  private updateScoreboard(playerPts: any) {
    // Wipe the existing UI.
    this.add.rectangle(800, 16, 300, 600, 0x000);

    // Add in the updated UI.
    this.add
      .text(685, 16, "Leaderboards", { fontSize: "52px", fontFamily: "VT323" })
      .setTint(0xFF0000);

    let y = 30;

    for (let element of playerPts) {
      y += 50;
      let text = `${element.color}`.padEnd(10) + `${element.points}`;
      this.add
        .text(720, y, text, { fontSize: "32px", fontFamily: "VT323" })
        .setTint(element.hex);
    }
  }
}

enum TetrominoType {
  LClockwise,
  LCounterClockwise,
  Z,
  S,
  T,
  Square,
  Long,
  Empty,
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
    this.position = [0, 23]; // TODO hardcoded to the middle (50/2)
    this.rotation = 0; // default (no rotation)
    this.cells = [
      // TODO generate based on type
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 1],
    ];
  }

  fall() {
    // TODO boundary checks
    this.position[0] += 1;
    if (this.position[0] > 50) this.position[0] = 0;
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

  // synced from+to server?
  board: Array<Array<TetrominoType>>;
  // synced to server
  currentTetromino: Tetromino;
  // synced from server
  otherPieces: Array<Tetromino>;
  playerId!: 0 | 1 | 2 | 3;

  private blankBoard() {
    let board = [];
    for (let r = 0; r < 50; r++) {
      let row = [];
      for (let c = 0; c < 50; c++) {
        row.push(TetrominoType.Empty);
      }
      board.push(row);
    }
    return board;
  }

  constructor() {
    this.board = this.blankBoard();
    this.currentTetromino = new Tetromino(TetrominoType.T);
    // other player's moving piece, TODO this is synchronized with the server
    // how they are rendered is not concerned.
    this.otherPieces = [ // FIXME not good?
      new Tetromino(TetrominoType.T),
      new Tetromino(TetrominoType.T),
      new Tetromino(TetrominoType.T),
    ];

    this.socket = io("http://localhost:3001/");
    console.log(this.socket);

    this.socket.on("initPlayer", (playerId) => {
      this.playerId = playerId;
      console.log("playerId: ", playerId);
    });

    this.socket.on("updateScoreboard", (valFromServer) => {
      this.updateScoreboard(valFromServer);
    });

    this.socket.on("showFullScoreboard", (valFromServer) => {
      this.fullScoreboard(valFromServer);
    });

    // other player is sending in some action, should re-render using onPlayerAction
    this.socket.on("playerAction", ({event, playerId}) => {
        console.log("received remote action: ", event, ", from ", playerId)
        let otherPlayerIndex = (playerId + 4 - this.playerId) % 4 - 1 // FIXME hack.
        console.log("this otherplayer is: ",otherPlayerIndex)
        this.otherPieces[otherPlayerIndex]

          if (event == MoveEvent.Left) {
            // FIXME gameState is directly modified, pass in keyboard events and use a update() method?
            let [row, col] = this.otherPieces[otherPlayerIndex].position;
            this.otherPieces[otherPlayerIndex].position = [row, Math.max(0, col - 1)]; // TODO
          } else if (event == MoveEvent.Right) {
            let [row, col] = this.otherPieces[otherPlayerIndex].position;
            this.otherPieces[otherPlayerIndex].position = [row, Math.min(50, col + 1)]; // TODO
      }
       if (this.onPlayerAction) this.onPlayerAction({event, playerId})
    })
  }

  fall() {
    // fall is called every 1 second
    this.currentTetromino.fall();
    this.otherPieces.forEach((tetro) => tetro.fall());
  }

  onPlayerAction!: (a: PlayerAction) => void;
  updateScoreboard!: (data: any) => void;
  fullScoreboard!: (data: any) => void;
}

const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 50 * MyScene.blockSize,
  height: 50 * MyScene.blockSize,
  scene: [MyScene, FullscreenScoreboard]
};

export const game = new Phaser.Game(config);
