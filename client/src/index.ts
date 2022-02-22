import Phaser from "phaser";
import { io, Socket } from "socket.io-client";

import { SceneFullscreenScoreboard } from "./scene/SceneFullscreenScoreboard";
import { SceneGameArena } from "./scene/SceneGameArena";
import { SceneStartGame } from "./scene/SceneStartGame";
import { GameState } from "./GameState";
import { BOARD_SIZE } from "common/shared";

export interface SharedState {
    gameState: GameState,
    socket: Socket
}

const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: BOARD_SIZE * SceneGameArena.blockSize,
  height: BOARD_SIZE * SceneGameArena.blockSize,
  scene: [SceneStartGame, SceneGameArena, SceneFullscreenScoreboard]  // FIXME: Uncomment this line in the final version. Allows for users to join the player queue etc..
  // scene: [SceneGameArena, SceneFullscreenScoreboard]  // FIXME: Delete this line in the final version. This is left in for testing convenience.
};

const socket = io(
            (import.meta.env.PROD && window.location.origin) ||
            "http://localhost:3001/"
        );
const gameState = new GameState(socket);
const game = new Phaser.Game(config);

// FIXME: Uncomment the following line in the final game. This is commented out for testing convenience.
game.scene.start("SceneStartGame", { gameState, socket });
// game.scene.start("SceneGameArena", { gameState, socket })   // FIXME: Delete this line from the final game. This is left in for testing convenience.
