import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},     //chat is object so that title is stored as key and then msg as value with both user and ai role defined 
        currentChatId: null,
        isLoading: false,
        error: null,
    },
    reducers: {
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload
            state.chats[chatId] = {
                id: chatId,
                title,
                messages: [],
                lastUpdated: new Date().toISOString()
            }
        },
        updateChatTitle: (state, action) => {
            const { chatId, title } = action.payload
            if (state.chats[chatId]) {
                state.chats[chatId].title = title
            }
        },
        addNewMessage: (state, action) => {
            const { chatId, content, role } = action.payload
            state.chats[chatId].messages.push({ content, role })
        },
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload
            state.chats[chatId].messages.push(...messages)
        },
        removeChat: (state, action) => {
            delete state.chats[action.payload]
        },
        aiStopped: (state, action) => {
            const { chatId } = action.payload
            const messages = state.chats[chatId]?.messages
            if (!messages?.length) return
            const lastMsg = messages[messages.length - 1]
            if (lastMsg?.role === 'ai') {
                lastMsg.streaming = false
                lastMsg.isPartial = true  // lets you show a stopped indicator
            }
        },

        // Called for each incoming chunk — appends to the last AI message
        appendChunk: (state, action) => {
            const { chatId, chunk } = action.payload

            // if chat doesn't exist yet, create it
            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: '',
                    messages: [],
                    lastUpdated: new Date().toISOString()
                }
            }

            const messages = state.chats[chatId].messages
            const lastMsg = messages[messages.length - 1]

            if (lastMsg?.role === 'ai' && lastMsg?.streaming) {
                lastMsg.content += chunk
            } else {
                messages.push({ content: chunk, role: 'ai', streaming: true })
            }
        },

        setStreaming: (state, action) => {
            const { chatId, value } = action.payload
            const messages = state.chats[chatId]?.messages
            if (!messages?.length) return
            const lastMsg = messages[messages.length - 1]
            if (lastMsg) lastMsg.streaming = value
        },
        moveTempChat: (state, action) => {
            const { tempId, chatId } = action.payload
            const tempChat = state.chats[tempId]
            if (!tempChat) return

            // copy messages from temp to real chat
            if (state.chats[chatId]) {
                state.chats[chatId].messages = tempChat.messages
            }

            // remove temp chat
            delete state.chats[tempId]
        },
        setChats: (state, action) => {
            state.chats = action.payload
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        }
    }
})

export const { setChats, setCurrentChatId,aiStopped, updateChatTitle, setLoading, moveTempChat, setError, createNewChat, addNewMessage, addMessages, appendChunk, setStreaming, removeChat } = chatSlice.actions
export default chatSlice.reducer