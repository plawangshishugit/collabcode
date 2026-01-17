const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);
const Y = require("yjs");
const { getYDoc } = require("./crdt/crdt.store");

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId);

    const doc = getYDoc(roomId);
    // Send full CRDT state to new client
    const state = Y.encodeStateAsUpdate(doc);

    socket.emit("crdt:init", state);
  });

  socket.on("crdt:update", ({ roomId, update }) => {
    const doc = getYDoc(roomId);
    // Apply update to server copy
    Y.applyUpdate(doc, update);
    // Broadcast to others
    socket.to(roomId).emit("crdt:update", update);
  });
});

server.listen(4000, () =>
  console.log("🚀 Server running on http://localhost:4000")
);
