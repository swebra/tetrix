import Phaser from "phaser";
import { SceneFullscreenScoreboard } from "./SceneFullscreenScoreboard";
import { SceneGameArena } from "./SceneGameArena";
import { SceneStartGame } from "./SceneStartGame";
import { GameState } from "./GameState";
import { BOARD_SIZE } from "common/shared";


const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: BOARD_SIZE * SceneGameArena.blockSize,
  height: BOARD_SIZE * SceneGameArena.blockSize,
  // scene: [SceneStartGame, SceneGameArena, SceneFullscreenScoreboard]  // FIXME: Uncomment this line in the final version. Allows for users to join the player queue etc..
  scene: [SceneGameArena, SceneFullscreenScoreboard]  // FIXME: Delete this line in the final version. This is left in for testing convenience.
};

const gamestate = new GameState();
const game = new Phaser.Game(config);

// FIXME: Uncomment the following line in the final game. This is commented out for testing convenience.
// game.scene.start("SceneStartGame", { gameState: gamestate });
game.scene.start("SceneGameArena", { gameState: gamestate });   // FIXME: Delete this line from the final game. This is left in for testing convenience.