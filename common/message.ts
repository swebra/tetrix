import {TetrominoType} from "./TetrominoType"
import { UpEvents as GameUp, DownEvents as GameDown } from "./messages/game"
import { UpEvents as SceneStartUp, DownEvents as SceneStartDown } from "./messages/sceneStartGame"
import { UpEvents as SceneGameUp, DownEvents as SceneGameDown } from "./messages/sceneGameArena"
import { UpEvents as ScoreboardUp, DownEvents as ScoreboardDown } from "./messages/scoreboard"
import { UpEvents as SpectatorUp, DownEvents as SpectatorDown } from "./messages/spectator"

export enum MoveEvent {
  Up,
  Down,
  Left,
  Right
}

export type ServerToClientEvents = GameDown & SceneStartDown & SceneGameDown & ScoreboardDown & SpectatorDown;
export type ClientToServerEvents = GameUp & SceneStartUp & SceneGameUp & ScoreboardUp & SpectatorUp;

export type PlayerID = 0 | 1 | 2 | 3;

export interface PlayerPosition {
    tetroPosition: [number, number];
    rotation: 0 | 1 | 2 | 3;
    tetroType: TetrominoType
}

