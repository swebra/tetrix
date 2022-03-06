import { Socket } from "socket.io-client";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { BOARD_SIZE } from "common/shared";
import { ToServerEvents, ToClientEvents } from "common/messages/game";

type GameSocket = Socket<ToClientEvents, ToServerEvents>;

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket: GameSocket;

    // frozen board is the board without moving players, NOTE: frozenBoard is the truth of placed blocks
    frozenBoard: Array<Array<TetrominoType | null>>;
    // board is the final product being rendered. contains all 3 other players
    board: Array<Array<TetrominoType | null>>;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server, ordered by increasing, circular player numbers
    // i.e. if you are player 1, these are of player 2, then 3, then 0
    otherPieces: Array<Tetromino>;
    deadReckoningSystem!: DeadReckoningSystem;
    playerId!: 0 | 1 | 2 | 3;

    private blankBoard() {
        const board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
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

        // initial rotation
        this.otherPieces.map((tetro, i) => {
            tetro.setRotatedPosition(tetro.rawPosition, i + 1);
            tetro.setRotation(i + 1);
        });

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
            console.log("playerId: ", playerId);

            this.deadReckoningSystem = new DeadReckoningSystem(
                this.otherPieces
            );
        });

        this.socket.on("playerMove", (playerId, state) => {
            const i = (3 - this.playerId + playerId) % 4; // Circular distance
            this.otherPieces[i].rawPosition = state.position; // position before rotation
            this.deadReckoningSystem.refreshLastAppearance(i); // tell the system that the piece has moved, restart the timer

            this.otherPieces[i].setType(state.type);
            this.otherPieces[i].setRotatedPosition(state.position, i + 1);
            this.otherPieces[i].setRotation(i + 1 + state.rotation);
        });
    }
}

class DeadReckoningSystem {
    private static readonly FALL_INTERVAL = 1000; // 1 second in ms
    // local timestamp of last appearance of each player, in ms
    private lastAppearances!: Array<number>;
    private tetros: Array<Tetromino>;
    constructor(tetros: Array<Tetromino>) {
        this.tetros = tetros;
    }

    initTimer() {
        const now = new Date().getTime();
        this.lastAppearances = [now, now, now];
        console.log("init, lastAppearances: ", this.lastAppearances);
    }

    updateRemotePlayersIfDead(board: Array<Array<TetrominoType | null>>) {
        const tetros: Array<Tetromino> = [];
        const now = new Date().getTime();
        for (let i = 0; i < 3; i++) {
            // for each remote tetromino, see if they have not updated for at least FALL_INTERVAL
            // if so and it can still fall: call fall and rotate
            const lastAppearance = this.lastAppearances[i];
            const reckonedTetro = this.tetros[i];
            if (now - lastAppearance > DeadReckoningSystem.FALL_INTERVAL) {
                const didMove = reckonedTetro.moveIfCan(
                    board,
                    (reckonedTetro) => {
                        reckonedTetro.rawPosition[0] += 1;
                        // rotate
                        reckonedTetro.setRotatedPosition(
                            reckonedTetro.rawPosition,
                            i + 1
                        );
                        reckonedTetro.setRotation(i + 1);
                    }
                );
                this.lastAppearances[i] = now;
            }
        }
        return tetros;
    }

    // update the last appearance of the player
    refreshLastAppearance(i: number) {
        this.lastAppearances[i] = new Date().getTime();
    }
}
