 
const transporter = require("./MailConfig");

const sendMail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: '"Library Management" <your-email@gmail.com>',
            to,
            subject,
            text,
            html,
        });
        console.log("Email sent:", info.response);
        return info;
    } catch (err) {
        console.error("Email error:", err);
        throw err;
    }
};

module.exports = sendMail;
