// routes/admin.js
const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Notification = require("../models/Notification");

// ✅ ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: "Admin not found" });
    if (admin.password !== password)
      return res.status(401).json({ error: "Invalid password" });

    res.json({
      ok: true,
      admin: { id: admin._id, username: admin.username },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// ✅ ADMIN AUTH CHECK
async function checkAdmin(req, res, next) {
  try {
    const pw = req.headers["x-admin-password"];
    if (!pw)
      return res.status(401).json({ error: "Missing admin password header" });

    const admin = await Admin.findOne({ password: pw });
    if (!admin)
      return res.status(403).json({ error: "Invalid admin password" });

    req.admin = admin;
    next();
  } catch (err) {
    console.error("checkAdmin error:", err);
    res.status(500).json({ error: "Server error verifying admin" });
  }
}

// ✅ GET ALL USERS
router.get("/users", checkAdmin, async (req, res) => {
  try {
    const users = await User.find().select("_id name email");
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ DELETE USER BY ID (full cleanup)
router.delete("/users/:userId", checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === "undefined") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // 1️⃣ Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ Delete the user’s cart
    await Cart.deleteOne({ userId });

    // 3️⃣ Delete all chat messages for this user
    const Message = require("../models/Message");
    await Message.deleteMany({ room: userId });

    // 4️⃣ Delete all notifications targeted at this user
    await Notification.deleteMany({ target: userId });

    // Optional socket broadcast to notify live admin panels
    try {
      const { io } = require("../server");
      io.emit("userDeleted", { userId });
    } catch (e) {
      console.warn("Socket emission skipped:", e.message);
    }

    res.json({
      ok: true,
      message:
        "User, their cart, chats, and notifications deleted successfully",
    });
  } catch (err) {
    console.error("DELETE /users/:userId error:", err);
    res.status(500).json({ error: "Failed to delete user and associated data" });
  }
});

// ✅ GET ALL CARTS
router.get("/carts", checkAdmin, async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("userId", "_id name email")
      .populate("items.productId", "title price images");
    res.json(carts);
  } catch (err) {
    console.error("Get carts error:", err);
    res.status(500).json({ error: "Failed to fetch carts" });
  }
});

// ✅ DELETE CART BY USER ID
router.delete("/cart/:userId", checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await Cart.findOneAndDelete({ userId });
    if (!deleted)
      return res.status(404).json({ error: "Cart not found" });

    res.json({ ok: true, message: "Cart deleted successfully" });
  } catch (err) {
    console.error("DELETE /cart/:userId error:", err);
    res.status(500).json({ error: "Failed to delete cart" });
  }
});

// ✅ CREATE (SEND) NOTIFICATION
router.post("/notify", checkAdmin, async (req, res) => {
  try {
    const { title, body, target } = req.body;
    if (!title || !body)
      return res.status(400).json({ error: "Missing title or body" });

    const n = await Notification.create({ title, body, target });

    // Optional socket broadcast
    try {
      const { io } = require("../server");
      if (target === "all") io.emit("notification", n);
      else io.to(target).emit("notification", n);
    } catch (e) {
      console.warn("Socket emission skipped:", e.message);
    }

    res.json({ ok: true, notification: n });
  } catch (err) {
    console.error("Send notification error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// ✅ GET ALL NOTIFICATIONS
router.get("/notify", checkAdmin, async (req, res) => {
  try {
    const list = await Notification.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ✅ UPDATE NOTIFICATION
router.put("/notify/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, target } = req.body;
    const updated = await Notification.findByIdAndUpdate(
      id,
      { title, body, target },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ ok: true, notification: updated });
  } catch (err) {
    console.error("Update notification error:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// ✅ DELETE NOTIFICATION
router.delete("/notify/:id", checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ ok: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;
