import Phaser from "phaser";
import { io } from "socket.io-client";

import { SceneWaitingRoom } from "./scene/SceneWaitingRoom";
import { SceneGameArena } from "./scene/SceneGameArena";
import { SceneGameOver } from "./scene/SceneGameOver";
import { GameState } from "./GameState";
import { BOARD_PX } from "common/shared";

const config = {
    type: Phaser.AUTO,
    parent: "root",
    width: BOARD_PX,
    height: BOARD_PX,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
    scene: import.meta.env.VITE_DISABLE_WAITING_ROOM
        ? [SceneGameArena, SceneGameOver]
        : [SceneWaitingRoom, SceneGameArena, SceneGameOver],
};

const socket = io(
    (import.meta.env.PROD && window.location.origin) ||
        import.meta.env.VITE_BACKEND_URL ||
        "http://localhost:3001/"
);
const gameState = new GameState(socket);
const game = new Phaser.Game(config);

if (import.meta.env.VITE_DISABLE_WAITING_ROOM) {
    game.scene.start("SceneGameArena", { gameState, socket });
} else {
    game.scene.start("SceneWaitingRoom", { gameState, socket });
}
