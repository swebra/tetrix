import {PlayerPosition, PlayerID, MoveEvent} from "../message"

export interface DownEvents {
  initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
  playerMove: (playerId: PlayerID, moveEvent: MoveEvent, position: PlayerPosition) => void; // position: the position after this event, for verification purposes?
  playerPlace: (playerId: PlayerID, position: PlayerPosition) => void;
}


export interface UpEvents {
  hello: () => void;
  playerMove: (playerId: PlayerID, moveEvent: MoveEvent, position: PlayerPosition) => void; // position: the position after this event, for verification purposes?
  playerPlace: (playerId: PlayerID, position: PlayerPosition) => void;
}

