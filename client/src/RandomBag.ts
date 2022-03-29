import { TetrominoType } from "common/TetrominoType";
import {
    ToClientEvents,
    ToServerEvents,
} from "../../common/messages/randomBag";

import { Socket } from "socket.io-client";

type BagSocket = Socket<ToClientEvents, ToServerEvents>;

export class RandomBag {
    private bagStack: Array<TetrominoType>;
    private votedTetro?: TetrominoType;

    constructor(socket: BagSocket) {
        this.bagStack = [];
        this.createBag();

        socket.removeListener("votedTetroToSpawn");
        socket.on("votedTetroToSpawn", (type) => {
            this.votedTetro = type;
            setTimeout(() => {
                this.votedTetro = undefined;
            }, 20000);
        });
    }

    // Using the Fisher Yates algorithm
    private shuffle() {
        for (let i = this.bagStack.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bagStack[i], this.bagStack[j]] = [
                this.bagStack[j],
                this.bagStack[i],
            ];
        }
    }

    private createBag() {
        this.bagStack = <TetrominoType[]>(
            // Filter to handle TypeScript's enum double mapping
            Object.values(TetrominoType).filter((x) => typeof x === "number")
        );
        this.shuffle();
    }

    public getNextType(): TetrominoType {
        if (this.votedTetro) {
            return this.votedTetro;
        }

        if (this.bagStack.length == 0) {
            this.createBag();
        }
        return this.bagStack.pop() as TetrominoType;
    }
}
