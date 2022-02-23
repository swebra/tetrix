import { io, Socket } from "socket.io-client";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { BOARD_SIZE } from "common/shared";
import {
    UpEvents as GameUpEvents,
    DownEvents as GameDownEvents,
} from "common/messages/game";

type GameSocket = Socket<GameDownEvents, GameUpEvents>;

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket: GameSocket;

    // frozen board is the board without moving players, NOTE: frozenBoard is the truth of placed blocks
    frozenBoard: Array<Array<TetrominoType | null>>;
    // board is the final product being rendered. contains all 3 other players
    board: Array<Array<TetrominoType | null>>;

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
                row.push(null);
            }
            board.push(row);
        }
        return board;
    }

    constructor(socket: GameSocket) {
        this.socket = socket;
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
        });
    }
}
