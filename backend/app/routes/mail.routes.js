const sendMail = require("../utils/mailer");
const {
    dueTemplate,
    overdueTemplate,
} = require("../../app/utils/ReminderTemplate");
const { response } = require("express");

module.exports = (app) => {

    app.get("/api/send-mail", async (req, res) => {
        try {
            const info = await sendMail({
                to: "muskan.k@ibirdsservices.com",
                subject: "API Test Email",
                text: "due fees reminder",
                html: "<b>Tested Mail</b>",
            });

            res.send({ message: " Mail sent", info });
        } catch (err) {
            console.error("❌ Mail Error:", err);
            res.status(500).send(err.message);
        }
    });

 
    app.get("/api/mail/due-reminder", async (req, res) => {
        try {
            const html = dueTemplate({
                studentName: "Ahmed Khan",
                bookName: "Computer Science Basics",
                dueDate: "15-Sept-2025",
            });

            const response = await sendMail({
                to: "muskan.k@ibirdsservices.com",
                subject: "📘 Library Book Submission Reminder",
                html,
            });

            res.json({ message: "Due reminder mail sent", response });
        } catch (err) {
            console.error("Due Mail Error:", err);
            res.status(500).json({ error: err.message });
        }
    });

 
    app.get("/api/mail/overdue", async (req, res) => {
        try {
            const html = overdueTemplate({
                studentName: "Ahmed Khan",
                bookName: "Node JS Basics",
                dueDate: "10-Sept-2025",
                overdueDays: 3,
                penaltyAmount: 60,
            });

            await sendMail({
                to: "muskan.k@ibirdsservices.com",
                subject: "📕 Library Book Overdue Notice",
                html,
            });

            res.json({ message: "Overdue mail sent" });
        } catch (err) {
            console.error("Overdue Mail Error:", err);
            res.status(500).json({ error: err.message });
        }
    });

};
