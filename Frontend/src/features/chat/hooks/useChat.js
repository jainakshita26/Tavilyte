
import { initializeSocketConnection, getSocket } from "../service/chat.socket"
import { useDispatch, useSelector } from "react-redux"
import { useRef ,useCallback} from "react"
import {
    addNewMessage, createNewChat, setChats, setCurrentChatId,
    setLoading, addMessages, removeChat, appendChunk, setStreaming,
    updateChatTitle, moveTempChat,aiStopped
} from "../chat.slice"
import { getChats, getMessages, deleteChat } from "../service/chat.api"

export const useChat = () => {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const pendingMessageRef = useRef(null)
    const pendingChatIdRef = useRef(null) // track temp chatId
    

    function initializeSocket() {
        const socket = initializeSocketConnection()

        socket.off("chatCreated")
        socket.off("chatTitleUpdate")
        socket.off("aiChunk")
        socket.off("aiDone")
        socket.off("aiError")
        socket.off("aiStopped")

        socket.on("chatCreated", ({ chatId, title }) => {
            const tempId = pendingChatIdRef.current

            // 1. create real chat with messages from temp
            dispatch(createNewChat({ chatId, title: title || 'New Chat' }))

            // 2. move messages from temp to real chat
            if (tempId) {
                dispatch(moveTempChat({ tempId, chatId }))
            }

            // 3. switch view to real chatId AFTER messages are moved
            dispatch(setCurrentChatId(chatId))

            pendingChatIdRef.current = null
        })

        socket.on("chatTitleUpdate", ({ chatId, title }) => {
            dispatch(updateChatTitle({ chatId, title }))
        })

        socket.on("aiChunk", ({ chunk, chatId }) => {
            dispatch(appendChunk({ chatId, chunk }))
        })

        socket.on("aiDone", ({ chatId }) => {
            dispatch(setStreaming({ chatId, value: false }))
            dispatch(setLoading(false))
        })

        socket.on("aiError", () => {
            dispatch(setLoading(false))
        })

        socket.on("aiStopped", ({ chatId }) => {
            dispatch(aiStopped({ chatId }))
            dispatch(setLoading(false))
        })
    }

     const handleStopGeneration = useCallback((chatId) => {
        const socket = getSocket()
        if (socket?.connected && chatId) {
            socket.emit("stopGeneration", { chatId })
        }
    }, [])

    async function handleSendMessage({ message, chatId }) {
        const socket = getSocket()
        if (!socket || !user?._id) return

        dispatch(setLoading(true))

        if (chatId) {
            // existing chat — straightforward
            dispatch(addNewMessage({ chatId, content: message, role: "user" }))
        } else {
            // new chat — create a temporary slot immediately
            // so user message shows right away without waiting for server
            const tempId = `temp_${Date.now()}`
            pendingChatIdRef.current = tempId
            pendingMessageRef.current = message

            dispatch(createNewChat({ chatId: tempId, title: 'New Chat' }))
            dispatch(setCurrentChatId(tempId))
            dispatch(addNewMessage({ chatId: tempId, content: message, role: "user" }))
        }

        socket.emit("sendMessage", {
            message,
            chatId: chatId || null,
            userId: user._id
        })
    }

    async function handleGetChats() {
        dispatch(setLoading(true))
        const data = await getChats()
        const { chats } = data
        dispatch(setChats(chats.reduce((acc, chat) => {
            acc[chat._id] = {
                id: chat._id,
                title: chat.title,
                messages: [],
                lastUpdated: chat.updatedAt,
            }
            return acc
        }, {})))
        dispatch(setLoading(false))
    }

    async function handleOpenChat(chatId, chats) {
        if (chats[chatId]?.messages.length === 0) {
            const data = await getMessages(chatId)
            const { messages } = data
            dispatch(addMessages({
                chatId,
                messages: messages.map(msg => ({ content: msg.content, role: msg.role }))
            }))
        }
        dispatch(setCurrentChatId(chatId))
    }

    function handleNewChat() {
        dispatch(setCurrentChatId(null))
    }

    async function handleDeleteChat(chatId, currentChatId, chats) {
        await deleteChat(chatId)
        dispatch(removeChat(chatId))
        if (chatId === currentChatId) {
            const remaining = Object.keys(chats).filter(id => id !== chatId)
            dispatch(setCurrentChatId(remaining.length > 0 ? remaining[0] : null))
        }
    }

    return {
        initializeSocket,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleNewChat,
        handleDeleteChat,
        handleStopGeneration
    }
}