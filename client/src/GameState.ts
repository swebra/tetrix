import { io, Socket } from "socket.io-client";
import { TetrominoType } from "./TetrominoType";
import { Tetromino } from "./Tetromino";
import {
    PlayerAction,
    MoveEvent,
    ServerToClientEvents,
    ClientToServerEvents,
} from "../../common/message";

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket!: Socket<ServerToClientEvents, ClientToServerEvents>;

    // synced from+to server?
    board: Array<Array<TetrominoType>>;
    // synced to server
    currentTetromino: Tetromino;
    // synced from server
    otherPieces: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    private blankBoard() {
        let board = [];
        for (let r = 0; r < 50; r++) {
            let row = [];
            for (let c = 0; c < 50; c++) {
                row.push(TetrominoType.Empty);
            }
            board.push(row);
        }
        return board;
    }

    constructor() {
        this.board = this.blankBoard();
        this.currentTetromino = new Tetromino(TetrominoType.T);
        // other player's moving piece, TODO this is synchronized with the server
        // how they are rendered is not concerned.
        this.otherPieces = [ // FIXME not good?
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
        ];

        this.socket = io("http://localhost:3001/");
        console.log(this.socket);

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
            console.log("playerId: ", playerId);
        });

        this.socket.on("updateScoreboard", (valFromServer) => {
            this.updateScoreboard(valFromServer);
        });

        this.socket.on("endSequence", (valFromServer) => {
            this.fullScoreboard(valFromServer);
        });

        this.socket.on("wipeScreen", () => {
            this.wipeScreen();
        });

        // other player is sending in some action, should re-render using onPlayerAction
        this.socket.on("playerAction", ({ event, playerId }) => {
            console.log("received remote action: ", event, ", from ", playerId)
            let otherPlayerIndex = (playerId + 4 - this.playerId) % 4 - 1 // FIXME hack.
            console.log("this otherplayer is: ", otherPlayerIndex)
            this.otherPieces[otherPlayerIndex]

            if (event == MoveEvent.Left) {
                // FIXME gameState is directly modified, pass in keyboard events and use a update() method?
                let [row, col] = this.otherPieces[otherPlayerIndex].position;
                this.otherPieces[otherPlayerIndex].position = [row, Math.max(0, col - 1)]; // TODO
            } else if (event == MoveEvent.Right) {
                let [row, col] = this.otherPieces[otherPlayerIndex].position;
                this.otherPieces[otherPlayerIndex].position = [row, Math.min(50, col + 1)]; // TODO
            }
            if (this.onPlayerAction) this.onPlayerAction({ event, playerId })
        })
    }

    fall() {
        // fall is called every 1 second
        this.currentTetromino.fall();
        this.otherPieces.forEach((tetro) => tetro.fall());
    }

    onPlayerAction!: (a: PlayerAction) => void;
    updateScoreboard!: (data: any) => void;
    fullScoreboard!: (data: any) => void;
    wipeScreen!: () => void;
}