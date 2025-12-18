
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "muskan.k@ibirdsservices.com",
        pass: "mhtd nkdb sljz xooj", 
    },
});

module.exports = transporter;
