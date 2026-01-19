const RoomSnapshot = require("../../models/RoomSnapshot");

async function handleSnapshot(roomId, snapshot, userId) {
  await RoomSnapshot.create({
    roomId,
    snapshot,
    userId,
    type: "auto",
  });

  console.log(`📸 Snapshot saved for room ${roomId}`);
}

module.exports = { handleSnapshot };
