const mongoose = require("mongoose");

const RoomSnapshotSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  snapshot: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RoomSnapshot", RoomSnapshotSchema);
