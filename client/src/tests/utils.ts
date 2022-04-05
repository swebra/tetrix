import { GameState } from "../GameState";
import SocketMock from "socket.io-mock";
import { Socket as ClientSocket } from "socket.io-client";
import { RandomBag } from "../RandomBag";

/**
 * @returns [serverSocket, clientSocket]
 */
export function useMockSockets() {
    const serverSocket = new SocketMock();
    const clientSocket = serverSocket.socketClient;
    return [serverSocket, clientSocket];
}
