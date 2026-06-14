import axios from "axios"

const api=axios.create({
    baseURL:import.meta.env.VITE_API_URL,
    withCredentials:true,
})

export const sendMessage=async ({message,chatId})=>{
    const response=await api.post('/chats/message',{message,chat:chatId});
    return response.data
}

export const getChats=async()=>{
    const response=await api.get('/chats');
    return response.data
}

export const getMessages=async(chatId)=>{
    const response=await api.get(`/chats/${chatId}/messages`);
    return response.data
}

export const deleteChat=async(chatId)=>{
    const response=await api.delete(`/chats/delete/${chatId}`)
    return response.data
}

export const renameChat = async (chatId, title) => {
    const { data } = await api.patch(`/chats/${chatId}/rename`, { title })
    return data
}

export const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await api.post("/chats/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return data
}