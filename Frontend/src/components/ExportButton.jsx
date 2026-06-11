import { exportChatAsPDF } from "../utils/exportChat.js"

export function ExportButton({ chat }) {
    if (!chat?.messages?.length) return null

    return (
        <button
            onClick={() => exportChatAsPDF(chat)}
            title="Export as PDF"
            className="p-1.5 rounded-md hover:bg-white/10 transition"
        >
            <svg className="w-4 h-4 fill-white/50 hover:fill-white/90" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
        </button>
    )
}