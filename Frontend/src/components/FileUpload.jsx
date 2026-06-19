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

    const isPdf = fileName?.toLowerCase().endsWith('.pdf')

    return (
        <div className='flex items-center gap-2'>
            <label
                htmlFor="file-input"
                className='flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all duration-200 flex-shrink-0 shadow-sm active:scale-[0.97]'
                title="Attach PDF or image"
            >
                {uploading ? (
                    <span className='w-4.5 h-4.5 border-2 border-zinc-700 border-t-cyan-400 rounded-full animate-spin' />
                ) : (
                    <svg className='w-4.5 h-4.5 text-zinc-400 hover:text-cyan-400 transition-colors duration-150' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
                <span className={`flex items-center gap-2 border rounded-full pl-2.5 pr-2 py-1 text-xs max-w-[150px] shadow-sm select-none transition-all duration-200
                    ${isPdf 
                      ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {isPdf ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span className='truncate font-medium'>{fileName}</span>
                    <button 
                      onClick={onClear} 
                      className='hover:opacity-75 transition-opacity flex-shrink-0 cursor-pointer p-0.5 rounded-full hover:bg-white/10'
                      title="Remove file"
                    >
                      ✕
                    </button>
                </span>
            )}

            {error && (
                <span className='text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full animate-pulse select-none'>{error}</span>
            )}
        </div>
    )
}