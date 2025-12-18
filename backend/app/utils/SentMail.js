const transporter = require("./mailconfig");

const sendMail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: '"Library Management" <muskan.k@ibirdsservices.com>',
    to,
    subject,
    html,
  });
};

module.exports = sendMail;