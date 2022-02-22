export class PlayerQueue {
    private playerCounter: number;

    constructor() {
        this.playerCounter = -1;
    }

    /**
     * Get the player index if there is room in the queue.
     * @returns Player index if there is room in queue. Otherwise -1.
     */
    public addToQueue() {
        if (this.playerCounter == 3) {
            return -1;
        }

        this.playerCounter++;
        return this.playerCounter;
    }

    /**
     * Reset the counter.
     */
    public resetCounter() {
        this.playerCounter = -1;
    }
}