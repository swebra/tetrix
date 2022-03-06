import { TetrominoState, PlayerID } from "../message";

import { TradeState } from "../../client/src/scene/TradeUI";
export interface ToClientEvents {
    initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerTrade: (playerId: PlayerID, tetrominoState: TetrominoState, tradeState: TradeState) => void;
}

export interface ToServerEvents {
    playerMove: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerPlace: (playerId: PlayerID, tetrominoState: TetrominoState) => void;
    playerTrade: (playerId: PlayerID, tetrominoState: TetrominoState, tradeState: TradeState) => void;
}
