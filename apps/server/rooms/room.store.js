const rooms = new Map(); // roomId -> { ownerId, members }
const crypto = require("crypto");

function createRoom(ownerId) {
  const roomId = crypto.randomUUID();
  rooms.set(roomId, {
    ownerId,
    members: new Set([ownerId]),
  });
  return roomId;
}

function joinRoom(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  room.members.add(userId);
}

function isMember(roomId, userId) {
  return rooms.get(roomId)?.members.has(userId);
}

module.exports = { createRoom, joinRoom, isMember };
