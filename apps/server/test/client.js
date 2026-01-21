import WebSocket from "ws";
import * as Y from "yjs";

const CLIENT_NAME = process.argv[2] || "Client";

const ydoc = new Y.Doc();
const ytext = ydoc.getText("editor");

const ws = new WebSocket("ws://localhost:3001");

ws.on("message", (message) => {
  const data = JSON.parse(message.toString());

  if (data.type === "sync" || data.type === "update") {
    Y.applyUpdate(ydoc, new Uint8Array(data.update));
    console.log(
      `[${CLIENT_NAME}] Document: "${ytext.toString()}"`
    );
  }
});

/**
 * Send local edits
 */
ydoc.on("update", (update) => {
  ws.send(
    JSON.stringify({
      type: "update",
      update: Array.from(update),
    })
  );
});

ws.on("open", () => {
  console.log(`[${CLIENT_NAME}] Connected`);

  // Simulate typing
  setTimeout(() => {
    ytext.insert(ytext.length, ` ${CLIENT_NAME}`);
  }, 1000);

  // Simulate shared undo
  setTimeout(() => {
    console.log(`[${CLIENT_NAME}] REQUEST UNDO`);
    ws.send(JSON.stringify({ type: "undo" }));
  }, 3000);
});
