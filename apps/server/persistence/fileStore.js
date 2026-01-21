import fs from "fs";
import path from "path";
import * as Y from "yjs";

const DATA_DIR = path.resolve("data/rooms");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function roomFile(roomId) {
  return path.join(DATA_DIR, `${roomId}.bin`);
}

export function loadRoom(roomId) {
  const file = roomFile(roomId);
  if (!fs.existsSync(file)) return null;

  const data = fs.readFileSync(file);
  return new Uint8Array(data);
}

export function saveRoom(roomId, ydoc) {
  const update = Y.encodeStateAsUpdate(ydoc);
  fs.writeFileSync(roomFile(roomId), Buffer.from(update));
}
