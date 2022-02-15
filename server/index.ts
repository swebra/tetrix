// Import the express in typescript file
import express from "express";
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";
import path from "path";

import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "common/message";

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

app.use(function(_, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', express.static(path.join(__dirname, 'public')))

const server = http.createServer(app)

// Take a port 3000 for running server.
const port = process.env.PORT || 80

// Server setup
server.listen(port)


const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
    cors: {
        origin: "*"
    }});

console.log("hello");
let playerCounter: 0 | 1 | 2 | 3 = 0
io.on("connection", (socket) => {
  socket.emit("initPlayer", playerCounter)
  playerCounter += 1
  playerCounter %= 4
  // works when broadcast to all
  // io.emit("noArg");
  // works when broadcasting to a room
  // io.to("room1").emit("basicEmit", 1, "2", Buffer.from([3]));

  socket.on("playerMove", (...args) => {
     console.log(`received event: `, args)
     socket.broadcast.emit("playerMove", ...args)
  })
  // socket.on("playerAction", ({event, playerId}) => {
  //   console.log(`received event: `, event, ", from id: ", playerId)
  //   socket.broadcast.emit("playerAction", {event, playerId})
  // })
});
