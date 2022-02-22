import {TetrominoType} from "../TetrominoType"
import {PlayerPosition, PlayerID, MoveEvent} from "../message"
import {ColoredScore} from "./scoreboard"

export interface DownEvents {
  endSequence: (data: Array<ColoredScore>) => void;
  startSequence: () => void;
}

export interface UpEvents {
}

