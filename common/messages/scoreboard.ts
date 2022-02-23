import {TetrominoType} from "../TetrominoType"
import {PlayerPosition, PlayerID, MoveEvent} from "../message"

export type ColoredScore = { color: string, hex: number, points: number };

export interface DownEvents {
  updateScoreboard: (data: Array<ColoredScore>) => void;
  endSequence: (data: Array<ColoredScore>) => void;
  startSequence: () => void;
}

export interface UpEvents {
  requestScoreboardData: () => void;
}

