import axios from "axios";

const api=axios.create({
    baseURL:import.meta.env.VITE_API_URL,
    withCredentials:true             //so that server can access cookie 
})
console.log('API baseURL:', import.meta.env.VITE_API_URL)


export async function register({email,username,password}){
    console.log('Enail',email)
    console.log('pas',password)
    const response=await api.post('/auth/register',{email,username,password})
    console.log('Response ',response)
    return response.data
}

export async function login({email,password}){
    const response=await api.post('/auth/login',{email,password})
    return response.data
}

export async function getMe() {
    const response=await api.get('/auth/get-me');
    return response.data
}

export async function logout() {
    const response = await api.post('/auth/logout')
    return response.data
}

export async function resendVerificationEmail({ email }) {
    const response = await api.post('/auth/resend-verification', { email })
    return response.data
}