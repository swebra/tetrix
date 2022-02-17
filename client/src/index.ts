import Phaser from "phaser";
import { FullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { GameArenaScene } from "./SceneGameArena";
import { GameState } from "./GameState";


const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 50 * GameArenaScene.blockSize,
  height: 50 * GameArenaScene.blockSize,
  scene: [GameArenaScene, FullscreenScoreboard]
};

const gamestate = new GameState();
const game = new Phaser.Game(config);

game.scene.start("GameArenaScene", {gameState: gamestate});