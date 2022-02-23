import { TetrominoType } from "./TetrominoType"
import { ToServerEvents as GameToServer, ToClientEvents as GameToClient } from "./messages/game"
import { ToServerEvents as SceneWaitingRoomToServer, ToClientEvents as SceneWaitingRoomToClient } from "./messages/sceneWaitingRoom"
import { ToServerEvents as SceneGameToServer, ToClientEvents as SceneGameToClient } from "./messages/sceneGameArena"
import { ToServerEvents as ScoreboardToServer, ToClientEvents as ScoreboardToClient } from "./messages/scoreboard"
import { ToServerEvents as SpectatorToServer, ToClientEvents as SpectatorToClient } from "./messages/spectator"
import { ToServerEvents as SceneFullscreenScoreboardToServer, ToClientEvents as SceneFullscreenScoreboardToClient } from "./messages/sceneFullscreenScoreboard"

export type ServerToClientEvents = GameToClient & SceneWaitingRoomToClient & SceneGameToClient & ScoreboardToClient & SpectatorToClient & SceneFullscreenScoreboardToClient;
export type ClientToServerEvents = GameToServer & SceneWaitingRoomToServer & SceneGameToServer & ScoreboardToServer & SpectatorToServer & SceneFullscreenScoreboardToServer;

export type PlayerID = 0 | 1 | 2 | 3;

export type TetrominoState = {
    position: [number, number];
    rotation: 0 | 1 | 2 | 3;
    type: TetrominoType
}
