const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { getIO } = require("../socket"); // ✅ centralized socket instance

/**
 * 📨 GET /api/notifications/:userId
 * Fetch notifications for a specific user (includes global + personal)
 */
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const all = await Notification.find({
      $or: [{ target: "all" }, { target: userId }],
    }).sort({ createdAt: -1 });

    res.json(all);
  } catch (err) {
    console.error("GET /notifications/:userId error:", err);
    res.status(500).json({ error: "Server error fetching notifications" });
  }
});

/**
 * ✅ POST /api/notifications/read/:id
 * Mark a specific notification as read for a user
 * Body: { userId }
 */
router.post("/read/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "userId required" });

    const notification = await Notification.findById(id);
    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    notification.readBy = notification.readBy || [];
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.json(notification);
  } catch (err) {
    console.error("POST /notifications/read/:id error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * ✅ POST /api/notifications
 * Create and optionally emit a new notification
 * Body: { title, body, target } // target = "all" or specific userId
 */
router.post("/", async (req, res) => {
  try {
    const { title, body, target } = req.body;

    if (!title || !body)
      return res.status(400).json({ error: "Title and body are required" });

    const n = await Notification.create({ title, body, target });

    // ✅ Emit via centralized Socket.IO (safe & clean)
    try {
      const io = getIO();
      if (target === "all") io.emit("notification", n);
      else io.to(target).emit("notification", n);
    } catch (e) {
      console.warn("⚠️ Could not emit socket notification:", e.message);
    }

    res.json(n);
  } catch (err) {
    console.error("POST /notifications error:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
