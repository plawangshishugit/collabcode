const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/collabcode");

mongoose.connection.once("open", () => {
  console.log("🗄️ MongoDB connected");
});

const authRoutes = require("./auth/auth.controller");
const roomRoutes = require("./rooms/room.controller");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);

module.exports = app;
