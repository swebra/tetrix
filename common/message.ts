import {TetrominoType} from "./TetrominoType"

interface ServerToClientEvents {
  initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
  playerMove: (playerId: PlayerID, moveEvent: MoveEvent, position: PlayerPosition) => void; // position: the position after this event, for verification purposes?
  playerFall: (playerId: PlayerID, position: PlayerPosition) => void;
  playerPlace: (playerId: PlayerID, position: PlayerPosition) => void;
}

type PlayerID = 0 | 1 | 2 | 3;

enum MoveEvent {
  Up,
  Down,
  Left,
  Right,
}

interface PlayerPosition {
    tetroPosition: [number, number];
    rotation: 0 | 1 | 2 | 3;
    tetroType: TetrominoType
}

interface ClientToServerEvents {
  hello: () => void;
  playerMove: (playerId: PlayerID, moveEvent: MoveEvent, position: PlayerPosition) => void; // position: the position after this event, for verification purposes?
  playerFall: (playerId: PlayerID, position: PlayerPosition) => void;
  playerPlace: (playerId: PlayerID, position: PlayerPosition) => void;
}

export { ServerToClientEvents, ClientToServerEvents, MoveEvent, PlayerPosition };
