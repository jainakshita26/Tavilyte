import { Server } from 'socket.io'
import { handleSocketMessage } from '../controllers/chat.controller.js'

let io;
const activeStreams = new Map()

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            // origin: 'http://localhost:5173',
            origin:process.env.CLIENT_URL,
            credentials: true,
        }
    })

    io.on("connection", (socket) => {
        console.log("User connected: " + socket.id)

        socket.on("sendMessage", async ({ message, chatId, userId,fileContext }) => {
            try {
                let resolvedChatId = chatId

                // ✅ These belong here — chatId only exists inside this handler
                const controller = new AbortController()
                const tempKey = chatId || socket.id
                activeStreams.set(tempKey, controller)

                const { chat, aborted } = await handleSocketMessage({
                    message,
                    chatId,
                    userId,
                    fileContext,
                    signal: controller.signal,
                    onChatCreated: (newChatId, title) => {
                        resolvedChatId = newChatId

                        activeStreams.delete(tempKey)
                        activeStreams.set(newChatId, controller)

                        if (!chatId) {
                            socket.emit("chatCreated", { chatId: newChatId, title })
                        }
                    },
                    onChunk: (chunk) => {
                        socket.emit("aiChunk", { chunk, chatId: resolvedChatId })
                    },
                    onUsageWarning: (warning) => {       
                        socket.emit("usageWarning", warning)
                    }
                })

                activeStreams.delete(resolvedChatId || tempKey)


                if (aborted) {
                    socket.emit("aiStopped", { chatId: chat._id.toString() })
                } else {
                    socket.emit("aiDone", { chatId: chat._id.toString() })
                }

            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log(`Stream aborted for socket ${socket.id}`)
                    return
                }
                console.error("Socket error:", err.message)
                socket.emit("aiError", { message: "Something went wrong" })
            }
        })

        socket.on("stopGeneration", ({ chatId }) => {
            console.log(`Stop requested for chatId: ${chatId}`)
            const controller = activeStreams.get(chatId)
            if (controller) {
                controller.abort()
                activeStreams.delete(chatId)
                // aiStopped is emitted from sendMessage handler via aborted flag
                // so we don't emit it here — avoids double emit
            }
        })

        socket.on("disconnect", () => {
            console.log("User disconnected: " + socket.id)
            const tempController = activeStreams.get(socket.id)
            if (tempController) {
                tempController.abort()
                activeStreams.delete(socket.id)
            }
        })
    })
}

export function getIO() {
    if (!io) throw new Error("Socket.io not initialized")
    return io
}