import { generateResponse, generateChatTitle, generateStreamingResponse } from "../services/ai.service.js"
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";


export async function sendMessage(req, res) {
    const { message, chat: chatId } = req.body

    let title = null, chat = null;
    if (!chatId) {
        title = await generateChatTitle(message);

        chat = await chatModel.create({
            user: req.user.id,
            title
        })
    }
    const userMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: message,
        role: "user"
    })


    const messages = await messageModel.find({ chat: chatId || chat._id })

    const result = await generateResponse(messages);


    const aiMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: result,
        role: 'ai'
    })

    // console.log(messages)

    res.status(201).json({
        title,
        chat,
        aiMessage
    })
}

export async function renameChat(req, res) {
    const { chatId } = req.params
    const { title } = req.body

    if (!title?.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" })
    }

    const chat = await chatModel.findOneAndUpdate(
        { _id: chatId, user: req.user.id },
        { title: title.trim() },
        { new: true }
    )

    if (!chat) {
        return res.status(404).json({ message: "Chat not found" })
    }

    res.status(200).json({
        message: "Chat renamed successfully",
        chat
    })
}
export async function getChat(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user.id })

    res.status(200).json({
        message: "Chats received successfully",
        chats
    })
}



export async function getMessages(req, res) {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    })

    res.status(200).json({
        message: "Messages received successfully",
        messages
    })
}

export async function deleteChat(req, res) {
    const { chatId } = req.params

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })
    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })
    res.status(200).json({
        message: "Chat deleted successfully"
    })
}


export async function handleSocketMessage({ message, chatId, userId, fileContext, signal, onChunk, onChatCreated, onUsageWarning }) {
    let chat = null
    if (!chatId) {
        const title = await generateChatTitle(message)
        chat = await chatModel.create({ user: userId, title })

        onChatCreated(chat._id.toString(), chat.title)
        await new Promise(resolve => setTimeout(resolve, 100))
    } else {
        chat = await chatModel.findById(chatId)
        onChatCreated(chat._id.toString(), chat.title)
    }

    if (signal?.aborted) return { chat, aborted: true }

    const enrichedMessage = fileContext
        ? `[Attached file content]\n${fileContext}\n\n[User question]\n${message}`
        : message

    await messageModel.create({
        chat: chat._id,
        content: message,   // ← clean message saved to DB
        role: "user"
    })

    const messages = await messageModel.find({ chat: chat._id })

    if (fileContext && messages.length) {
        messages[messages.length - 1] = {
            ...messages[messages.length - 1].toObject(),
            content: enrichedMessage   // ← AI sees enriched version only
        }
    }

    const { fullText, aborted } = await generateStreamingResponse(
        messages,
        (chunk) => {
            if (!signal?.aborted) onChunk(chunk)
        },
        signal,
        onUsageWarning
    )

    if (fullText.trim()) {
        const chatStillExists = await chatModel.exists({ _id: chat._id })
        if (chatStillExists) {
            await messageModel.create({
                chat: chat._id,
                content: fullText,
                role: "ai"
            })
        }
    }

    return { chat, aborted }
}