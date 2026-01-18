const rooms = new Map();

function getRoomAnalytics(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      activeUsers: 0,
      edits: 0,
      restores: 0,
      snapshots: 0,
      sessionStart: new Date(),
      lastUpdated: new Date(),
    });
  }
  return rooms.get(roomId);
}

module.exports = { getRoomAnalytics };
