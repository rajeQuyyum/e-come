const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🧾 REGISTER NEW USER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create({ name, email, password });
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🧾 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.password !== password)
      return res.status(401).json({ error: "Invalid password" });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🧾 GET ALL USERS (for admin)
router.get("/", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

module.exports = router;
