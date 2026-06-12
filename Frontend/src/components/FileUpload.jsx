import { useState } from 'react'
import { uploadFile } from '../features/chat/service/chat.api.js'

export function FileUpload({ onFileProcessed, fileName, onClear }) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)

    const handleFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setError(null)
        setUploading(true)

        try {
            const data = await uploadFile(file)
            onFileProcessed(data.extractedContent, file.name, data.fileType)
        } catch (err) {
            console.error("Upload failed:", err)
            setError(err.response?.data?.message || "Upload failed")
            onFileProcessed(null)
        } finally {
            setUploading(false)
            e.target.value = '' // allow re-selecting same file
        }
    }

    return (
        <div className='flex items-center gap-2'>
            <label
                htmlFor="file-input"
                className='flex items-center justify-center w-8 h-8 rounded-lg bg-white/0.08 border border-white/10 hover:bg-white/[0.14] cursor-pointer transition flex-shrink-0'
                title="Attach PDF or image"
            >
                {uploading ? (
                    <span className='w-3 h-3 border-2 border-white/30 border-t-white/80 rounded-full animate-spin' />
                ) : (
                    <svg className='w-3.5 h-3.5 fill-white/60' viewBox='0 0 16 16'>
                        <path d='M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 0 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 0 1-7 0V3z'/>
                    </svg>
                )}
            </label>
            <input
                id="file-input"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className='hidden'
            />

            {fileName && (
                <span className='flex items-center gap-1.5 bg-white/0.06 border border-white/10 rounded-full px-2.5 py-1 text-xs text-white/70 max-w-[140px]'>
                    <span className='truncate'>{fileName}</span>
                    <button onClick={onClear} className='hover:text-white flex-shrink-0'>✕</button>
                </span>
            )}

            {error && (
                <span className='text-xs text-red-400'>{error}</span>
            )}
        </div>
    )
}