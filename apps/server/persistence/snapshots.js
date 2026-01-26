import fs from "fs";
import path from "path";
import * as Y from "yjs";

const SNAPSHOT_DIR = path.resolve("data/snapshots");

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function roomDir(roomId) {
  return path.join(SNAPSHOT_DIR, roomId);
}

export function saveSnapshot(roomId, ydoc) {
  const dir = roomDir(roomId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const version = Date.now();
  const file = path.join(dir, `${version}.bin`);

  const update = Y.encodeStateAsUpdate(ydoc);
  fs.writeFileSync(file, Buffer.from(update));

  return version;
}

export function listSnapshots(roomId) {
  const dir = roomDir(roomId);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".bin"))
    .map((f) => ({
      version: f.replace(".bin", ""),
    }))
    .sort((a, b) => b.version - a.version);
}

export function loadSnapshot(roomId, version) {
  const file = path.join(roomDir(roomId), `${version}.bin`);
  if (!fs.existsSync(file)) return null;

  return new Uint8Array(fs.readFileSync(file));
}
