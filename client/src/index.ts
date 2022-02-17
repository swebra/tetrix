import Phaser from "phaser";
import { SceneFullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { SceneGameArena } from "./SceneGameArena";
import { GameState } from "./GameState";
import { BOARD_SIZE } from "common/shared";


const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: BOARD_SIZE * SceneGameArena.blockSize,
  height: BOARD_SIZE * SceneGameArena.blockSize,
  scene: [SceneGameArena, SceneFullscreenScoreboard]
};

const gamestate = new GameState();
const game = new Phaser.Game(config);

game.scene.start("SceneGameArena", {gameState: gamestate});