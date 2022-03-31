import { TetrominoState, PlayerID } from "../message";

export interface ToClientEvents {
    initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
}

export interface ToServerEvents {
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    endGame: () => void;
    gainPoints: (playerId: PlayerID, score: 1 | 3 | 5 | 8) => void;
}
