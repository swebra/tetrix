import {ColoredScore} from "../shared";

export interface ToClientEvents {
  toSceneFullscreenScoreboard: (data: Array<ColoredScore>) => void;
}

export interface ToServerEvents {
}
