import { TetrominoType } from "../TetrominoType";

export interface ToClientEvents {
    showVotingSequence: (
        votingSequence: string,
        randTetros: Array<TetrominoType>
    ) => void;
    hideVotingSequence: () => void;
    sendVotingCountdown: (secondsLeft: number) => void;
    votedTetroToSpawn: (type: TetrominoType) => void;
    randomTrade: (playerIds: [number, number], pairNum: 1 | 2) => void;
}

export interface ToServerEvents {
    requestVotingSequence: () => void;
    vote: (playerVote: "option1" | "option2" | "option3" | "noAction") => void;
    requestVotingCountdown: () => void;
}
