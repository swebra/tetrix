import { Socket } from "socket.io";

import { ServerToClientEvents, ClientToServerEvents } from "common/message";
import { BoardState } from "common/shared";
import { broadcast } from "./broadcast";

export class BoardSync {
    private socketsWithTruth: Array<Socket> = [];
    private timer;
    private broadcastUpdateBoard: broadcast["updateBoard"];

    constructor(broadcastUpdateBoard: broadcast["updateBoard"]) {
        this.broadcastUpdateBoard = broadcastUpdateBoard;
        this.timer = setInterval(async () => {
            console.log("broadcasting board update");
            const socket = this.pickRandomSourceOfTruth();
            if (!socket) return;
            const boardState = await this.getBoardFromClient(socket);
            this.broadcastUpdateBoard(boardState);
        }, 10000);
    }

    public initSocketListeners(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>
    ) {
        socket.on("requestBoard", async () => {
            // find a source of truth from existing clients or itself if not exist
            const socketToAsk = this.pickRandomSourceOfTruth() || socket;
            const boardState = await this.getBoardFromClient(socketToAsk);
            // add to existing truth-known clients
            if (!this.socketsWithTruth.includes(socket)) {
                this.socketsWithTruth.push(socket);
            }
            socket.emit("updateBoard", boardState);
        });

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
            socket.emit("reportBoard", (clientBoard: BoardState) => {
                res(clientBoard);
            });
        });
    }
}
