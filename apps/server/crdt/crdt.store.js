const Y = require("yjs");

const docs = new Map();

function getYDoc(roomId) {
  if (!docs.has(roomId)) {
    docs.set(roomId, new Y.Doc());
  }
  return docs.get(roomId);
}

module.exports = {
  getYDoc,
};
