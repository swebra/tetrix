export class PlayerQueue {
    private playerCounter: number;

    constructor() {
        this.playerCounter = 0;
    }

    /**
     * Add a player to the queue.
     * @returns Player index.
     */
    public addToQueue(): number {
        return this.playerCounter++;
    }

    public removeOne(): number {
        this.playerCounter = Math.max(0, this.playerCounter - 1);
        return this.playerCounter;
    }

    /**
     * Reset the counter.
     */
    public resetCounter() {
        this.playerCounter = 0;
    }

    /**
     * Get the number of remaining players needed to start the game.
     * @returns The number of players needed to start the game.
     */
    public getRemainingPlayers(): number {
        const remainingPlayers = 4 - this.playerCounter;
        if (remainingPlayers < 0) {
            return 0;
        }
        return remainingPlayers;
    }
}
