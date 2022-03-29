import { Socket } from "socket.io-client";
import { Scene } from "phaser";

import { BOARD_PX, TILE_SIZE, COLORS } from "common/shared";
import { ToServerEvents, ToClientEvents } from "common/messages/spectator";

import { CookieTracker } from "../CookieTracker";

type SocketSpectator = Socket<ToClientEvents, ToServerEvents>;

export class SpectatorUI {
    static readonly options: {
        [index: string]: Array<
            [string, "option1" | "option2" | "option3" | "noAction"]
        >;
    } = {
        initialDisplay: [
            ["change fall rate", "option1"],
            ["choose next piece", "option2"],
            ["random piece swap", "option3"],
            ["no action", "noAction"],
        ],
        fallRate: [
            ["increase fall rate", "option1"],
            ["decrease fall rate", "option2"],
        ],
        tetrominoSelection: [
            ["fixme piece", "option1"],
            ["fixme", "option2"],
            ["fixme", "option3"],
        ],
    };

    private socket: SocketSpectator;
    private cookieTracker: CookieTracker;
    private countdownTimer?: NodeJS.Timeout;
    private header: Phaser.GameObjects.BitmapText;
    private countdown: Phaser.GameObjects.BitmapText;
    private alreadyVoted: Phaser.GameObjects.BitmapText;
    private buttons: Array<Phaser.GameObjects.BitmapText>;

    constructor(scene: Scene, socket: SocketSpectator) {
        this.socket = socket;
        this.cookieTracker = new CookieTracker();

        const startX = BOARD_PX - 13.75 * TILE_SIZE;
        let startY = BOARD_PX - 11 * TILE_SIZE;

        this.header = scene.add
            .bitmapText(startX, startY, "brawl", "vote on next event")
            .setVisible(false);
        this.countdown = scene.add
            .bitmapText(startX, startY + 35, "brawl", "")
            .setVisible(false);

        startY += 105;
        this.alreadyVoted = scene.add
            .bitmapText(startX, startY, "brawl", "vote sent")
            .setVisible(false);

        // Initially set all buttons to longest option for equal hitboxes
        const longestOption = Object.values(SpectatorUI.options)
            .flat()
            .map((value) => value[0])
            .reduce((str1, str2) => (str1.length > str2.length ? str1 : str2));

        this.buttons = new Array(4);
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i] = scene.add
                .bitmapText(startX, startY + i * 35, "brawl", longestOption)
                .setVisible(false)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => {
                    this.buttons[i].setTint(COLORS.lGreen);
                })
                .on("pointerout", () => {
                    this.buttons[i].clearTint();
                });
        }

        this.initListeners();
        // Request info on any on-going voting sequences.
        this.socket.emit("requestVotingSequence");
    }

    /**
     * Destroys all GameObjects belonging to this class.
     */
    public destroy() {
        this.removeListeners();
        this.removeTimedEvent();
        this.header.destroy();
        this.countdown.destroy();
        this.alreadyVoted.destroy();
        this.buttons.forEach((button) => button.destroy());
    }

    /**
     * Initialize the listeners for events received from the server.
     */
    private initListeners() {
        this.removeListeners();

        this.socket.on("showVotingSequence", (votingSequence) => {
            this.generateTimedEvent(votingSequence);
        });

        this.socket.on("hideVotingSequence", () => {
            this.removeTimedEvent();
            this.cookieTracker.deleteCookie("hasVoted");
        });

        this.socket.on("sendVotingCountdown", (secondsLeft) => {
            this.syncCountdown(secondsLeft);
        });
    }

    /**
     * Remove all listeners associated to spectator functionality.
     */
    public removeListeners() {
        this.socket.removeListener("showVotingSequence");
        this.socket.removeListener("hideVotingSequence");
        this.socket.removeListener("sendVotingCountdown");
    }

    /**
     * Generate the spectator voting section.
     * @param valFromServer Specifies which buttons to be loading in for this sequence.
     */
    private generateTimedEvent(valFromServer: string) {
        this.removeTimedEvent();
        this.createOptions(valFromServer);
    }

    /**
     * Remove the spectator voting section.
     */
    private removeTimedEvent() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        this.header.setVisible(false);
        this.countdown.setVisible(false);
        this.alreadyVoted.setVisible(false);
        this.hideButtons();
    }

    /**
     * Generate options for the user to select.
     * @param votingOption This value is received from the server. Based off the value obtained, display a different set of buttons.
     */
    private createOptions(votingOption: string) {
        this.header.setVisible(true);
        this.countdown.setTint(COLORS.green).setVisible(true);
        this.updateCountdown(10);
        this.socket.emit("requestVotingCountdown");

        // Only show options if the user has not already voted.
        if (this.cookieTracker.getCookie("hasVoted")) {
            this.alreadyVoted.setVisible(true);
            return;
        }

        SpectatorUI.options[votingOption].forEach(([str, val], i) => {
            this.buttons[i]
                .setVisible(true)
                .setText("> " + str)
                .on("pointerup", () => {
                    this.hideButtons();
                    this.socket.emit("vote", val);
                    this.cookieTracker.setCookie("hasVoted", "true");
                    this.alreadyVoted.setVisible(true);
                });
        });
    }

    /**
     * Hide the voting buttons.
     */
    private hideButtons() {
        this.buttons.forEach((button) => button.setVisible(false));
    }

    /**
     * Modifies the countdown number and color depending on the number of seconds remaining.
     * @param secondsLeft The seconds left on the counter.
     * @returns Whether to stop the 1second interval that the countdown runs on.
     */
    private updateCountdown(secondsLeft: number) {
        this.countdown.setText(`time left: ${secondsLeft}`);

        if (secondsLeft < 0) {
            this.removeTimedEvent();
            return true;
        } else if (secondsLeft < 4) {
            this.countdown.setTint(COLORS.orange);
        } else if (secondsLeft < 7) {
            this.countdown.setTint(COLORS.lOrange);
        }

        return false;
    }

    /**
     * Update the seconds on the counter.
     * @param secondsLeft The number of seconds left on the voting sequence (received from the server).
     */
    private syncCountdown(secondsLeft: number) {
        this.updateCountdown(secondsLeft);

        // Start the countdown.
        this.countdownTimer = setInterval(() => {
            if (this.updateCountdown(secondsLeft)) {
                if (this.countdownTimer) {
                    clearInterval(this.countdownTimer);
                }
            }
            secondsLeft--;
        }, 1000);
    }
}
