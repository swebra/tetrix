import { TetrominoType } from "common/TetrominoType";

function fisherShuffle(arr: Array<any>) {
    let currIdx = arr.length - 1;

    while (currIdx > 0) {
        const randIdx = Math.floor(Math.random() * currIdx);
        [arr[currIdx], arr[randIdx]] = [arr[randIdx], arr[currIdx]];
        currIdx--;
    }
    return arr;
}
export class RandomBag{
    bagStack: Array<TetrominoType>;

    constructor() {
        this.bagStack = [];

    }
    private createBag() {
        const bagList = [TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O, TetrominoType.S, TetrominoType.T, TetrominoType.Z];
        fisherShuffle(bagList);
        this.bagStack = bagList;
    }
    public returnNextPiece() {
        if (this.bagStack.length == 0) {
            this.createBag();
        }
        const nextPiece: TetrominoType = this.bagStack[this.bagStack.length - 1];
        this.bagStack.pop();
        return nextPiece;
    }

}