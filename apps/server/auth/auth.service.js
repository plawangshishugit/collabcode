const users = new Map(); // email -> user
const crypto = require("crypto");

function register(email, password) {
  if (users.has(email)) throw new Error("User exists");

  const user = {
    id: crypto.randomUUID(),
    email,
    password,
  };

  users.set(email, user);
  return user;
}

function login(email, password) {
  const user = users.get(email);
  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }
  return user;
}

module.exports = { register, login };
