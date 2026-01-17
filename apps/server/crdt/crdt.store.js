const Y = require("yjs");

const docs = new Map(); // roomId -> Y.Doc

function getYDoc(roomId) {
  if (!docs.has(roomId)) {
    const doc = new Y.Doc();
    docs.set(roomId, doc);
  }
  return docs.get(roomId);
}

module.exports = { getYDoc };
