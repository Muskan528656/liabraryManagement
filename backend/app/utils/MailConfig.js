
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "muskan.k@ibirdsservices.com",
        pass: "qqfk gmvj zmwr mffj",
    },
});

module.exports = transporter;
