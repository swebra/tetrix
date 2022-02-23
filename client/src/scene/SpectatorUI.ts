import { BOARD_SIZE } from "common/shared";
import { CookieTracker } from "../CookieTracker";
import { SceneGameArena } from "./SceneGameArena";
import { TextConfig } from "../TextConfig";

import { Socket } from "socket.io-client";
import { ToServerEvents, ToClientEvents } from "common/messages/spectator"

type SocketSpectator = Socket<ToClientEvents, ToServerEvents>;

export class SpectatorUI {
    private cookieTracker: CookieTracker;
    private scene: SceneGameArena;
    private countdown: Phaser.GameObjects.Text;
    private buttons: Array<Phaser.GameObjects.Text>;
    private alreadyVoted: Phaser.GameObjects.Text;
    private countdownConfig: TextConfig;
    private buttonConfig: TextConfig;

    private socket: SocketSpectator;

    constructor(scene: SceneGameArena, socket: SocketSpectator) {
        this.cookieTracker = new CookieTracker();
        this.socket = socket;
        this.initListeners()

        this.scene = scene;
        this.countdownConfig = {
            fontSize: `${BOARD_SIZE/1.5}px`,
            fontFamily: "VT323"
        };
        this.buttonConfig = {
            fontSize: `${BOARD_SIZE/1.7}px`,
            fontFamily: "VT323"
        };

        this.buttons = [];

        // Creating a blank text object(s).
        let y: number = BOARD_SIZE * 14;
        this.countdown = this.scene.add
            .text(14 * BOARD_SIZE, y, "", this.countdownConfig)
            .setTint(0x53bb74);

        this.alreadyVoted = this.scene.add
            .text(14 * BOARD_SIZE + 20, y + 90, "", this.buttonConfig)
            .setTint(0xe6e4da);

        this.buttons[0] = this.scene.add
            .text(14 * BOARD_SIZE + 20, y + 60, "", this.buttonConfig)
            .setTint(0xe6e4da);

        this.buttons[1] = this.scene.add
            .text(14 * BOARD_SIZE + 20, y + 90, "", this.buttonConfig)
            .setTint(0xe6e4da);

        this.buttons[2] = this.scene.add
            .text(14 * BOARD_SIZE + 20, y + 120, "", this.buttonConfig)
            .setTint(0xe6e4da);

        this.buttons[3] = this.scene.add
            .text(14 * BOARD_SIZE + 20, y + 150, "", this.buttonConfig)
            .setTint(0xe6e4da);

        console.log("spectator ui: ", this.socket)
        // Request info on any on-going voting sequences.
        this.socket.emit("requestVotingSequence");
    }

    initListeners() {
        // FIXME: Only show spectator things to "spectators" (not players).
        this.socket.on("showVotingSequence", (votingSequence) => {
            this.generateTimedEvent(votingSequence);
        })

        this.socket.on("hideVotingSequence", () => {
            this.removeTimedEvent();
        })

        this.socket.on("sendVotingCountdown", (secondsLeft) => {
            this.syncCountdown(secondsLeft);
        })
    }

    /**
     * Generate the spectator voting section.
     * @param valFromServer Specifies which buttons to be loading in for this sequence.
     */
    public generateTimedEvent(valFromServer: string) {
        this.removeTimedEvent();
        this.createOptions(valFromServer);
    }

    /**
     * Remove the spectator voting section.
     */
    public removeTimedEvent() {
        this.countdown.setText("");
        this.alreadyVoted.setText("");

        this.cookieTracker.deleteCookie("hasVoted");

        this.hideOptions();
    }

    /**
     * Generate options for the user to select.
     * @param votingOption This value is received from the server. Based off the value obtained, display a different set of buttons.
     */
    private createOptions(votingOption: string) {
        this.countdown.setText("Vote on what happens!\n  Time left: 10").setTint(0x53bb74);

        this.socket.emit("requestVotingCountdown");

        // Only show options if the user has not already voted.
        if (this.cookieTracker.getCookie("hasVoted")) {
            this.alreadyVoted.setText("  Your vote has\n    been sent!");
            return;
        }

        switch (votingOption) {
            case "initialDisplay":
                // Initial voting step. Generate round 1 of votes.
                this.setVotingButton(this.buttons[0], "> Change Fall Rate", "option1");
                this.setVotingButton(this.buttons[1], "> Choose Next Block", "option2");
                this.setVotingButton(this.buttons[2], "> Randomize Their Blocks", "option3");
                this.setVotingButton(this.buttons[3], "> No Action", "noAction");
                break;
            case "fallRate":
                // Second voting step. Generate Fall rate options.
                this.setVotingButton(this.buttons[0], "> Increase Fall Rate", "option1");
                this.setVotingButton(this.buttons[1], "> Decrease Fall Rate", "option2");
                break;
            case "tetrominoSelection":
                // Second voting step. Generate next block options.
                this.setVotingButton(this.buttons[0], "> FIXME", "option1");
                this.setVotingButton(this.buttons[1], "> FIXME", "option2");
                this.setVotingButton(this.buttons[2], "> FIXME", "option3");
                break;
        }
    }

    /**
     * Setup the voting buttons with interactions.
     * @param button The button to modify.
     * @param buttonText The new text to set for the button.
     * @param valForServer The value to send to the server if the button is clicked.
     */
    private setVotingButton(button: Phaser.GameObjects.Text, buttonText: string, valForServer: "option1" | "option2" | "option3" | "noAction") {
        button.setText(buttonText)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => { this.isHovered(button, true) })
            .on("pointerout", () => { this.isHovered(button, false) })
            .on("pointerup", () => {
                this.hideOptions();
                this.socket.emit("vote", valForServer);
                this.cookieTracker.setCookie("hasVoted", "true");
                this.alreadyVoted.setText("  Your vote has\n    been sent!");
            });
    }

    /**
     * Change the color of the button if it is hovered or not.
     * @param button The button to modify.
     * @param isHovered Whether the button is being hovered or not.
     */
    private isHovered(button: Phaser.GameObjects.Text, isHovered: boolean) {
        if (isHovered) {
            button.setTint(0xd4cb22);
        } else {
            button.setTint(0xe6e4da);
        }
    }

    /**
     * Hide the voting sequence.
     */
    private hideOptions() {
        for (let element of this.buttons) {
            element.setText("");
        }
    }

    /**
     * Modifies the countdown numbers and css depending on the number of seconds remaining.
     * @param secondsLeft The seconds left on the counter.
     * @returns Whether to stop the 1second interval that the countdown runs on.
     */
    private updateCountdown(secondsLeft: number) {
        this.countdown.setText(`Vote on what happens!\n Time left: ${secondsLeft}`);

        if (secondsLeft < 0) {
            this.removeTimedEvent();
            this.cookieTracker.deleteCookie("hasVoted");
            return true;
        } else if (secondsLeft < 4)  {
            // Add the Red background.
            this.countdown.setTint(0xe5554e);
        } else if (secondsLeft < 7)  {
            // Add the Yellow background.
            this.countdown.setTint(0xebc85d);
        }

        return false;
    }

    /**
     * Update the seconds on the counter.
     * @param secondsLeft The number of seconds left on the voting sequence (received from the server).
     */
    public syncCountdown(secondsLeft: number) {
        this.updateCountdown(secondsLeft);

        // Start the countdown.
        let interval = setInterval(() => {
            if (this.updateCountdown(secondsLeft)) {
                clearInterval(interval);
            }

            secondsLeft--;
        }, 1000);
    }
}
