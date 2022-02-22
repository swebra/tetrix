import { io, Socket } from "socket.io-client";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { BOARD_SIZE } from "common/shared";
import {
    ServerToClientEvents,
    ClientToServerEvents,
} from "../../common/message";

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket!: Socket<ServerToClientEvents, ClientToServerEvents>;

    // frozen board is the board without moving players, NOTE: frozenBoard is the truth of placed blocks
    frozenBoard: Array<Array<TetrominoType>>;
    // board is the final product being rendered. contains all 3 other players
    board: Array<Array<TetrominoType>>;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server
    otherPieces: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    private blankBoard() {
        let board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            let row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                row.push(TetrominoType.Empty);
            }
            board.push(row);
        }
        return board;
    }

    constructor() {
        this.board = this.blankBoard();
        this.frozenBoard = this.blankBoard();

        this.currentTetromino = new Tetromino(TetrominoType.T);
        // other player's moving piece, TODO this is synchronized with the server
        // how they are rendered is not concerned.
        this.otherPieces = [
            // FIXME not good?
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
        ];

        this.socket = io(
            (import.meta.env.PROD && window.location.origin) ||
            "http://localhost:3001/"
        );
        console.log(this.socket);

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
            console.log("playerId: ", playerId);
        });

        // other player is sending in some action, should re-render using onPlayerAction
        this.socket.on("playerMove", (playerId, event, position) => {
            console.log("received remote action: ", event, ", from ", playerId);
            let otherPlayerIndex = ((playerId + 4 - this.playerId) % 4) - 1; // FIXME hack.
            console.log("this otherplayer is: ", otherPlayerIndex);

            this.otherPieces[otherPlayerIndex].position = position.tetroPosition;
            this.otherPieces[otherPlayerIndex].rotation = position.rotation;
            this.otherPieces[otherPlayerIndex].type = position.tetroType;
            this.onRemoteUpdate();
        });

        this.socket.on("updateScoreboard", (playerScores) => {
            this.updateScoreboard(playerScores);
        });

        this.socket.on("endSequence", (playerScores) => {
            this.fullScoreboard(playerScores);
        });

        this.socket.on("startSequence", () => {
            this.startSequence();
        });

        this.socket.on("showVotingSequence", (valFromServer) => {
            this.showVotingSequence(valFromServer);
        });

        this.socket.on("hideVotingSequence", () => {
            this.hideVotingSequence();
        });

        this.socket.on("sendVotingCountdown", (secondsLeft) => {
            this.sendVotingCountdown(secondsLeft);
        });

        this.socket.on("sendRemainingPlayers", (remainingPlayers) => {
            this.updateRemainingPlayers(remainingPlayers);
        });

        this.socket.on("startGame", () => {
            this.startGame();
        })
    }

    // Events received from server.
    onRemoteUpdate: () => void = () => { };
    updateScoreboard!: (data: Array<{ color: string, hex: number, points: number }>) => void;
    fullScoreboard!: (data: Array<{ color: string, hex: number, points: number }>) => void;
    startSequence!: () => void;
    showVotingSequence!: (data: string) => void;
    hideVotingSequence!: () => void;
    sendVotingCountdown!: (secondsLeft: number) => void;
    updateRemainingPlayers!: (remainingPlayers: number) => void;
    startGame!: () => void;

    // Events sent to server.
    public requestScoreboardData() {
        this.socket.emit("requestScoreboardData");
    }

    public requestVotingSequence() {
        this.socket.emit("requestVotingSequence");
    }

    public sendVotingSubmission(vote: "option1" | "option2" | "option3" | "noAction") {
        this.socket.emit("vote", vote);
    }

    public requestVotingCountdown() {
        this.socket.emit("requestVotingCountdown");
    }

    public requestRemainingPlayers() {
        this.socket.emit("requestRemainingPlayers");
    }

    public joinGame() {
        this.socket.emit("joinGame");
    }
}
