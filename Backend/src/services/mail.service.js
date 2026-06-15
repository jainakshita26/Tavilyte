import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

transporter.verify()
    .then(() => console.log("✅ Email transporter is ready"))
    .catch((err) => console.error("❌ Email transporter error:", err.message))

export async function sendEmail({ to, subject, html, text }) {
    try {
        const mailOptions = {
            from: `Tavilyte <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text
        }

        const details = await transporter.sendMail(mailOptions)
        console.log("✅ Email sent to:", to, "| messageId:", details.messageId)
        return details

    } catch (err) {
        console.error("❌ Email sending failed:", err.message)
        throw err
    }
}