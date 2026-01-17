const registerCrdtHandlers = require("../crdt/crdt.handlers");

module.exports = function registerSocketServer(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    registerCrdtHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
