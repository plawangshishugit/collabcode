const mongoose = require("mongoose");

const RoomSnapshotSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },

  snapshot: {
    type: Buffer,
    required: true,
  },

  // ✅ NEW: who created this snapshot
  userId: {
    type: String,
    required: false, // allow older snapshots
    index: true,
  },

  // Optional future-proofing
  type: {
    type: String,
    enum: ["auto", "manual", "restore"],
    default: "auto",
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("RoomSnapshot", RoomSnapshotSchema);
