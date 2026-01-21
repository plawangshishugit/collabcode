import express from "express";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { loadRoom, saveRoom } from "./persistence/fileStore.js";

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

function getRoom(roomId, creatorId = null) {
  if (!rooms.has(roomId)) {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("editor");

    const persisted = loadRoom(roomId);
    if (persisted) {
      Y.applyUpdate(ydoc, persisted);
    }

    const undoManager = new Y.UndoManager(ytext, {
      captureTimeout: 500,
    });

    rooms.set(roomId, {
      ydoc,
      ytext,
      undoManager,
      clients: new Set(),
      ownerId: creatorId, // 👑 owner
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
      room = getRoom(roomId, data.userId);

    // If room already exists, ownerId is preserved
    if (!room.ownerId) {
      room.ownerId = data.userId;
    }

      room.clients.add(ws);

      // send full document state
      ws.send(
        JSON.stringify({
          type: "sync",
          role: room.ownerId === data.userId ? "owner" : "viewer",
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
      if (room.ownerId !== data.userId) return; // 🚫 viewer blocked

      const update = new Uint8Array(data.update);
      Y.applyUpdate(room.ydoc, update);
      saveRoom(roomId, room.ydoc);
      broadcast(room, { type: "update", update: data.update }, ws);
    }
    /**
     * 3️⃣ Shared undo / redo
     */
    if (data.type === "undo") {
      if (room.ownerId !== data.userId) return;
      room.undoManager.undo();
      saveRoom(roomId, room.ydoc);
    }

    if (data.type === "redo") {
      if (room.ownerId !== data.userId) return;
      room.undoManager.redo();
      saveRoom(roomId, room.ydoc);
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
