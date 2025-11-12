const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");

// 🧭 GET user profile
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let profile = await Profile.findOne({ userId });

    // If no profile exists yet, create one using user data
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      profile = await Profile.create({
        userId,
        fullName: user.name || "",
        email: user.email || "",
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("GET /profile/:userId error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🧭 UPDATE (edit & save) profile
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phone, optionalEmail, address } = req.body;

    const updated = await Profile.findOneAndUpdate(
      { userId },
      { fullName, email, phone, optionalEmail, address },
      { new: true, upsert: true }
    );

    res.json({ ok: true, profile: updated });
  } catch (err) {
    console.error("PUT /profile/:userId error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
