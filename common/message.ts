import {TetrominoType} from "./TetrominoType"

interface ServerToClientEvents {
  initPlayer: (playerId: 0 | 1 | 2 | 3) => void;
  updateScoreboard: (data: Array<{ color: string, hex: number, points: number }>) => void;
  endSequence: (data: Array<{ color: string, hex: number, points: number }>) => void;
  playerMove: (playerId: PlayerID, moveEvent: MoveEvent, position: PlayerPosition) => void; // position: the position after this event, for verification purposes?
  playerFall: (playerId: PlayerID, position: PlayerPosition) => void;
  playerPlace: (playerId: PlayerID, position: PlayerPosition) => void;
  startSequence: () => void;
  showVotingSequence: (votingSequence: string) => void;
  hideVotingSequence: () => void;
  sendVotingCountdown: (secondsLeft: number) => void;
  sendRemainingPlayers: (remainingPlayers: number) => void;
  startGame: () => void;
}

type PlayerID = 0 | 1 | 2 | 3;

enum MoveEvent {
  Up,
  Down,
  Left,
  Right
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
  requestScoreboardData: () => void;
  requestVotingSequence: () => void;
  vote: (playerVote: "option1" | "option2" | "option3" | "noAction") => void;
  requestVotingCountdown: () => void;
  requestRemainingPlayers: () => void;
  joinGame: () => void;
}

export { ServerToClientEvents, ClientToServerEvents, MoveEvent, PlayerPosition };
