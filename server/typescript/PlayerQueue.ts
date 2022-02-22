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
        let remainingPlayers = 4 - this.playerCounter;
        if (remainingPlayers < 0) {
            return 0;
        }
        return remainingPlayers;
    }
}