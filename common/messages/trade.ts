import { TetrominoType } from "../TetrominoType";
export interface ToClientEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
    sendRandomPiece: (tetrominoType: TetrominoType, pairNum: 1 | 2) => void;
}

export interface ToServerEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
    sendRandomPiece: (tetrominoType: TetrominoType, pairNum: 1 | 2) => void;
}
