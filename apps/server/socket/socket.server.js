const Y = require("yjs");
const { getYDoc } = require("../crdt/crdt.store");
const RoomSnapshot = require("../models/RoomSnapshot");

module.exports = function registerSocketServer(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join room
    socket.on("room:join", async ({ roomId }) => {
      socket.join(roomId);

      const doc = getYDoc(roomId);

      // Restore last snapshot from DB (if exists)
      const lastSnapshot = await RoomSnapshot.findOne(
        { roomId },
        {},
        { sort: { createdAt: -1 } }
      );

      if (lastSnapshot) {
        Y.applyUpdate(doc, lastSnapshot.snapshot);
        console.log(`🔄 Room ${roomId} restored to previous state`);
      }

      // Send initial CRDT state
      const state = Y.encodeStateAsUpdate(doc);
      socket.emit("crdt:init", state);
    });

    // Receive CRDT updates
    socket.on("crdt:update", async ({ roomId, update }) => {
      const doc = getYDoc(roomId);
      Y.applyUpdate(doc, update);

      // Broadcast to others
      socket.to(roomId).emit("crdt:update", update);

      // Persist snapshot (debounced client-side already)
      await RoomSnapshot.create({
        roomId,
        snapshot: update,
      });
    });

    // Restore snapshot (shared undo / time travel)
    socket.on("crdt:restore", ({ roomId, snapshot }) => {
      const doc = getYDoc(roomId);
      Y.applyUpdate(doc, snapshot);

      socket.to(roomId).emit("crdt:update", snapshot);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
