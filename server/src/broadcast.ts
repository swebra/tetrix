import { BoardState, ColoredScore } from "common/shared";
import { TetrominoType } from "common/TetrominoType";

export interface broadcast {
    updateScoreboard(msg: Array<ColoredScore>): void;
    toSceneWaitingRoom(): void;
    toSceneGameArena(): void;
    toSceneGameOver(msg: Array<ColoredScore>): void;
    showVotingSequence(votingSequence: string, randTetros: Array<number>): void;
    hideVotingSequence(): void;
    remainingPlayers(playersNeeded: number): void;
    fallRate(fallRate: number): void;
    votedTetroToSpawn(type: TetrominoType): void;
    updateBoard(msg: BoardState): void;
    decision: (votedDecision: string) => void;
}
