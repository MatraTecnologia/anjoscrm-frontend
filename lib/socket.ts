import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true,
        })
    }
    return socket
}
