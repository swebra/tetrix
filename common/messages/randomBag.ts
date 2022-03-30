import { TetrominoType } from "../TetrominoType";

export interface ToClientEvents {
    votedTetroToSpawn: (type: TetrominoType) => void;
}

/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
export interface ToServerEvents {}
