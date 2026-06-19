import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const PDFParser = require('pdf2json')

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
            extractedContent = await extractPdfText(file.buffer)
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
        console.error("Upload error:", err.message)
        res.status(500).json({ message: "Failed to process file" })
    }
}

function extractPdfText(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1)

        pdfParser.on("pdfParser_dataError", (err) => {
            reject(new Error(err.parserError))
        })

        pdfParser.on("pdfParser_dataReady", () => {
            const text = pdfParser.getRawTextContent()
            resolve(text.slice(0, 12000))
        })

        pdfParser.parseBuffer(buffer)
    })
}