const Y = require("yjs");
const { getYDoc } = require("../../crdt/crdt.store");

function handleCrdtUpdate(socket, roomId, update) {
  const doc = getYDoc(roomId);
  Y.applyUpdate(doc, update);

  socket.to(roomId).emit("crdt:update", update);
}

module.exports = { handleCrdtUpdate };
