// Import the express in typescript file
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Level } from "./src/Level";
import { Scoreboard } from "./src/Scoreboard";
import { PlayerQueue } from "./src/PlayerQueue";
import { Spectator } from "./src/Spectator";
import path from "path";

import { ServerToClientEvents, ClientToServerEvents } from "common/message";
import { ColoredScore } from "common/shared";

interface InterServerEvents {
    ping: () => void;
}

interface SocketData {
    name: string;
    age: number;
}
// =================== grab from tutorial ==============

// Initialize the express engine
const app: express.Application = express();

app.use(function (_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// host static frontend
app.use("/", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

// Take a port 3000 for running server.
const port = process.env.PORT || 80;

// Server setup
server.listen(port);

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: "*",
    },
});

console.log(`Server started at port ${port}`);
let playerCounter: 0 | 1 | 2 | 3 = 0; // FIXME: Remove this on final version.
const scoreboard = new Scoreboard();
const level = new Level();
const queue = new PlayerQueue();
const spectator = new Spectator();

// Emit to all sockets.
export function broadcastUpdateScoreboard(msg: Array<ColoredScore>) {
    io.sockets.emit("updateScoreboard", msg);
}

// Emit to all sockets.
export function broadcastToSceneGameOver(msg: Array<ColoredScore>) {
    queue.resetCounter();
    io.sockets.emit("toSceneGameOver", msg);
}

// Emit to all sockets.
export function broadcastToSceneWaitingRoom() {
    queue.resetCounter();
    io.sockets.emit("toSceneWaitingRoom");
}

// Emit to all sockets.
export function broadcastShowVotingSequence(votingSequence: string) {
    io.sockets.emit("showVotingSequence", votingSequence);
}

// Emit to all sockets.
export function broadcastHideVotingSequence() {
    io.sockets.emit("hideVotingSequence");
}

// Uncomment to send the client a voting request. (lasts 10 seconds)
spectator.generateFirstVotingSequence(level);

// Uncomment to view the game end sequence:
// setTimeout(() => {
//   console.log("Sending clients to Game Over Screen!")
//   scoreboard.displaySceneGameOver();
// }, 30000);

io.on("connection", (socket) => {
    // =====================================================
    // FIXME: Delete the following lines from the final game.
    // These are left in for testing convenience.
    socket.emit("initPlayer", playerCounter);
    playerCounter += 1;
    playerCounter %= 4;
    // ======================================================

    socket.on("playerMove", (...args) => {
        socket.broadcast.emit("playerMove", ...args);
    });
    scoreboard.initSocketListeners(socket, level);
    spectator.initSocketListeners(socket);

    socket.on("requestRemainingPlayers", () => {
        socket.emit("updateRemainingPlayers", queue.getRemainingPlayers());
    });

    socket.on("joinGame", () => {
        const playerIndex: number = queue.addToQueue();

        // If there was room in the queue, notify the client of their player index value.
        if (playerIndex < 4) {
            socket.emit("initPlayer", playerIndex as 0 | 1 | 2 | 3);
            io.sockets.emit(
                "updateRemainingPlayers",
                queue.getRemainingPlayers()
            );

            // 4 players have joined. Start the game.
            if (playerIndex == 3) {
                io.sockets.emit("toSceneGameArena");
            }
        }
    });

    // FIXME need a state machine to tell which scene the game is at, conditionally tackle disconnections?
});
