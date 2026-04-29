import { io } from "socket.io-client"

let socket; // keep it outside so we can reuse it

export const initializeSocketConnection = () => {
    if (socket?.connected) return socket // don't reconnect if already connected

    socket = io("http://localhost:3000", {
        withCredentials: true,
    })

    socket.on("connect", () => {
        console.log("Connected to Socket.IO:", socket.id)
    })

    socket.on("disconnect", () => {
        console.log("Disconnected from Socket.IO")
    })

    return socket
}

export const getSocket = () => socket // so other files can use it