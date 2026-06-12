import * as pdfParseModule from "pdf-parse"
const pdfParse = pdfParseModule.default || pdfParseModule
import { describeImageWithGemini } from "../services/ai.service.js"

export async function handleUpload(req, res) {
    const file = req.file

    if (!file) {
        return res.status(400).json({ message: "No file provided" })
    }

    try {
        let extractedContent = ""
        let fileType = ""

        if (file.mimetype === "application/pdf") {
            const parsed = await pdfParse(file.buffer)
            extractedContent = parsed.text.slice(0, 12000) // token safety cap
            fileType = "pdf"

            if (!extractedContent.trim()) {
                return res.status(422).json({
                    message: "Could not extract text — PDF may be scanned/image-based"
                })
            }
        } else if (file.mimetype.startsWith("image/")) {
            const base64 = file.buffer.toString("base64")
            extractedContent = await describeImageWithGemini(base64, file.mimetype)
            fileType = "image"
        }

        res.status(200).json({
            success: true,
            fileType,
            fileName: file.originalname,
            extractedContent,
        })

    } catch (err) {
        console.error("Upload processing error:", err.message)
        res.status(500).json({ message: "Failed to process file" })
    }
    // file.buffer is never written anywhere — garbage collected after this function
}