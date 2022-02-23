import { Player } from "./PlayerAttributes";
import { Level } from "./Level";
import { broadcastUpdateScoreboard, broadcastToSceneWaitingRoom, broadcastToSceneGameOver } from "../index";

import { ToServerEvents, ToClientEvents } from "common/messages/scoreboard";
import { ColoredScore } from "common/shared";
import { Socket } from "socket.io";

type SocketScoreboard = Socket<ToServerEvents, ToClientEvents>;

export class Scoreboard {
    private _orangeScore: number;
    private _greenScore: number;
    private _pinkScore: number;
    private _blueScore: number;
    private _totalScore: number;
    private _scoreMap: Array<ColoredScore>;

    constructor() {
        this._orangeScore = 0;
        this._greenScore = 0;
        this._pinkScore = 0;
        this._blueScore = 0;
        this._totalScore = 0;

        this._scoreMap = [];
        this._scoreMap.push({
            color: "Orange",
            hex: 0xFFA500,
            points: this.orangeScore
        });

        this._scoreMap.push({
            color: "Green",
            hex: 0x00FF00,
            points: this.greenScore
        });

        this._scoreMap.push({
            color: "Pink",
            hex: 0xFF00FF,
            points: this.pinkScore
        });

        this._scoreMap.push({
            color: "Blue",
            hex: 0x00BFFF,
            points: this.blueScore
        });
    }

    initSocketListeners(socket: SocketScoreboard, level: Level) {
      socket.on("requestScoreboardData", () => {
        let clonedData = Object.assign([], this.scoreMap);
        clonedData.push({
          color: "Level",
          hex: 0xFFFFFF,
          points: level.currentLevel
        });

        socket.emit("updateScoreboard", clonedData)
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

    get totalScore(): number {
        return this._totalScore;
    }

    get currentTeamScore(): number {
        return this._orangeScore + this._greenScore + this._pinkScore + this._blueScore;
    }

    get scoreMap(): Array<ColoredScore> {
        return this._scoreMap;
    }

    /**
     * Reset all scores.
     */
    public resetScores() {
        this._orangeScore = 0;
        this._greenScore = 0;
        this._pinkScore = 0;
        this._blueScore = 0;
        this._totalScore = 0;
    }

    /**
     * Increment the score of a given player.
     * @param playerIndex The player index number (representing a color).
     * @param value The amount to award the player.
     * @param level The level object. Used to *possibly* increase the level of the game.
     */
    public incrementScore(playerIndex: number, value: number, level: Level) {
        this._totalScore += value;

        switch (playerIndex) {
            case Player.Color.Orange:
                this._orangeScore += value;
                break;
            case Player.Color.Green:
                this._greenScore += value;
                break;
            case Player.Color.Pink:
                this._pinkScore += value;
                break;
            case Player.Color.Blue:
                this._blueScore += value;
                break;
        }

        level.checkUpdateLevel(this.totalScore);
        this.updateScoreboardUI(level.currentLevel);
    }

    /**
     * Decrease the score of a given player.
     * @param playerIndex The player index number (representing a color).
     * @param value The value to decrememnt the score by.
     * @param currentLevel The current level of the game.
     */
    public decrementScore(playerIndex: number, value: number, currentLevel: number) {
        switch (playerIndex) {
            case Player.Color.Orange:
                this._orangeScore -= value;
                if (this._orangeScore <= 0) {
                    this._orangeScore = 0;
                }
                break;
            case Player.Color.Green:
                this._greenScore -= value;
                if (this._greenScore <= 0) {
                    this._greenScore = 0;
                }
                break;
            case Player.Color.Pink:
                this._pinkScore -= value;
                if (this._pinkScore <= 0) {
                    this._pinkScore = 0;
                }
                break;
            case Player.Color.Blue:
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
                case "Orange":
                    this._scoreMap[i].points = this.orangeScore;
                    break;
                case "Green":
                    this._scoreMap[i].points = this.greenScore;
                    break;
                case "Pink":
                    this._scoreMap[i].points = this.pinkScore;
                    break;
                case "Blue":
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
        let clonedData = Object.assign([], this._scoreMap);
        clonedData.push({
            color: "Level",
            hex: 0xFFFFFF,
            points: level
        });

        // Notify all connected users.
        broadcastUpdateScoreboard(clonedData);
    }

    /**
     * Display the game over screen with the fullscreen scoreboard UI.
     */
    public displaySceneGameOver() {
        this.updateScoreMap();

        // Temporary clone of the data so that we can append the level of the game.
        let clonedData = Object.assign([], this._scoreMap);
        clonedData.push({
            color: "TEAM SCORE",
            hex: 0xFFFF00,
            points: this.currentTeamScore
        });

        // Show scoreboard to all connected users.
        broadcastToSceneGameOver(clonedData);

        // Return to starting sequence after 30 seconds.
        setTimeout(() => {
            broadcastToSceneWaitingRoom();
            this.resetScores();
        }, 10000);
    }
}
