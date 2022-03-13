import { Socket } from "socket.io-client";
import { TetrominoType } from "common/TetrominoType";
import { Tetromino } from "./Tetromino";
import { BOARD_SIZE } from "common/shared";
import { ToServerEvents, ToClientEvents } from "common/messages/game";

type GameSocket = Socket<ToClientEvents, ToServerEvents>;

export class GameState {
    // used for synchronization. not related to rendering (no sprites, scene, phaser3 stuff)
    socket: GameSocket;

    // board contains all placed monominoes (tiles)
    board: Array<Array<TetrominoType | null>>;

    // synced to server
    currentTetromino: Tetromino;
    // synced from server, ordered by increasing, circular player numbers
    // i.e. if you are player 1, these are of player 2, then 3, then 0
    otherTetrominoes: Array<Tetromino>;
    playerId!: 0 | 1 | 2 | 3;

    private initBoard() {
        this.board = new Array(BOARD_SIZE);
        for (let r = 0; r < BOARD_SIZE; r++) {
            this.board[r] = new Array(BOARD_SIZE).fill(null);
        }

        const centerTopLeft = BOARD_SIZE / 2 - 1;
        this.board[centerTopLeft][centerTopLeft] = TetrominoType.O;
        this.board[centerTopLeft + 1][centerTopLeft] = TetrominoType.O;
        this.board[centerTopLeft][centerTopLeft + 1] = TetrominoType.O;
        this.board[centerTopLeft + 1][centerTopLeft + 1] = TetrominoType.O;
    }

    private getPlayerIndex(playerId: number) {
        return (3 - this.playerId + playerId) % 4;
    }

    constructor(socket: GameSocket) {
        this.socket = socket;
        this.initBoard();

        this.currentTetromino = new Tetromino(TetrominoType.T);
        // other player's moving piece, TODO this is synchronized with the server
        // how they are rendered is not concerned.
        this.otherTetrominoes = [
            // FIXME not good?
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
            new Tetromino(TetrominoType.T),
        ];

        // initial rotation
        this.otherTetrominoes.map((tetro, i) => {
            tetro.setRotatedPosition(tetro.position, i + 1);
            tetro.setRotation(i + 1);
        });

        this.socket.on("initPlayer", (playerId) => {
            this.playerId = playerId;
        });

        this.socket.on("playerMove", (playerId, state) => {
            const i = this.getPlayerIndex(playerId);
            Tetromino.updateFromState(this.otherTetrominoes[i], state, i + 1);
        });

        this.socket.on("playerPlace", (playerId, state) => {
            if (playerId == this.playerId) {
                // the placing event is emitted by this very client, who already handled the local board during emitting
                return;
            }

            // place the tetro on our board
            const i = this.getPlayerIndex(playerId);
            const tetroToPlace = this.otherTetrominoes[i];

            Tetromino.updateFromState(tetroToPlace, state, i + 1);
            this.placeTetromino(tetroToPlace);
        });
    }

    public placeTetromino(tetromino: Tetromino) {
        tetromino.tiles.forEach((tile) => {
            const [row, col] = [
                tetromino.position[0] + tile[0],
                tetromino.position[1] + tile[1],
            ];
            this.board[row][col] = tetromino.type;
        });
    }
}
