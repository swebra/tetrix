import { ToServerEvents, ToClientEvents } from "common/messages/sceneGameArena";
import { broadcastFallRate } from "../index";
import { Socket } from "socket.io";

type SocketLevel = Socket<ToServerEvents, ToClientEvents>;

export class Level {
    private _currentLevel: number;
    private currentFallRate: number;

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
     * Check if its possible to update the game's level based off the given score. Max level is 15.
     * @param score The total score the players have accumulated.
     */
    public checkUpdateLevel(score: number) {
        if (score >= this._currentLevel * 20 && this._currentLevel < 15) {
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
     * Increase the fall rate according to the current level.
     */
    private increaseFallRate() {
        this.currentFallRate =
            1000 *
            (0.8 * ((this._currentLevel - 1) * 0.007)) **
                (this._currentLevel - 1);
        broadcastFallRate(this.currentFallRate);
    }

    /**
     * Decrease the fall rate according to the current level.
     */
    private decreaseFallRate() {
        this.currentFallRate =
            1000 *
            (0.8 * ((this._currentLevel - 2) * 0.007)) **
                (this._currentLevel - 2);
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
