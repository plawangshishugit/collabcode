import express from "express";
import { WebSocketServer } from "ws";
import * as Y from "yjs";

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`🟢 Collab server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

/**
 * Room registry
 * roomId -> { ydoc, ytext, undoManager, clients }
 */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("editor");
    const undoManager = new Y.UndoManager(ytext, {
      captureTimeout: 500,
    });

    rooms.set(roomId, {
      ydoc,
      ytext,
      undoManager,
      clients: new Set(),
    });
  }
  return rooms.get(roomId);
}

function broadcast(room, message, except = null) {
  room.clients.forEach((client) => {
    if (client !== except && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", (ws) => {
  let roomId = null;
  let room = null;

  ws.on("message", (raw) => {
    const data = JSON.parse(raw.toString());

    /**
     * 1️⃣ Join room
     */
    if (data.type === "join") {
      roomId = data.roomId;
      room = getRoom(roomId);
      room.clients.add(ws);

      // send full document state
      ws.send(
        JSON.stringify({
          type: "sync",
          update: Array.from(Y.encodeStateAsUpdate(room.ydoc)),
        })
      );

      return;
    }

    if (!room) return;

    /**
     * 2️⃣ Document updates
     */
    if (data.type === "update") {
      const update = new Uint8Array(data.update);
      Y.applyUpdate(room.ydoc, update);
      broadcast(room, { type: "update", update: data.update }, ws);
    }

    /**
     * 3️⃣ Shared undo / redo
     */
    if (data.type === "undo") {
      room.undoManager.canUndo() && room.undoManager.undo();
    }

    if (data.type === "redo") {
      room.undoManager.canRedo() && room.undoManager.redo();
    }

    /**
     * 4️⃣ Awareness relay
     */
    if (data.type === "awareness") {
      broadcast(room, data, ws);
    }
  });

  ws.on("close", () => {
    if (!room) return;

    room.clients.delete(ws);

    // Cleanup empty rooms
    if (room.clients.size === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Room ${roomId} cleaned up`);
    }
  });
});
