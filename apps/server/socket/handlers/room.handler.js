const Y = require("yjs");
const { getYDoc } = require("../../crdt/crdt.store");
const RoomSnapshot = require("../../models/RoomSnapshot");

async function handleRoomJoin(socket, roomId) {
  socket.join(roomId);

  const doc = getYDoc(roomId);

  // Restore latest snapshot
  const lastSnapshot = await RoomSnapshot.findOne(
    { roomId },
    {},
    { sort: { createdAt: -1 } }
  );

  if (lastSnapshot) {
    Y.applyUpdate(doc, lastSnapshot.snapshot);
    console.log(`🔄 Room ${roomId} restored from DB`);
  }

  // Send initial state
  const state = Y.encodeStateAsUpdate(doc);
  socket.emit("crdt:init", state);
}

module.exports = { handleRoomJoin };
