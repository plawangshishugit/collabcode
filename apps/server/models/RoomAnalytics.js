const mongoose = require("mongoose");

const RoomAnalyticsSchema = new mongoose.Schema({
  roomId: { type: String, index: true },
  activeUsers: Number,
  edits: Number,
  restores: Number,
  snapshots: Number,
  sessionStart: Date,
  lastUpdated: Date,
});

module.exports = mongoose.model(
  "RoomAnalytics",
  RoomAnalyticsSchema
);
