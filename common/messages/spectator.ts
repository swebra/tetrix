import {TetrominoType} from "../TetrominoType"
import {PlayerPosition, PlayerID, MoveEvent} from "../message"
import {ColoredScore} from "./scoreboard"

export interface DownEvents {
  endSequence: (data: Array<ColoredScore>) => void;
  startSequence: () => void;
  showVotingSequence: (votingSequence: string) => void;
  hideVotingSequence: () => void;
  sendVotingCountdown: (secondsLeft: number) => void;
}

export interface UpEvents {
  requestVotingSequence: () => void;
  vote: (playerVote: "option1" | "option2" | "option3" | "noAction") => void;
  requestVotingCountdown: () => void;
}

