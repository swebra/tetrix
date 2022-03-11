import { ColoredScore } from "../shared";

export interface ToClientEvents {
    toSceneGameOver: (data: Array<ColoredScore>) => void;
    updateFallRate: (fallRate: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ToServerEvents {
    requestFallRate: () => void;
}
