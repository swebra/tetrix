import {TetrominoType} from "./TetrominoType"
import { ToServerEvents as GameToServer, ToClientEvents as GameToClient } from "./messages/game"
import { ToServerEvents as SceneStartToServer, ToClientEvents as SceneStartToClient } from "./messages/sceneStartGame"
import { ToServerEvents as SceneGameToServer, ToClientEvents as SceneGameToClient } from "./messages/sceneGameArena"
import { ToServerEvents as ScoreboardToServer, ToClientEvents as ScoreboardToClient } from "./messages/scoreboard"
import { ToServerEvents as SpectatorToServer, ToClientEvents as SpectatorToClient } from "./messages/spectator"
import { ToServerEvents as SceneFullscreenScoreboardToServer, ToClientEvents as SceneFullscreenScoreboardToClient } from "./messages/sceneFullscreenScoreboard"

export type ServerToClientEvents = GameToClient & SceneStartToClient & SceneGameToClient & ScoreboardToClient & SpectatorToClient & SceneFullscreenScoreboardToClient;
export type ClientToServerEvents = GameToServer & SceneStartToServer & SceneGameToServer & ScoreboardToServer & SpectatorToServer & SceneFullscreenScoreboardToServer;

export type PlayerID = 0 | 1 | 2 | 3;

export type TetrominoState = {
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    type: TetrominoType
}
