import { PlayerColor } from "./PlayerAttributes";
import { Level } from "./Level";
import {
    broadcastUpdateScoreboard,
    broadcastToSceneWaitingRoom,
    broadcastToSceneGameOver,
} from "../index";

import { ToServerEvents, ToClientEvents } from "common/messages/scoreboard";
import { ColoredScore } from "common/shared";
import { Socket } from "socket.io";

type SocketScoreboard = Socket<ToServerEvents, ToClientEvents>;

export class Scoreboard {
    private _orangeScore: number;
    private _greenScore: number;
    private _pinkScore: number;
    private _blueScore: number;
    private _accumulatedScore: number;
    private _scoreMap: Array<ColoredScore>;
    private _finalScores: Array<ColoredScore>;

    constructor() {
        this._orangeScore = 0;
        this._greenScore = 0;
        this._pinkScore = 0;
        this._blueScore = 0;
        this._accumulatedScore = 0;

        this._finalScores = [];

        this._scoreMap = [];
        this._scoreMap.push({
            color: "orange",
            points: this.orangeScore,
        });

        this._scoreMap.push({
            color: "green",
            points: this.greenScore,
        });

        this._scoreMap.push({
            color: "pink",
            points: this.pinkScore,
        });

        this._scoreMap.push({
            color: "blue",
            points: this.blueScore,
        });
    }

    public initSocketListeners(socket: SocketScoreboard, level: Level) {
        socket.on("requestScoreboardData", () => {
            const clonedData = Object.assign([], this.scoreMap);
            clonedData.push({
                color: "level",
                points: level.currentLevel,
            });

            socket.emit("updateScoreboard", clonedData);
        });
    }

    get orangeScore(): number {
        return this._orangeScore;
    }

    get greenScore(): number {
        return this._greenScore;
    }

    get pinkScore(): number {
        return this._pinkScore;
    }

    get blueScore(): number {
        return this._blueScore;
    }

    get currentTeamScore(): number {
        return (
            this._orangeScore +
            this._greenScore +
            this._pinkScore +
            this._blueScore
        );
    }

    get scoreMap(): Array<ColoredScore> {
        return this._scoreMap;
    }

    get finalScores(): Array<ColoredScore> {
        return this._finalScores;
    }

    /**
     * Reset all scores.
     */
    public resetScores() {
        this._orangeScore = 0;
        this._greenScore = 0;
        this._pinkScore = 0;
        this._blueScore = 0;
        this._accumulatedScore = 0;
    }

    /**
     * Increment the score of a given player.
     * @param playerIndex The player index number (representing a color).
     * @param value The amount to award the player.
     * @param level The level object. Used to *possibly* increase the level of the game.
     */
    public incrementScore(playerIndex: number, value: number, level: Level) {
        this._accumulatedScore += value;

        switch (playerIndex) {
            case PlayerColor.Orange:
                this._orangeScore += value;
                break;
            case PlayerColor.Green:
                this._greenScore += value;
                break;
            case PlayerColor.Pink:
                this._pinkScore += value;
                break;
            case PlayerColor.Blue:
                this._blueScore += value;
                break;
        }

        // Reset the score if the level was incremented.
        if (level.checkUpdateLevel(this._accumulatedScore)) {
            this._accumulatedScore = 0;
        }

        this.updateScoreboardUI(level.currentLevel);
    }

    /**
     * Decrease the score of a given player.
     * @param playerIndex The player index number (representing a color).
     * @param value The value to decrememnt the score by.
     * @param currentLevel The current level of the game.
     */
    public decrementScore(
        playerIndex: number,
        value: number,
        currentLevel: number
    ) {
        switch (playerIndex) {
            case PlayerColor.Orange:
                this._orangeScore -= value;
                if (this._orangeScore <= 0) {
                    this._orangeScore = 0;
                }
                break;
            case PlayerColor.Green:
                this._greenScore -= value;
                if (this._greenScore <= 0) {
                    this._greenScore = 0;
                }
                break;
            case PlayerColor.Pink:
                this._pinkScore -= value;
                if (this._pinkScore <= 0) {
                    this._pinkScore = 0;
                }
                break;
            case PlayerColor.Blue:
                this._blueScore -= value;
                if (this._blueScore <= 0) {
                    this._blueScore = 0;
                }
                break;
        }

        this.updateScoreboardUI(currentLevel);
    }

    /**
     * Update the values of the score map. This is handled separately since it is a sorted array of objects.
     */
    private updateScoreMap() {
        for (let i = 0; i < this._scoreMap.length; i++) {
            switch (this._scoreMap[i].color) {
                case "orange":
                    this._scoreMap[i].points = this.orangeScore;
                    break;
                case "green":
                    this._scoreMap[i].points = this.greenScore;
                    break;
                case "pink":
                    this._scoreMap[i].points = this.pinkScore;
                    break;
                case "blue":
                    this._scoreMap[i].points = this.blueScore;
                    break;
            }
        }

        // Sort in descending order.
        this._scoreMap.sort((a, b) => {
            return b.points - a.points;
        });
    }

    /**
     * Notifies the client of the updated scoreboard.
     */
    public updateScoreboardUI(level: number) {
        this.updateScoreMap();

        // Temporary clone of the data so that we can append the level of the game.
        const clonedData = Object.assign([], this._scoreMap);
        clonedData.push({
            color: "level",
            points: level,
        });

        // Notify all connected users.
        broadcastUpdateScoreboard(clonedData);
    }

    /**
     * Display the game over screen with the fullscreen scoreboard UI.
     */
    public displaySceneGameOver() {
        this.updateScoreMap();

        this._finalScores = Object.assign([], this._scoreMap);
        this._finalScores.push({
            color: "total",
            points: this.currentTeamScore,
        });

        // Show scoreboard to all connected users.
        broadcastToSceneGameOver(this._finalScores);

        // Return to starting sequence after 30 seconds.
        setTimeout(() => {
            broadcastToSceneWaitingRoom();
            this.resetScores();
        }, 30000);
    }
}
