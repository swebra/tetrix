import { ToServerEvents, ToClientEvents } from "common/messages/sceneTracker";
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
     * Set the value of the current scene.
     * @param scene The scene to be setting.
     */
    public setScene(
        scene: "SceneWaitingRoom" | "SceneGameArena" | "SceneGameOver"
    ) {
        this.currentScene = scene;
    }

    /**
     * Send an event to the client requesting to load the current scene.
     * @param socket The socket to send the event to.
     * @param playerScores The player scores (used if in the final scoreboard scene).
     */
    public loadCurrentScene(
        socket: SocketSceneTracker,
        playerScores: Array<ColoredScore>
    ) {
        switch (this.currentScene) {
            case "SceneWaitingRoom":
                // No need to emit any event in this situation. The clients are auto-loaded into the waiting room.
                break;
            case "SceneGameArena":
                socket.emit("toSceneGameArena");
                break;
            case "SceneGameOver":
                socket.emit("toSceneGameOver", playerScores);
                break;
        }
    }
}
