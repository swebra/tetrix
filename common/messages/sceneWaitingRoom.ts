export interface ToClientEvents {
  updateRemainingPlayers: (remainingPlayers: number) => void;
  toSceneGameArena: () => void;
  initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
}

export interface ToServerEvents {
  requestRemainingPlayers: () => void;
  joinQueue: () => void;
}
