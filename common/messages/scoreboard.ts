import {TetrominoType} from "../TetrominoType"
import {PlayerPosition, PlayerID, MoveEvent} from "../message"

export type ColoredScore = { color: string, hex: number, points: number };

export interface DownEvents {
  updateScoreboard: (data: Array<ColoredScore>) => void;
  endSequence: (data: Array<{ color: string, hex: number, points: number }>) => void;
  startSequence: () => void;
  // showVotingSequence: (votingSequence: string) => void;
  // hideVotingSequence: () => void;
  // sendVotingCountdown: (secondsLeft: number) => void;
  // sendRemainingPlayers: (remainingPlayers: number) => void;
  // startGame: () => void;
}

export interface UpEvents {
  requestScoreboardData: () => void;
  // requestVotingSequence: () => void;
  // vote: (playerVote: "option1" | "option2" | "option3" | "noAction") => void;
  // requestVotingCountdown: () => void;
  // requestRemainingPlayers: () => void;
  // joinGame: () => void;
}

