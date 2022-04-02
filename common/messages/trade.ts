import { TetrominoType } from "../TetrominoType";
export interface ToClientEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
    sendRandomPiece: (tetrominoType: TetrominoType) => void;
}

export interface ToServerEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
    sendRandomPiece: (tetrominoType: TetrominoType) => void;
}
