import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js'
import chatRouter from './routes/chat.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import morgan from 'morgan'
import cors from 'cors'

const app=express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
    methods:["GET",'POST','PUT','DELETE','PATCH','OPTIONS']
}))

app.get('/',(req,res)=>{
    res.json({message:"server is running"})
})
app.use('/api/auth',authRouter)

app.use('/api/chats',chatRouter)


export default app