export interface DownEvents {
  sendRemainingPlayers: (remainingPlayers: number) => void;
  startGame: () => void;
}

export interface UpEvents {
  requestRemainingPlayers: () => void;
  joinGame: () => void;
}
