const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Message = require("../models/Message");
const User = require("../models/User");
const { io } = require("../server");

// 🖼️ Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/chat"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/**
 * 📩 GET /api/messages/rooms
 */
router.get("/rooms", async (req, res) => {
  try {
    const userIds = await Message.distinct("room");
    const users = await User.find({ _id: { $in: userIds } }).select(
      "email name _id"
    );
    const result = userIds.map((id) => {
      const u = users.find((x) => x._id.toString() === id);
      return u
        ? { id: u._id, email: u.email, name: u.name || u.email }
        : { id, email: "Unknown User", name: "Unknown User" };
    });
    res.json(result);
  } catch (err) {
    console.error("GET /messages/rooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 💬 GET /api/messages/:room
 */
router.get("/:room", async (req, res) => {
  try {
    const room = req.params.room;
    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("GET /messages/:room error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✉️ POST /api/messages
 * Supports image + text
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { room, from, text } = req.body;
    if (!room || !from || (!text && !req.file)) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const image = req.file ? `/uploads/chat/${req.file.filename}` : "";

    const message = await Message.create({
      room,
      from,
      text,
      image,
      delivered: true,
      seen: false,
    });

    io.to(room).emit("receiveMessage", message);
    res.json(message);
  } catch (err) {
    console.error("POST /messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 👁️ PUT /api/messages/seen/:room
 */
router.put("/seen/:room", async (req, res) => {
  try {
    const { room } = req.params;
    await Message.updateMany({ room, seen: false }, { seen: true });
    io.to(room).emit("messagesSeen", room);
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /messages/seen error:", err);
    res.status(500).json({ error: "Failed to mark as seen" });
  }
});

/**
 * 📬 PUT /api/messages/delivered/:room
 */
router.put("/delivered/:room", async (req, res) => {
  try {
    const { room } = req.params;
    await Message.updateMany({ room, delivered: false }, { delivered: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /messages/delivered error:", err);
    res.status(500).json({ error: "Failed to mark as delivered" });
  }
});

/**
 * 🧨 DELETE /api/messages/remove-user/:userId
 * Delete user + their chat messages completely (Admin only)
 */
router.delete("/remove-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.deleteMany({ room: userId });

    const User = require("../models/User");
    const deletedUser = await User.findByIdAndDelete(userId);

    res.json({
      ok: true,
      message: deletedUser
        ? "User and all their chats deleted successfully"
        : "User chats deleted (no user found)",
    });
  } catch (err) {
    console.error("DELETE /remove-user/:userId error:", err);
    res.status(500).json({ error: "Failed to delete user and chats" });
  }
});

/* 🧹 DELETE /api/messages/clear/:room
   Clears all messages in one chat room (keeps user account) */
router.delete("/clear/:room", async (req, res) => {
  try {
    const { room } = req.params;
    if (!room) return res.status(400).json({ error: "Missing room ID" });

    const result = await Message.deleteMany({ room });
    res.json({
      ok: true,
      message: `Cleared ${result.deletedCount} messages for room ${room}`,
    });
  } catch (err) {
    console.error("DELETE /messages/clear/:room error:", err);
    res.status(500).json({ error: "Failed to clear messages" });
  }
});

/* ❌ DELETE /api/messages/delete-room/:room
   Deletes all messages belonging to that chat room */
router.delete("/delete-room/:room", async (req, res) => {
  try {
    const { room } = req.params;
    if (!room) return res.status(400).json({ error: "Missing room ID" });

    const result = await Message.deleteMany({ room });
    res.json({
      ok: true,
      message: `Deleted chat room ${room} with ${result.deletedCount} messages`,
    });
  } catch (err) {
    console.error("DELETE /messages/delete-room/:room error:", err);
    res.status(500).json({ error: "Failed to delete chat room" });
  }
});

module.exports = router;
