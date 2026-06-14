
import userModel from "../models/user.model.js";

import jwt from 'jsonwebtoken';
import { sendEmail } from "../services/mail.service.js";

export async function register(req,res){
    const {username,email,password}=req.body
    console.log("Register attempt:", { username, email }) 

    const isUserAlreadyExists=await userModel.findOne({
        $or:[{email},{username}]
    })

    if(isUserAlreadyExists){
        console.log("User already exists:", isUserAlreadyExists.email)
        return res.status(400).json({
            message:"user with this email already exists",
            success:false,
            err:"User already exists"
        })
    }

    try{
        const user=await userModel.create({
        username,
        email,
        password
    });


    const emailVerificationToken=jwt.sign({
        email:user.email
    },process.env.JWT_SECRET,{expiresIn:'1d'})

    await sendEmail({
        to:email,
        subject:"Welcome to Perplexity!",
        // text:`Hi ${username},\n\nThank you for registering at Perplexity.We're excited to have you on board\n\nThe Perplexity Team`,
        html:`<p>Hi ${username},</p><p>Thank you for registering at <strong>Perplexity</strong>.We're excited to have you on board!
        <p>Please verify your email address by clicking the link below:</p>
         <a href="${process.env.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                <p>If you did not create an account, please ignore this email.</p>
        <p/><p>Best regards,<br>The Perplexity Team</p>`
    })

    res.status(201).json({
        message:"User registered successfully",
        success:true,
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
    }catch (err) {
        console.error("Register error:", err.message) // ← add
        res.status(400).json({
            message: err.message,
            success: false
        })
    }
    
}


export async function verifyEmail(req, res) {
    const { token } = req.query
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findOne({ email: decoded.email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid user",
                success: false,
                err: "User not found"
            })
        }

        user.verified = true
        await user.save()

        // ← redirect to frontend instead of sending HTML
        res.redirect(`${process.env.CLIENT_URL}/login`)

    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
    }
}


export async function login(req,res){
    const {email,password}=req.body

    const user= await userModel.findOne({email})

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        })
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie("token", token,{
        httpOnly:true,
        secure:true,
        sameSite:"none",
        maxAge:7*24*60*60*1000
    })

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

export async function getMe(req, res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}

export async function resendVerificationEmail(req, res) {
    const { email } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "User not found",
            success: false
        })
    }

    if (user.verified) {
        return res.status(400).json({
            message: "Email already verified",
            success: false
        })
    }

    const emailVerificationToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    await sendEmail({
        to: email,
        subject: "Verify your email - Tavilyte",
        html: `<p>Hi ${user.username},</p>
            <p>Please verify your email:</p>
            <a href='${process.env.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}'>
                Verify Email
            </a>`
    })

    res.status(200).json({
        message: "Verification email resent successfully",
        success: true
    })
}

export async function logout(req, res) {
    res.clearCookie("token",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
    })
    res.status(200).json({
        message: "Logged out successfully",
        success: true
    })
}