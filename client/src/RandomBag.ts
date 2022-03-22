import { TetrominoType } from "common/TetrominoType";

export class RandomBag {
    bagStack!: Array<TetrominoType>;

    constructor() {
        this.createBag();
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
        if (this.bagStack.length == 0) {
            this.createBag();
        }
        return this.bagStack.pop() as TetrominoType;
    }
}
