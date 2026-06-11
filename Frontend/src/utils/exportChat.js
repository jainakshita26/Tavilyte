import { jsPDF } from "jspdf"

export function exportChatAsPDF(chat) {
    const doc = new jsPDF({ unit: "mm", format: "a4" })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // ── Header ──
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(chat.title || "Tavilyte Chat Export", margin, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(130, 130, 130)
    doc.text(`Exported on ${new Date().toLocaleString()}`, margin, y)
    y += 10

    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // ── Messages ──
    for (const msg of chat.messages) {
        const isUser = msg.role === "user"
        const label = isUser ? "You" : "Tavilyte AI"
        const labelColor = isUser ? [59, 130, 246] : [16, 185, 129]

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...labelColor)
        doc.text(label, margin, y)
        y += 5

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(30, 30, 30)

        const lines = doc.splitTextToSize(msg.content, maxWidth)

        // Page-break check
        if (y + lines.length * 5 > pageHeight - 20) {
            doc.addPage()
            y = 20
        }

        doc.text(lines, margin, y)
        y += lines.length * 5 + 8
    }

    doc.save(`${(chat.title || "tavilyte-chat").replace(/[^a-z0-9]/gi, "_")}.pdf`)
}