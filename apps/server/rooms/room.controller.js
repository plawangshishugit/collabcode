const express = require("express");
const auth = require("../middleware/auth.middleware");
const { createRoom, joinRoom } = require("./room.store");

const router = express.Router();

router.post("/create", auth, (req, res) => {
  const roomId = createRoom(req.user.userId);
  res.json({ roomId });
});

router.post("/join/:roomId", auth, (req, res) => {
  joinRoom(req.params.roomId, req.user.userId);
  res.json({ success: true });
});

module.exports = router;
