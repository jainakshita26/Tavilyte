// import nodemailer from 'nodemailer'

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     }
// })

// transporter.verify()
//     .then(() => console.log("✅ Email transporter is ready"))
//     .catch((err) => console.error("❌ Email transporter error:", err.message))

// export async function sendEmail({ to, subject, html, text }) {
//     console.log('Sendgin mail')
//     try {
//         const mailOptions = {
//             from: `Tavilyte <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             html,
//             text
//         }

//         const details = await transporter.sendMail(mailOptions)
//         console.log("✅ Email sent to:", to, "| messageId:", details.messageId)
//         return details

//     } catch (err) {
//         console.error("❌ Email sending failed:", err.message)
//         throw err
//     }
// }

// import { Resend } from 'resend'

// const resend = new Resend(process.env.RESEND_API_KEY)

// export async function sendEmail({ to, subject, html, text }) {
//     console.log('Sending email to:', to)
//     try {
//         const { data, error } = await resend.emails.send({
//             from: 'Tavilyte <onboarding@resend.dev>',
//             to,
//             subject,
//             html,
//             text
//         })

//         if (error) {
//             console.error("❌ Email failed:", error)
//             throw new Error(error.message)
//         }

//         console.log("✅ Email sent | id:", data.id)
//         return data

//     } catch (err) {
//         console.error("❌ Email error:", err.message)
//         throw err
//     }
// }

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