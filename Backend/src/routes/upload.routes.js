import express from "express"
import multer from "multer"
import { handleUpload } from "../controllers/upload.controller.js"
import {authUser} from "../middleware/auth.middleware.js"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
        if (allowed.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Unsupported file type"))
        }
    },
})

const router = express.Router()

router.post("/", authUser, upload.single("file"), handleUpload)

export default router