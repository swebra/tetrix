import { TetrominoType } from "./TetrominoType";
export const BOARD_SIZE = 40;
export const TILE_SIZE = 40;
export const TILE_SCALE = TILE_SIZE / 8;
export const BOARD_PX = BOARD_SIZE * TILE_SIZE;

export const COLORS = {
    orange: 0xf83800,
    green: 0x00ab00,
    pink: 0xdb00cd,
    blue: 0x0058f8,
    lOrange: 0xffa347,
    lGreen: 0xb8f818,
    lPink: 0xf878f8,
    lBlue: 0x3fbfff,
};

export type ColoredScore = { color: string; points: number };

export type MonominoState = {
    position: [number, number];
    type: TetrominoType;
    ownerId: 0 | 1 | 2 | 3 | null;
};

export type BoardState = Array<Array<MonominoState | null | false>>;
