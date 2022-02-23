import {ColoredScore} from "../shared";

export interface ToClientEvents {
  toSceneGameOver: (data: Array<ColoredScore>) => void;
}

export interface ToServerEvents {
}
