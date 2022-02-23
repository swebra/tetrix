import {ColoredScore} from "../shared";

export interface ToClientEvents {
  updateScoreboard: (data: Array<ColoredScore>) => void;
}

export interface ToServerEvents {
  requestScoreboardData: () => void;
}
