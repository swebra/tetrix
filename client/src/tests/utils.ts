import { SocketServerMock, SocketClientMock } from "socket.io-mock-ts";

/**
 * @returns [serverSocket, clientSocket]
 */
export function useMockSockets(): [SocketServerMock, SocketClientMock] {
    const serverSocket = new SocketServerMock();
    const clientSocket = serverSocket.clientMock;
    return [serverSocket, clientSocket];
}

export function useMockScene(vi: any) {
    const mockedObject = {
        setOrigin: vi.fn(),
        setScale: vi.fn(),
        setVisible: vi.fn(),
    };
    const mockedAdd = {
        bitmapText: vi.fn().mockReturnValue(mockedObject),
        image: vi.fn().mockReturnValue(mockedObject),
    };
    return {
        add: mockedAdd,
    };
}
