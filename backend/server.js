const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();


const MODE = process.env.NODE_ENV || "production";
const PORT = process.env.PORT || 3003;
const BASE_PATH =
  MODE === "sandbox" ? "/sandbox/ibs" : "/ibs";


app.set("view engine", "ejs");

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const publicUploadsPath = "/var/www/html/uploads/";
if (!fs.existsSync(publicUploadsPath)) {
  fs.mkdirSync(publicUploadsPath, { recursive: true });
}

const legacyUploadsPath = path.join(__dirname, "uploads");

app.use("/uploads", express.static(publicUploadsPath));
if (fs.existsSync(legacyUploadsPath)) {
  app.use("/uploads", express.static(legacyUploadsPath));
}


app.get(BASE_PATH, (req, res) => {
  res.json({
    mode: MODE.toUpperCase(),
    message:
      MODE === "sandbox"
        ? "Welcome to IBS Sandbox Application"
        : "Welcome to IBS Production Application",
  });
});


const server = http.createServer(app);

const io = require("socket.io")(server, {

  cors: { origin: "*" },
  path: `${BASE_PATH}/socket.io`,
});

app.set("io", io);
global.io = io;

//file upload
// app.use(fileUpload({
//   limits: { fileSize: 5 * 1024 * 1024 },
//   abortOnLimit: true,
//   createParentPath: true,
// }));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("setup", (userData) => {
    const userId = userData.id || userData.userId;

    if (userId) {
      socket.join(userId);
      socket.join(`user_${userId}`);
      socket.data.userId = userId;
      socket.data.deviceId = userData.deviceId;
    } else {
      console.warn("No user ID found in setup data:", userData);
    }

    socket.emit("connected");
  });

  socket.on("notification_read", (data) => {

  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
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
require("./app/routes/autoconfig.route.js")(app);
require("./app/routes/subscription.routes.js")(app);
require("./app/routes/rolepermission.routes.js")(app);
require("./app/routes/permission.route.js")(app);
require("./app/routes/plan.routes.js")(app);
require("./app/routes/publisher.routes.js")(app);
require("./app/routes/mail.routes.js")(app);
require("./app/routes/dashbard.router.js")(app);
require("./app/routes/objecttype.routes.js")(app);


server.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${MODE.toUpperCase()} mode on port ${PORT}`
  );
  console.log(`🌐 Base URL: ${BASE_PATH}`);
});