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
 * 1. Shared Yjs document
 */
const ydoc = new Y.Doc();
const ytext = ydoc.getText("editor");

/**
 * 2. GLOBAL Undo Manager
 * This is the key to shared undo
 */
const undoManager = new Y.UndoManager(ytext, {
  captureTimeout: 500, // group rapid edits
});

/**
 * 3. Broadcast helper
 */
function broadcastUpdate(update, except = null) {
  wss.clients.forEach((client) => {
    if (client !== except && client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "update",
          update: Array.from(update),
        })
      );
    }
  });
}

/**
 * 4. WebSocket handling
 */
wss.on("connection", (ws) => {
  console.log("🔵 Client connected");

  // Send full state on connect
  ws.send(
    JSON.stringify({
      type: "sync",
      update: Array.from(Y.encodeStateAsUpdate(ydoc)),
    })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message.toString());

    /**
     * Awareness updates (cursor, user info)
     */
    if (data.type === "awareness") {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }
    
    /**
     * Apply document updates
     */
    if (data.type === "update") {
      const update = new Uint8Array(data.update);
      Y.applyUpdate(ydoc, update);
      broadcastUpdate(update, ws);
    }

    /**
     * SHARED UNDO
     */
    if (data.type === "undo") {
      if (undoManager.canUndo()) {
        undoManager.undo();
      }
    }

    /**
     * SHARED REDO
     */
    if (data.type === "redo") {
      if (undoManager.canRedo()) {
        undoManager.redo();
      }
    }
  });

  ws.on("close", () => {
    console.log("🔴 Client disconnected");
  });
});

/**
 * 5. Broadcast undo/redo changes
 */
ydoc.on("update", (update) => {
  broadcastUpdate(update);
});
