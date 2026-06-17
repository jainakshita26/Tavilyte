import * as Brevo from '@getbrevo/brevo'

const client = new Brevo.TransactionalEmailsApi()
client.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY

export async function sendEmail({ to, subject, html, text }) {
    console.log('Sending email to:', to)
    try {
        const email = new Brevo.SendSmtpEmail()
        email.to = [{ email: to }]
        email.subject = subject
        email.htmlContent = html
        email.textContent = text
        email.sender = { name: 'Tavilyte', email: process.env.BREVO_SENDER_EMAIL }

        const result = await client.sendTransacEmail(email)
        console.log("✅ Email sent | id:", result.response.statusCode)
        return result

    } catch (err) {
        console.error("❌ Email error:", err.message)
        throw err
    }
}