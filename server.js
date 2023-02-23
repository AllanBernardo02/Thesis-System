const express = require("express");

const app = express();
const userRoute = require("./routes/userRoute.js");
const adminRoute = require("./routes/adminRoute.js");
const doctorRoute = require("./routes/doctorRoute.js");
const chatRoute = require("./routes/chatRoute.js");
const messageRoute = require("./routes/messageRoute.js");

app.use(express.json({ limit: "30mb" }));
require("dotenv").config();

const dbConfig = require("./config/dbConfig");

const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URL);

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/doctor", doctorRoute);
app.use("/api/chat", chatRoute);
app.use("/api/message", messageRoute);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
