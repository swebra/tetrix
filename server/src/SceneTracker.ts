import {
    ToServerEvents,
    ToClientEvents,
} from "common/messages/sceneWaitingRoom";
import { ColoredScore } from "common/shared";
import { Socket } from "socket.io";

type SocketSceneTracker = Socket<ToServerEvents, ToClientEvents>;

export class SceneTracker {
    private currentScene:
        | "SceneWaitingRoom"
        | "SceneGameArena"
        | "SceneGameOver";

    constructor() {
        this.currentScene = "SceneWaitingRoom";
    }

    /**
     * Send an event to the client requesting to load the current scene.
     * @param socket The socket to send the event to.
     * @param playerScores The player scores (used if rendering the final scoreboard scene).
     */
    public initSocketListeners(
        socket: SocketSceneTracker,
        finalScores: Array<ColoredScore>
    ) {
        socket.on("requestCurrentScene", () => {
            switch (this.currentScene) {
                case "SceneWaitingRoom":
                    socket.emit("toSceneWaitingRoom");
                    break;
                case "SceneGameArena":
                    socket.emit("toSceneGameArena");
                    break;
                case "SceneGameOver":
                    socket.emit("toSceneGameOver", finalScores);
                    break;
            }
        });
    }

    /**
     * Set the value of the current scene.
     * @param scene The scene to be setting.
     */
    public setScene(
        scene: "SceneWaitingRoom" | "SceneGameArena" | "SceneGameOver"
    ) {
        this.currentScene = scene;
    }
}
