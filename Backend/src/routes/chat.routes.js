import {Router} from 'express'
import { deleteChat, getChat, getMessages, sendMessage,renameChat } from '../controllers/chat.controller.js';
import { authUser } from '../middleware/auth.middleware.js';


const chatRouter=Router();

chatRouter.post('/message',authUser,sendMessage)

chatRouter.get('/',authUser,getChat)

chatRouter.get('/:chatId/messages',authUser,getMessages)

chatRouter.delete('/delete/:chatId',authUser,deleteChat)

export default chatRouter;