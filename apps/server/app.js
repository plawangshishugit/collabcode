const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://plawangshishu5029_db_user:9LOfqg2h1apgsElm@cluster0.sbba8lp.mongodb.net/collabcode?retryWrites=true&w=majority"
);

mongoose.connection.once("open", () => {
  console.log("🗄️ MongoDB connected (Atlas)");
});

const authRoutes = require("./auth/auth.controller");
const roomRoutes = require("./rooms/room.controller");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);

module.exports = app;
