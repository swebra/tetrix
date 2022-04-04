import { Socket } from "socket.io";

import { ServerToClientEvents, ClientToServerEvents } from "common/message";
import { BoardState } from "common/shared";
import { broadcast } from "./broadcast";

export class BoardSync {
    static PLACING_COOLDOWN_PERIOD: number = 500; // ms
    private socketsWithTruth: Array<Socket> = [];
    private broadcastUpdateBoard: broadcast["updateBoard"];
    private lastPlacingTS: number = new Date().getTime();

    constructor(broadcastUpdateBoard: broadcast["updateBoard"]) {
        this.broadcastUpdateBoard = broadcastUpdateBoard;
        setInterval(async () => {
            const socket = this.pickRandomSourceOfTruth();
            if (!socket) return;

            const boardState = await this.getBoardFromClient(socket);
            const now = new Date().getTime();
            if (now - this.lastPlacingTS < BoardSync.PLACING_COOLDOWN_PERIOD) {
                console.log(
                    "BoardSync: skipping update at",
                    now,
                    ", last placing event: ",
                    this.lastPlacingTS,
                    "diff:",
                    now - this.lastPlacingTS
                );
                // skip when sync is less than 200ms after the previous placing event
                return;
            }
            this.broadcastUpdateBoard(boardState);
        }, 10000);
    }

    public updateLastPlacingTS() {
        this.lastPlacingTS = new Date().getTime();
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
