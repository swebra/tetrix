import { ToClientEvents, ToServerEvents } from "common/messages/sceneWaitingRoom";
import { Socket } from "socket.io";
import { broadcastRemainingPlayers, broadcastToSceneGameArena} from "..";

type SocketQueue = Socket<ToServerEvents, ToClientEvents>;

export class PlayerQueue {
    private queue: Array<SocketQueue>;
    private connectionsToRemove: Array<SocketQueue>;

    constructor() {
        this.queue = [];
        this.connectionsToRemove = [];
    }

    public initSocketListeners(socket: SocketQueue) {
        socket.on("joinQueue", () => {
            this.clearClosedConnections();
            this.addToQueue(socket);

            broadcastRemainingPlayers(this.getRemainingPlayers());

            // 4 valid connections are found. Start the game.
            if (this.getRemainingPlayers() === 0) {
                for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
                    this.queue[playerIndex].emit("initPlayer", playerIndex as 0 | 1 | 2 | 3);
                }
                broadcastToSceneGameArena();
            }
        });

        socket.on("requestRemainingPlayers", () => {
            socket.emit("updateRemainingPlayers", this.getRemainingPlayers());
        });

        socket.on("leaveQueue", () => {
            this.removeFromQueue(socket);
            broadcastRemainingPlayers(this.getRemainingPlayers());
        });
    }

    /**
     * Wipe any closed connections from the queue.
     */
    private clearClosedConnections() {
        let maxIndex: number = Math.min(4, this.queue.length);

        for (let i = 0; i < maxIndex; i++) {
            if (!this.queue[i].connected) {
                this.connectionsToRemove.push(this.queue[i]);
            }
        }

        for (let connection of this.connectionsToRemove) {
            this.removeFromQueue(connection);
        }

        this.resetConnToRemove();
    }

    /**
     * Add a player to the queue.
     * @param socket The socket to add to the queue.
     */
    public addToQueue(socket: SocketQueue) {
        this.queue.push(socket);
    }

    /**
     * Remove a player from the queue.
     * @param socket The socket to be removed from the queue.
     */
    public removeFromQueue(socket: SocketQueue) {
        this.queue = this.queue.filter(function (value, index, arr) {
            return value != socket;
        });
    }

    /**
     * Empty the queue.
     */
    public resetQueue() {
        this.queue = [];
        this.connectionsToRemove = [];
    }

    /**
     * Wipe the connections queue.
     */
    private resetConnToRemove() {
        this.connectionsToRemove = [];
    }

    /**
     * @returns Returns the number of players needed to start the game.
     */
    public getRemainingPlayers(): number {
        return Math.max(0, 4 - this.queue.length);
    }
}
