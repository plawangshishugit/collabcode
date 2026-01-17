const Y = require("yjs");
const { getYDoc } = require("./crdt.store");

module.exports = function registerCrdtHandlers(io, socket) {
  // Join room + send initial CRDT state
  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId);

    const doc = getYDoc(roomId);
    const state = Y.encodeStateAsUpdate(doc);

    socket.emit("crdt:init", state);

    console.log(`📄 ${socket.id} joined room ${roomId}`);
  });

  // Receive incremental CRDT updates
  socket.on("crdt:update", ({ roomId, update }) => {
    const doc = getYDoc(roomId);

    Y.applyUpdate(doc, update);

    socket.to(roomId).emit("crdt:update", update);
  });

  // 🔄 Shared Time Travel (NEW)
  socket.on("crdt:restore", ({ roomId, snapshot }) => {
    const doc = getYDoc(roomId);

    // Replace document state
    doc.destroy();

    const newDoc = new Y.Doc();
    Y.applyUpdate(newDoc, new Uint8Array(snapshot));

    // Overwrite store
    const docsMap = require("./crdt.store");
    docsMap.getYDoc(roomId); // ensures key exists
    docsMap._docs?.set?.(roomId, newDoc); // optional internal ref

    socket.to(roomId).emit("crdt:restore", { snapshot });

    console.log(`🔄 Room ${roomId} restored to previous state`);
  });
};
