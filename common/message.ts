interface ServerToClientEvents {
  initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
  playerAction: (playerAction: PlayerAction) => void;
}

type PlayerEvent = MoveEvent; // potentially more, so MoveEvent | TradeEvent | MoreEvent

enum MoveEvent {
  Up,
  Down,
  Left,
  Right,
}

interface PlayerAction {
  event: MoveEvent; // potentially more? MoveEvent | TradeEvent
  playerId: 0 | 1 | 2 | 3;
}

interface ClientToServerEvents {
  hello: () => void;
  playerAction: (playerAction: PlayerAction) => void;
}

export { ServerToClientEvents, ClientToServerEvents, PlayerAction, MoveEvent, PlayerEvent };
