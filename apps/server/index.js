const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);

  socket.on("room:join", ({ roomId, user }) => {
    socket.join(roomId);

    socket.to(roomId).emit("user:joined", {
      socketId: socket.id,
      user,
    });
  });

  socket.on("cursor:move", ({ roomId, cursor }) => {
    socket.to(roomId).emit("cursor:update", {
      socketId: socket.id,
      cursor,
    });
  });

  socket.on("disconnect", () => {
    socket.rooms.forEach((roomId) => {
      socket.to(roomId).emit("user:left", {
        socketId: socket.id,
      });
    });
  });
});


server.listen(4000, () =>
  console.log("🚀 Server running on http://localhost:4000")
);
