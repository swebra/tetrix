enum KeyPressState {
    Unpressed,
    FirstTime,
    Continuous,
}

export class KeyThrottleManager {
    static FIRST_DELAY = 200;
    static CONTINUOUS_DELAY = 80;
    static USER_THRESHOLD = 200;
    private lastStates: { [index: string]: KeyPressState } = {};
    private lastTimes: { [index: string]: number } = {};
    private scene;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    private throttle(
        func: (...args: any[]) => any,
        action: string,
        timeout = KeyThrottleManager.CONTINUOUS_DELAY
    ) {
        return (...args: any[]) => {
            const last = this.lastTimes[action] || null;
            const now = this.scene.time.now;
            if (last == null || now - last >= timeout) {
                func(args);
                this.lastTimes[action] = now;
            }
        };
    }

    /**
     * Register an array of keys which serve the same purpose, will call callback on throttled keydown
     * @param keys - An array of keys to register with the action and callback
     * @param action - A string representing the action to throttle on
     * @param callback - the function to invoke on throttled/successful keydown
     */
    public register(
        keys: Array<Phaser.Input.Keyboard.Key>,
        action: string,
        callback: () => void
    ) {
        const firstCallback = this.throttle(
            callback,
            action,
            KeyThrottleManager.FIRST_DELAY
        );

        const continuousCallback = this.throttle(
            callback,
            action,
            KeyThrottleManager.CONTINUOUS_DELAY
        );

        this.lastStates[action] = KeyPressState.Unpressed;
        this.lastTimes[action] = 0;

        keys.forEach((key) => {
            key.on("up", () => {
                this.lastStates[action] = KeyPressState.Unpressed;
            });
            key.on("down", () => {
                const prevState = this.lastStates[action];
                const now = this.scene.time.now;

                switch (prevState) {
                    case KeyPressState.Unpressed:
                        this.lastStates[action] = KeyPressState.FirstTime;
                        if (
                            now - this.lastTimes[action] <=
                            KeyThrottleManager.USER_THRESHOLD
                        ) {
                            // user is quickly repeating this key
                            continuousCallback();
                        } else {
                            firstCallback();
                        }
                        break;
                    case KeyPressState.FirstTime:
                        this.lastStates[action] = KeyPressState.Continuous;
                        continuousCallback();
                        break;
                    case KeyPressState.Continuous:
                        continuousCallback();
                        break;
                }
            });
        });
    }
}
