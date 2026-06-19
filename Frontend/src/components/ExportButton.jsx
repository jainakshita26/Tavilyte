import { exportChatAsPDF } from "../utils/exportChat.js"

export function ExportButton({ chat }) {
    if (!chat?.messages?.length) return null

    return (
        <button
            onClick={() => exportChatAsPDF(chat)}
            title="Export this conversation as PDF"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700/80 hover:text-white text-zinc-300 text-xs font-semibold cursor-pointer shadow-sm transition-all duration-200 active:scale-[0.98]"
        >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
        </button>
    )
}