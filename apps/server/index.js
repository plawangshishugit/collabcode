const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);

  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId);
    console.log(`📦 Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("code:change", ({ roomId, code }) => {
    socket.to(roomId).emit("code:update", { code });
  });

  socket.on("disconnect", () => {
    console.log("🔴 WS disconnected:", socket.id);
  });
});

server.listen(4000, () =>
  console.log("🚀 Server running on http://localhost:4000")
);
