import Phaser from "phaser";
import { FullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { SceneGameArena } from "./SceneGameArena";
import { GameState } from "./GameState";


const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 50 * SceneGameArena.blockSize,
  height: 50 * SceneGameArena.blockSize,
  scene: [SceneGameArena, FullscreenScoreboard]
};

const gamestate = new GameState();
const game = new Phaser.Game(config);

game.scene.start("SceneGameArena", {gameState: gamestate});