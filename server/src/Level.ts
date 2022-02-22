export class Level {
    private _currentLevel: number;

    constructor() {
        this._currentLevel = 1;
    }

    get currentLevel(): number {
        return this._currentLevel;
    }

    public checkUpdateLevel(score: number) {
        if (score >= this._currentLevel * 20) {
            this._currentLevel++;
            // FIXME: Increase block fall rate.
        }
    }

    public spectatorIncrementLevel() {
        this._currentLevel++;
        // FIXME: Increase block fall rate.
        setTimeout(
            () => {
                this._currentLevel--;
                // FIXME: Decrease block fall rate.
            }, 20000);
    }

    public spectatorDecrementLevel() {
        this._currentLevel--;
        // FIXME: Decrease block fall rate.
        setTimeout(
            () => {
                this._currentLevel++;
                // FIXME: Increase block fall rate.
            }, 20000);
    }
}
