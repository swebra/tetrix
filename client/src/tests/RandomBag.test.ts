import { Tetromino } from "../Tetromino";
import { RandomBag } from "../RandomBag";
import { useMockSockets } from "./utils";

describe("RandomBag", () => {
    let randomBag: RandomBag;
    let clientSocket, serverSocket: any;

    beforeEach(() => {
        [serverSocket, clientSocket] = useMockSockets();
        randomBag = new RandomBag(clientSocket);
    });

    test("[FR6 Tetromino spawn generation] random bag is generating in a cycle of 7", () => {
        const appearances = Array(7).fill(0);
        for (let _ = 0; _ < 5; _++) {
            // generate 7 pieces, make sure they all appeared once
            for (let i = 0; i < 7; i++) {
                appearances[randomBag.getNextType()] += 1;
            }
            expect(appearances).toEqual(Array(7).fill(1));
            appearances.fill(0);
        }
    });

    test("[FR25 Change block sequence] can swap tetrominoes for the next 20 seconds with a specified type", () => {
        vi.useFakeTimers();
        serverSocket.emit("votedTetroToSpawn", 6); // spawn T for the next 20 seconds

        for (let i = 0; i < 7; i++) {
            expect(randomBag.getNextType()).toEqual(6);
        }

        vi.advanceTimersByTime(10000); // jump to 10 seconds in the future

        for (let i = 0; i < 7; i++) {
            expect(randomBag.getNextType()).toEqual(6);
        }

        vi.advanceTimersByTime(11000); // jump to 11 seconds in the future

        const appearances = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
            appearances[randomBag.getNextType()] += 1;
        }
        expect(appearances[6]).toBeLessThan(7); // there are some other types
    });
});
