const Y = require("yjs");
const { getYDoc } = require("./crdt.store");
const RoomSnapshot = require("../models/RoomSnapshot");

module.exports = function registerCrdtHandlers(io, socket) {
  socket.on("room:join", async ({ roomId }) => {
    socket.join(roomId);

    const latest = await RoomSnapshot.findOne({ roomId })
      .sort({ createdAt: -1 })
      .lean();

    let doc;

    if (latest) {
      doc = new Y.Doc();
      Y.applyUpdate(doc, new Uint8Array(latest.snapshot));
      console.log("📦 Loaded snapshot from DB for room", roomId);
    } else {
      doc = getYDoc(roomId);
    }

    const state = Y.encodeStateAsUpdate(doc);
    socket.emit("crdt:init", state);
  });

  socket.on("crdt:update", ({ roomId, update }) => {
    const doc = getYDoc(roomId);
    Y.applyUpdate(doc, update);
    socket.to(roomId).emit("crdt:update", update);
  });

  socket.on("crdt:restore", async ({ roomId, snapshot }) => {
    try {
      console.log("💾 Saving snapshot to DB for room", roomId);

      await RoomSnapshot.create({
        roomId,
        snapshot: Buffer.from(snapshot),
      });

      socket.to(roomId).emit("crdt:restore", { snapshot });

      console.log("✅ Snapshot saved and broadcasted");
    } catch (err) {
      console.error("❌ Failed to save snapshot:", err);
    }
  });
};
