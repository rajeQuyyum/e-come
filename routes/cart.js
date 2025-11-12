// routes/cart.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");

/**
 * 🛒 GET /api/cart/:userId
 * Get a specific user's cart with user and product info
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Populate both user info and products
    const cart = await Cart.findOne({ userId })
      .populate("userId", "name email") // show user info
      .populate("items.productId", "title price images"); // show product info

    if (!cart) {
      return res.json({ userId, items: [] });
    }

    res.json(cart);
  } catch (err) {
    console.error("GET /cart/:userId error", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 🧾 POST /api/cart/:userId
 * Create or update a user's cart
 * Expected body: { items: [{ productId, qty }] }
 */
router.post("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // create new cart
      cart = await Cart.create({ userId, items });
    } else {
      // update existing cart
      cart.items = items;
      await cart.save();
    }

    // ✅ Re-populate before returning
    cart = await Cart.findById(cart._id)
      .populate("userId", "name email")
      .populate("items.productId", "title price images");

    // ✅ Emit real-time socket update for the user
    try {
      const { io } = require("../server");
      const count = (items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
      io.to(userId).emit("cartCount", { userId, count });
    } catch (e) {
      console.warn("Could not emit socket cartCount:", e.message);
    }

    res.json(cart);
  } catch (err) {
    console.error("POST /cart/:userId error", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 🧾 GET /api/cart
 * Get ALL carts (for admin dashboard)
 * Shows each user's email/name + product details
 */
router.get("/", async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("userId", "name email")
      .populate("items.productId", "title price images");

    res.json(carts);
  } catch (err) {
    console.error("GET /cart error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
