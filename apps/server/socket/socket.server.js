const { handleRoomJoin } = require("./handlers/room.handler");
const { handleCrdtUpdate } = require("./handlers/crdt.handler");
const { handleSnapshot } = require("./handlers/snapshot.handler");
const { handleRestore } = require("./handlers/restore.handler");
const { handleEditAnalytics } = require("./handlers/analytics.handler");

module.exports = function registerSocketServer(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    socket.on("room:join", ({ roomId }) => {
      handleRoomJoin(socket, roomId);
    });

    socket.on("crdt:update", ({ roomId, update }) => {
      handleCrdtUpdate(socket, roomId, update);
    });

    socket.on("crdt:snapshot", ({ roomId, snapshot, userId }) => {
      handleSnapshot(roomId, snapshot, userId);
    });

    socket.on("crdt:restore", ({ roomId, snapshot, userId }) => {
      handleRestore(socket, roomId, snapshot, userId);
    });

    // ✅ ADD HERE
    socket.on("analytics:edit", ({ roomId, userId }) => {
      handleEditAnalytics(roomId, userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
