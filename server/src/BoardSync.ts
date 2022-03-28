import { Socket } from "socket.io";

import { ServerToClientEvents, ClientToServerEvents } from "common/message";
import { BoardState } from "common/shared";

export class BoardSync {
    private socketsWithTruth: Array<Socket> = [];

    public initSocketListeners(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>
    ) {
        socket.on(
            "syncBoard",
            async (callback: (board: BoardState) => void) => {
                // find a source of truth from existing clients or itself if not exist
                const socketToAsk = this.pickRandomSourceOfTruth() || socket;
                const boardState = await this.getBoardFromClient(socketToAsk);
                // add to existing truth-known clients
                if (!this.socketsWithTruth.includes(socket)) {
                    this.socketsWithTruth.push(socket);
                }
                callback(boardState);
            }
        );

        socket.on("disconnect", () => {
            this.socketsWithTruth = this.socketsWithTruth.filter(
                (s) => s.id !== socket.id
            );
        });
    }

    private pickRandomSourceOfTruth(): Socket | null {
        if (Object.values(this.socketsWithTruth).length === 0) {
            return null;
        }
        // randomly pick a client socket that we know has at least one update
        return Object.values(this.socketsWithTruth)[
            Math.floor(
                Math.random() * Object.keys(this.socketsWithTruth).length
            )
        ];
    }

    private async getBoardFromClient(socket: Socket): Promise<BoardState> {
        return new Promise((res, _) => {
            socket.emit("cacheBoard", (clientBoard: BoardState) => {
                res(clientBoard);
            });
        });
    }
}
