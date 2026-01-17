const express = require("express");
const { register, login } = require("./auth.service");
const { signToken } = require("./jwt");

const router = express.Router();

router.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = register(email, password);
  const token = signToken({ userId: user.id });
  res.json({ token });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = login(email, password);
  const token = signToken({ userId: user.id });
  res.json({ token });
});

module.exports = router;
