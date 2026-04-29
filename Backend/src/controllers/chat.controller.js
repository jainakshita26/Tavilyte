import { generateResponse ,generateChatTitle,generateStreamingResponse} from "../services/ai.service.js"
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";


export async function sendMessage(req,res){
    const {message,chat:chatId}=req.body

    let title=null,chat=null;
    if(!chatId){
        title =await generateChatTitle(message);

        chat=await chatModel.create({
        user:req.user.id,
        title
    })
    }
    const userMessage=await messageModel.create({
        chat:chatId || chat._id,
        content:message,
        role:"user"
    })


    const messages=await messageModel.find({chat:chatId || chat._id})

    const result=await generateResponse(messages);
     

    const aiMessage=await messageModel.create({
        chat:chatId || chat._id,
        content:result,
        role:'ai'
    })

    // console.log(messages)

    res.status(201).json({
        title,
        chat,
        aiMessage
    })
}

export  async function getChat(req,res) {
    const user=req.user;

    const chats=await chatModel.find({user:user.id})

    res.status(200).json({
        message:"Chats received successfully",
        chats
    })
}

export async function getMessages(req,res){
    const {chatId}=req.params;

    const chat=await chatModel.findOne({
        _id:chatId,
        user:req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message:"Chat not found"
        })
    }

    const messages=await messageModel.find({
        chat:chatId
    })

    res.status(200).json({
        message:"Messages received successfully",
        messages
    })
}

export async function deleteChat(req,res) {
    const {chatId}=req.params

    const chat=await chatModel.findOneAndDelete({
        _id:chatId,
        user:req.user.id
    })
    if(!chat){
        return res.status(404).json({
            message:"Chat not found"
        })
    }
     
    await messageModel.deleteMany({
        chat:chatId
    })
    res.status(200).json({
        message:"Chat deleted successfully"
    })
}

// export async function handleSocketMessage({ message, chatId, userId, onChunk }) {
//     // 1. Create chat if new conversation
//     console.log("1. called with:", { message, chatId, userId })
//     let chat = null
//     if (!chatId) {
//         const title = await generateChatTitle(message)
//         chat = await chatModel.create({ user: userId, title })
//     } else {
//         chat = await chatModel.findById(chatId)
//     }
//     console.log("chat resolved",chat?._id)
//     const resolvedChatId = chat._id

//     // 2. Save user message
//     await messageModel.create({
//         chat: resolvedChatId,
//         content: message,
//         role: "user"
//     })

//     // 3. Get full message history for context
//     const messages = await messageModel.find({ chat: resolvedChatId })

//     // 4. Stream AI response — onChunk fires for every word
//     let fullResponse = ""
//     await generateStreamingResponse(messages, (chunk) => {
//         fullResponse += chunk
//         onChunk(chunk) // this emits socket event to frontend
//     })

//     // 5. Save complete AI response to DB
//     const aiMessage = await messageModel.create({
//         chat: resolvedChatId,
//         content: fullResponse,
//         role: "ai"
//     })

//     return { chat, aiMessage }
// }

export async function handleSocketMessage({ message, chatId, userId, onChunk, onChatCreated }) {
    let chat = null
    if (!chatId) {
        const title = await generateChatTitle(message)
        chat = await chatModel.create({ user: userId, title })
        
        // notify FIRST
        onChatCreated(chat._id.toString(), chat.title)
        
        // ✅ small delay so frontend processes chatCreated before first chunk
        await new Promise(resolve => setTimeout(resolve, 100))
    } else {
        chat = await chatModel.findById(chatId)
        onChatCreated(chat._id.toString(), chat.title)
    }

    await messageModel.create({
        chat: chat._id,
        content: message,
        role: "user"
    })

    const messages = await messageModel.find({ chat: chat._id })

    let fullResponse = ""
    await generateStreamingResponse(messages, (chunk) => {
        fullResponse += chunk
        onChunk(chunk)
    })

    if (fullResponse.trim()) {
        await messageModel.create({
            chat: chat._id,
            content: fullResponse,
            role: "ai"
        })
    }

    return { chat }
}