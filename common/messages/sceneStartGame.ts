export interface ToClientEvents {
  updateRemainingPlayers: (remainingPlayers: number) => void;
  toSceneGameArena: () => void;
}

export interface ToServerEvents {
  requestRemainingPlayers: () => void;
  joinGame: () => void;
}
