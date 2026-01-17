const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);
});

server.listen(4000, () =>
  console.log("🚀 Server running on http://localhost:4000")
);
