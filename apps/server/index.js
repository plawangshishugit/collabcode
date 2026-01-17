const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const registerSocketServer = require("./socket/socket.server");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

registerSocketServer(io);

server.listen(4000, () => {
  console.log("🚀 Server running on http://localhost:4000");
});
