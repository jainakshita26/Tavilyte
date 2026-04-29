import 'dotenv/config'
import app from './src/app.js'
import http from 'http'
import connectToDB from './src/config/database.js'
import { initSocket } from './src/sockets/server.socket.js'
// import { testAi } from './src/services/ai.service.js'


const PORT=process.env.PORT || 3000

const httpServer=http.createServer(app)

initSocket(httpServer)

// testAi()
connectToDB()
// .catch((err)=>{
//     console.error("MongoDB connection failed:",err);
//     process.exit(1);
// });

httpServer.listen(PORT,()=>{
    console.log("Server is running at 3000")
})