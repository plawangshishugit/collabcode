import express from "express";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { loadRoom, saveRoom } from "./persistence/fileStore.js";
import { saveSnapshot } from "./persistence/snapshots.js";

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`🟢 Collab server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

/**
 * roomId -> {
 *   ydoc,
 *   ytext,
 *   undoManager,
 *   clients,
 *   ownerId,
 *   changeCount
 * }
 */
const rooms = new Map();

function getRoom(roomId) {
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
      ownerId: null, // 🔒 SINGLE SOURCE OF TRUTH
      changeCount: 0,
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
  ws.roomId = null;
  ws.userId = null;
  ws.role = null;

  ws.on("message", (raw) => {
    const data = JSON.parse(raw.toString());

    /* ───────────── JOIN ───────────── */
    if (data.type === "join") {
      // 🚫 Prevent duplicate join from same socket
      if (ws.roomId) return;

      ws.roomId = data.roomId;
      ws.userId = data.userId;

      const room = getRoom(ws.roomId);
      room.clients.add(ws);

      // 👑 Assign owner ONCE
      if (!room.ownerId) {
        room.ownerId = data.userId;
        console.log("👑 Owner assigned:", data.userId);
      }

      ws.role =
        room.ownerId === data.userId ? "owner" : "viewer";

      console.log("🔐 Permission:", {
        room: ws.roomId,
        user: ws.userId,
        role: ws.role,
      });

      ws.send(JSON.stringify({
        type: "permission",
        role: ws.role,
      }));

      ws.send(JSON.stringify({
        type: "sync",
        update: Array.from(Y.encodeStateAsUpdate(room.ydoc)),
      }));

      return;
    }

    const room = rooms.get(ws.roomId);
    if (!room) return;

    /* ───────────── UPDATE ───────────── */
    if (data.type === "update") {
      if (room.ownerId !== ws.userId) return;

      const update = new Uint8Array(data.update);
      Y.transact(room.ydoc, () => {
        Y.applyUpdate(room.ydoc, update);
      }, ws);

      saveRoom(ws.roomId, room.ydoc);

      room.changeCount++;
      if (room.changeCount % 20 === 0) {
        saveSnapshot(ws.roomId, room.ydoc);
      }

      broadcast(room, { type: "update", update: data.update }, ws);
    }

    /* ───────────── UNDO / REDO ───────────── */
    if (data.type === "undo" && room.ownerId === data.userId) {
      room.undoManager.undo();

      const update = Y.encodeStateAsUpdate(room.ydoc);

      broadcast(room, {
        type: "update",
        update: Array.from(update),
      });

      saveRoom(roomId, room.ydoc);
    }

    if (data.type === "redo" && room.ownerId === data.userId) {
      room.undoManager.redo();

      const update = Y.encodeStateAsUpdate(room.ydoc);

      broadcast(room, {
        type: "update",
        update: Array.from(update),
      });

      saveRoom(roomId, room.ydoc);
    }

    /* ───────────── AWARENESS ───────────── */
    if (data.type === "awareness") {
      broadcast(room, data, ws);
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomId);
    if (!room) return;

    room.clients.delete(ws);
    if (room.clients.size === 0) {
      rooms.delete(ws.roomId);
      console.log(`🧹 Room ${ws.roomId} cleaned up`);
    }
  });
});
