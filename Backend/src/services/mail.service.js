// import nodemailer from 'nodemailer'

// const transporter=nodemailer.createTransport({
//     service:'gmail',
//     auth:{
//         type:'OAuth2',
//         user:process.env.GOOGLE_USER,
//         clientSecret:process.env.GOOGLE_CLIENT_SECRET,
//         refreshToken:process.env.GOOGLE_REFRESH_TOKEN,
//         clientId:process.env.GOOGLE_CLIENT_ID
//     }
// })

// transporter.verify()
// .then(()=>{console.log("Email transporter  is ready to send email")})
// .catch((err)=>{console.error("Email transporter verification failed:",err);})


// export async function sendEmail({to,subject,html,text}){
//     const mailOptions={
//         from:process.env.GOOGLE_USER,
//         to,
//         subject,
//         html,
//         text
//     };
//     const details=await transporter.sendMail(mailOptions)
//     console.log("Email sent:",details)
// }

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,   // ← App Password from Google
    }
})

transporter.verify()
    .then(() => console.log("Email transporter is ready to send email"))
    .catch((err) => console.error("Email transporter error:", err.message))

export async function sendEmail({ to, subject, html, text }) {
    const mailOptions = {
        from: `Tavilyte <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
    }

    const details = await transporter.sendMail(mailOptions)
    console.log("Email sent:", details.messageId)
}