import { BOARD_SIZE } from "common/shared";
import { CookieTracker } from "./CookieTracker";
import { GameState } from "./GameState";
import { SceneGameArena } from "./SceneGameArena";

export class SpectatorUI {
    private cookieTracker: CookieTracker;
    private scene: SceneGameArena;
    private countdown: any;
    private buttons: any[];
    private gameState: GameState;
    private countdownConfig: any;
    private buttonConfig: any;

    constructor(scene: SceneGameArena, gameState: GameState) {
        this.cookieTracker = new CookieTracker();
        this.scene = scene;
        this.gameState = gameState;
        this.countdownConfig = {
            fontSize: `${BOARD_SIZE}px`,
            fontFamily: "VT323"
        };
        this.buttonConfig = {
            fontSize: `${BOARD_SIZE/2}px`,
            fontFamily: "VT323"
        };

        this.buttons = [];

        // Creating a blank text object.
        this.countdown = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "", this.countdownConfig)
            .setTint(0x53bb74);

        this.buttons[0] = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "", this.buttonConfig)
            .setTint(0x53bb74);

        this.buttons[0] = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "", this.buttonConfig)
            .setTint(0x53bb74);

        this.buttons[0] = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "", this.buttonConfig)
            .setTint(0x53bb74);

        this.buttons[0] = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "", this.buttonConfig)
            .setTint(0x53bb74);
    }

    /**
     * Generate the spectator voting section.
     * @param valFromServer Specifies which buttons to be loading in for this sequence.
     */
    public generateTimedEvent(valFromServer: string) {
        this.removeTimedEvent();
        this.createOptions(valFromServer);

        // Request the current countdown value from server.
        this._sendToServer("requestCountdownValue", null);
    }

    /**
     * Remove the spectator voting section.
     */
    public removeTimedEvent() {
        if (this.countdown) {
            this.countdown.setText("");
        }
    }

    private createOptions(votingOption: string) {
        this.countdown = this.scene.add
            .text(14 * BOARD_SIZE + 60, BOARD_SIZE - 30, "Vote on what happens Next!".padEnd(10) + "10", this.countdownConfig)
            .setTint(0x53bb74);


        switch (votingOption) {
            case "initialDisplay":
                // Initial voting step. Generate round 1 of votes.
                btnLocation.appendChild(this._generateVotingButtions("Change Fall Rate", "option1"));
                btnLocation.appendChild(this._generateVotingButtions("Choose Next Block", "option2"));
                btnLocation.appendChild(this._generateVotingButtions("Randomize Their Blocks", "option3"));

                document.getElementById("no-action-location").setAttribute("class", "col text-center disabled-btn");
                document.getElementById("no-action-text").innerHTML = "No Action";
                document.getElementById("no-action-location").addEventListener("click", () => {
                    if (document.getElementById("no-action-location").classList.contains("btn")) {
                        document.getElementById("no-action-location").setAttribute("class", "col text-center confirmed-btn");
                        this.cookieTracker.setCookie("hasVoted", "true");
                        this._sendToServer("vote", "noAction");
                        this._disableOtherButtons();
                    }
                }, false);
                break;
            case "fallRate":
                // Second voting step. Generate Fall rate options.
                btnLocation.appendChild(this._generateVotingButtions("Increase Fall Rate (20 Seconds)", "option1"));
                btnLocation.appendChild(this._generateVotingButtions("Decrease Fall Rate (20 Seconds)", "option2"));
                break;
            case "tetrominoSelection":
                // Second voting step. Generate next block options.
                btnLocation.appendChild(this._generateVotingButtions("FIXME", "option1"));
                btnLocation.appendChild(this._generateVotingButtions("FIXME", "option2"));
                btnLocation.appendChild(this._generateVotingButtions("FIXME", "option3"));
                break;
        }
    }

    // Create a voting button based off a given text.
    _generateVotingButtions(buttonText, valForServer) {
        let btn = document.createElement("div");

        btn.setAttribute("class", "col text-center disabled-btn");

        let span = document.createElement("span");
        span.innerHTML = buttonText;

        btn.appendChild(span);
        btn.addEventListener("click", () => {
            if (btn.classList.contains("btn")) {
                btn.setAttribute("class", "col text-center confirmed-btn");
                this._sendToServer("vote", valForServer);
                this.cookieTracker.setCookie("hasVoted", "true");
                this._disableOtherButtons();
            }
        }, false);

        return btn;
    }

    _sendToServer(event, data) {
        this.socket.emit(event, data);
    }

    // Disable all other buttons.
    _disableOtherButtons() {
        document.querySelectorAll(".btn").forEach((btn) => {
            btn.setAttribute("class", "col text-center disabled-btn");
        })
    }

    // Enable all other buttons.
    _enableOtherButtons() {
        document.querySelectorAll(".disabled-btn").forEach((btn) => {
            btn.setAttribute("class", "col text-center btn");
        })
    }

    // Modifies the countdown numbers and css depending on the number of seconds remaining.
    // Returns whether to stop the 1second interval that the countdown runs on.
    _updateCountdown(countdown, seconds_left) {
        countdown.innerHTML = `<span>${seconds_left}</span>`;

        if (seconds_left == 0) {
            this._disableOtherButtons();
            this.cookieTracker.deleteCookie("hasVoted");
            return true;
        } else if (seconds_left < 4)  {
            // Add the Red background.
            countdown.classList.remove('color-half');
            countdown.classList.add('color-empty');
        } else if (seconds_left < 7)  {
            // Add the Yellow background.
            countdown.classList.remove('color-full');
            countdown.classList.add('color-half');
        }

        return false;
    }

    // Update the seconds on screen.
    syncCountdown(seconds_left) {
        seconds_left = parseInt(seconds_left);
        let countdown = document.getElementById("tiles");
        this._updateCountdown(countdown, seconds_left);

        // Enable the buttons if the countdown has begun and they havent voted before.
        if (!this.cookieTracker.getCookie("hasVoted") && seconds_left > 0) {
            this._enableOtherButtons();
        }

        // Start the countdown.
        let interval = setInterval(() => {
            if (this._updateCountdown(countdown, seconds_left)) {
                clearInterval(interval);
            }

            seconds_left--;
        }, 1000);
    }
}
