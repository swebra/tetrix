import {TetrominoType} from "../TetrominoType"
import {PlayerPosition, PlayerID, MoveEvent} from "../message"

export interface DownEvents {
  updateRemainingPlayers: (remainingPlayers: number) => void;
  startGame: () => void;
}

export interface UpEvents {
  requestRemainingPlayers: () => void;
  joinGame: () => void;
}

