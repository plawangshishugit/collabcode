const Y = require("yjs");
const { getYDoc } = require("../../crdt/crdt.store");
const RoomSnapshot = require("../../models/RoomSnapshot");

async function handleRestore(socket, roomId, snapshot, userId) {
  const doc = getYDoc(roomId);
  Y.applyUpdate(doc, snapshot);

  socket.to(roomId).emit("crdt:update", snapshot);

  await RoomSnapshot.create({
    roomId,
    snapshot,
    userId,
    type: "restore",
  });

  console.log(`⏪ Room ${roomId} restored by ${userId}`);
}

module.exports = { handleRestore };
