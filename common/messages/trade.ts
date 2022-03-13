import { TetrominoType } from "../TetrominoType";
export interface ToClientEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
}

export interface ToServerEvents {
    sendTradePiece: (tetrominoType: TetrominoType) => void;
}