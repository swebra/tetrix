import { TetrominoState, PlayerID } from "../message";
import { TradeState } from "../TradeState";
import { TetrominoType } from "../TetrominoType";
import { BoardState } from "../shared";

export interface ToClientEvents {
    initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerTrade: (
        playerId: PlayerID,
        tetrominoType: TetrominoType,
        tradeState: TradeState
    ) => void;
    sendTradePiece: (tetrominoType: TetrominoType) => void;
    clearTrade: () => void;
    reportBoard: (callback: (board: BoardState) => void) => void;
    randomTrade: (playerIds: [number, number]) => void;
    sendRandomPiece: (tetrominoType: TetrominoType) => void;
}

export interface ToServerEvents {
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerTrade: (
        playerId: PlayerID,
        tetrominoType: TetrominoType,
        tradeState: TradeState
    ) => void;
    clearTrade: () => void;
    endGame: () => void;
    gainPoints: (playerId: PlayerID, score: 1 | 3 | 5 | 8) => void;
    losePoints: (playerId: PlayerID) => void;
    sendRandomPiece: (tetrominoType: TetrominoType) => void;
}
