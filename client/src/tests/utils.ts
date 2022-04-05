import { SocketServerMock, SocketClientMock } from "socket.io-mock-ts";

/**
 * @returns [serverSocket, clientSocket]
 */
export function useMockSockets(): [SocketServerMock, SocketClientMock] {
    const serverSocket = new SocketServerMock();
    const clientSocket = serverSocket.clientMock;
    return [serverSocket, clientSocket];
}
