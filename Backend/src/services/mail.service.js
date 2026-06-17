import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,  // your Brevo login email
        pass: process.env.BREVO_SMTP_PASS,  // Brevo SMTP key (not API key)
    }
})

transporter.verify()
    .then(() => console.log("✅ Email transporter ready"))
    .catch((err) => console.error("❌ Email transporter error:", err.message))

export async function sendEmail({ to, subject, html, text }) {
    console.log('Sending email to:', to)
    try {
        const mailOptions = {
from: `Tavilyte <${process.env.BREVO_SENDER_EMAIL}>`,            to,
            subject,
            html,
            text
        }

        const details = await transporter.sendMail(mailOptions)
        console.log("✅ Email sent | messageId:", details.messageId)
        return details

    } catch (err) {
        console.error("❌ Email error:", err.message)
        throw err
    }
}