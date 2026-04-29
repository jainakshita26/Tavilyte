// import {Server} from 'socket.io'
// let io;        //represent the socketio of server side

// export function initSocket(httpServer){
//     io=new Server(httpServer,{
//         cors:{
//             origin:'http://localhost:5173',      //with this io is setup
//             credentials:true,
//         }
//     })

//     console.log("Socket.io server is RUNNING")


    
//     io.on("connection",(socket)=>{
//         console.log("A user connected"+socket.id)    //too many users connect to the server using socketio and each get a unique socketid & it change as user reconnect
        
//     })
// }

// export function getIO(){
//     if(!io){
//         throw new Error("Socket.io is not initialized")
//     }
//     return io;
// }

// //socletio server starts mainly in server.js


import { Server } from 'socket.io'
import { handleSocketMessage } from '../controllers/chat.controller.js'

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        }
    })

    io.on("connection", (socket) => {
        console.log("User connected: " + socket.id)

        socket.on("sendMessage", async ({ message, chatId, userId }) => {
    try {
        let resolvedChatId = chatId

        const { chat } = await handleSocketMessage({
            message,
            chatId,
            userId,
            onChatCreated: (newChatId, title) => {
                resolvedChatId = newChatId
                if (!chatId) {
                    // ✅ emit with title immediately
                    socket.emit("chatCreated", {
                        chatId: newChatId,
                        title
                    })
                }
            },
            onChunk: (chunk) => {
                socket.emit("aiChunk", { chunk, chatId: resolvedChatId })
            }
        })

        socket.emit("aiDone", { chatId: chat._id.toString() })

    } catch (err) {
        console.error("Socket error:", err.message)
        socket.emit("aiError", { message: "Something went wrong" })
    }
})

        socket.on("disconnect", () => {
            console.log("User disconnected: " + socket.id)
        })
    })
}

export function getIO() {
    if (!io) throw new Error("Socket.io not initialized")
    return io
}