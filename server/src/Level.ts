import { ToServerEvents, ToClientEvents } from "common/messages/sceneGameArena";
import { broadcastFallRate } from "../index";
import { Socket } from "socket.io";

type SocketLevel = Socket<ToServerEvents, ToClientEvents>;

export class Level {
    private _currentLevel: number;
    private currentFallRate: number;
    private MAX_FALL_RATE: number = 200;

    constructor() {
        this._currentLevel = 1;
        this.currentFallRate = 1000;
    }

    get currentLevel(): number {
        return this._currentLevel;
    }

    /**
     * Setup listeners for the current client socket.
     * @param socket The client's socket.
     */
    public initSocketListeners(socket: SocketLevel) {
        socket.on("requestFallRate", () => {
            socket.emit("updateFallRate", this.currentFallRate);
        });
    }

    /**
     * Check if its possible to update the game's level based off the given score.
     * @param score The total score the players have accumulated.
     */
    public checkUpdateLevel(score: number) {
        if (score >= this._currentLevel * 20) {
            this._currentLevel++;
            this.increaseFallRate();
        }
    }

    /**
     * Increase the fall rate due to spectator voting.
     */
    public spectatorIncreaseFallRate() {
        this.increaseFallRate();
        setTimeout(() => {
            this.decreaseFallRate();
        }, 20000);
    }

    /**
     * Decrease the fall rate due to spectator voting.
     */
    public spectatorDecreaseFallRate() {
        this.decreaseFallRate();
        setTimeout(() => {
            this.increaseFallRate();
        }, 20000);
    }

    /**
     * Increase the fall rate by 50ms.
     */
    private increaseFallRate() {
        if (this.currentFallRate - 50 >= this.MAX_FALL_RATE) {
            this.currentFallRate -= 50;
        } else {
            this.currentFallRate = 200;
        }

        broadcastFallRate(this.currentFallRate);
    }

    /**
     * Decrease the fall rate by 50ms.
     */
    private decreaseFallRate() {
        this.currentFallRate += 50;
        broadcastFallRate(this.currentFallRate);
    }

    /**
     * Notify the client of the current fallrate.
     * @param socket The client requesting data.
     */
    public getFallRate(socket: SocketLevel) {
        socket.emit("updateFallRate", this.currentFallRate);
    }
}
