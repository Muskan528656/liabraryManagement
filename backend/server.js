const express = require("express");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv").config();
const moment = require("moment");
const app = express();


app.set("view engine", "ejs");

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb" })
);

const path = require("path");
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get("/ibs", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

const PORT = process.env.PORT || 3003;
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
  path: "/ibs/socket.io",
});

app.set('io', io);

io.on("connection", (socket) => {

  console.log("✅ New socket connected:", socket.id);

  socket.on("setup", (userData) => {
    console.log("📥 Setup event received:", userData);

    const userId = userData.id || userData.userId;

    if (userId) {
      socket.join(userId);
      socket.join(`user_${userId}`); // join user notification room
      socket.data.userId = userId;
      socket.data.deviceId = userData.deviceId; // store device id

      console.log(`🟢 User ${userId} connected to rooms: ${userId}, user_${userId}`);
      console.log(`   Device ID: ${socket.data.deviceId}`);
    } else {
      console.warn("⚠️ No user ID found in setup data:", userData);
    }

    socket.emit("connected");
  });

  socket.on("notification_read", (data) => {
    console.log("📬 Notification read:", data);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

require("./app/routes/auth.routes.js")(app);
require("./app/routes/book.routes.js")(app);
require("./app/routes/author.routes.js")(app);
require("./app/routes/category.routes.js")(app);
require("./app/routes/library.routes.js")(app);
require("./app/routes/vendor.routes.js")(app);
require("./app/routes/librarycard.routes.js")(app);
require("./app/routes/bookissue.routes.js")(app);
require("./app/routes/booksubmission.routes.js")(app);
require("./app/routes/librarysettings.routes.js")(app);
require("./app/routes/user.routes.js")(app);
require("./app/routes/purchase.routes.js")(app);
require("./app/routes/notification.routes.js")(app);
require("./app/routes/module.routes.js")(app);
require("./app/routes/company.routes.js")(app);
require("./app/routes/userrole.routes.js")(app);

//added dashboard route --Aabid
require("./app/routes/dashbard.router.js")(app);

server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Base API URL: ${process.env.BASE_API_URL}`);
});


// cron.schedule("0 */20 * * *", async function () {
//   console.log("Public Leads");
//   try {
//     const res = await Publicleads.getOpenLeads();

//     res.map((data, idx) => {
//       let subject = "Unlock the Power of WhatsApp Business for Your Business";
//       Mailer.sendEmail(data.email, data, subject, "public_lead");
//     });
//   } catch (error) {
//     console.error("Error running scheduled task:", error);
//   }
// });


// cron.schedule("30 9 */2 * *", async () => {
//   // cron.schedule("0 23 * * *", async () => {
//   const today = moment().format("YYYY-MM-DD");
//   const endDate = moment().add(7, "days").format("YYYY-MM-DD");
//   console.log("endDate,today", endDate, today);
//   const subscriptions = await Invoice.findSubscriptionsForRenewal(
//     today,
//     endDate
//   );
//   console.log("subscriptions", subscriptions);
//   for (const sub of subscriptions) {
//     const emailData = {
//       name: `${sub.firstname} ${sub.lastname}`,
//       end_date: moment(sub.end_date).format("DD-MM-YYYY"),
//     };

//     const template =
//       sub.plan_name.toLowerCase() === "free"
//         ? "free_subscription_expire"
//         : "subscription_expire";
//     await Mailer.sendEmail(sub.email, emailData, "", template);
//     console.log(`Reminder sent to ${sub.email}`);
//   }
// });
