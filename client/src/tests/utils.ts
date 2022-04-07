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
        setOrigin: vi.fn().mockImplementation(() => mockedObject),
        setScale: vi.fn().mockImplementation(() => mockedObject),
        setVisible: vi.fn().mockImplementation(() => mockedObject),
        setInteractive: vi.fn().mockImplementation(() => mockedObject),
        setTint: vi.fn().mockImplementation(() => mockedObject),
        setText: vi.fn().mockImplementation(() => mockedObject),
        on: vi.fn().mockImplementation(() => mockedObject),
    };
    const mockedAdd = {
        bitmapText: vi.fn().mockReturnValue(mockedObject),
        image: vi.fn().mockReturnValue(mockedObject),
    };
    return {
        add: mockedAdd,
    };
}
