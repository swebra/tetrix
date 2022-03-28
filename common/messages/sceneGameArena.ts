import { ColoredScore } from "../shared";

export interface ToClientEvents {
    toSceneGameOver: (data: Array<ColoredScore>) => void;
    updateFallRate: (fallRate: number) => void;
    initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
}

export interface ToServerEvents {
    requestFallRate: () => void;
}
