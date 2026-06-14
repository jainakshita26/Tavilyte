import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { register,verifyEmail,login,getMe,resendVerificationEmail,logout } from "../controllers/auth.controller.js";
import { authUser } from "../middleware/auth.middleware.js";

const authRouter=Router()

authRouter.post('/register',registerValidator,register)

authRouter.post('/login',loginValidator,login)

authRouter.get('/get-me',authUser,getMe)

authRouter.get('/verify-email',verifyEmail)

authRouter.post('/resend-verification',resendVerificationEmail);

authRouter.post("/logout", logout)

export default authRouter