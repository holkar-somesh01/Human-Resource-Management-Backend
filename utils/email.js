const nodemailer = require("nodemailer")

const sendEmail = ({ subject, to, message }) => new Promise((resolve, reject) => {
    const Transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.FROM_EMAIL,
            pass: process.env.EMAIL_PASS
        }
    })
    Transport.sendMail({
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        message: message,
        html: message
    }, (err) => {
        if (err) {
            console.log(err)
            reject(false)
        } else {
            resolve(true)
        }
    })
})
module.exports = sendEmail