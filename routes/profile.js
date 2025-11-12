const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * 👤 GET /api/profile/:userId
 * Fetch user profile (auto-create if missing)
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    let profile = await Profile.findOne({ userId });

    // 🆕 Auto-create a profile from user info if not found
    if (!profile) {
      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ error: "User not found" });

      profile = await Profile.create({
        userId,
        fullName: user.name || "",
        email: user.email || "",
        phone: "",
        optionalEmail: "",
        address: "",
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("GET /profile/:userId error:", err);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
});

/**
 * ✏️ PUT /api/profile/:userId
 * Update or create user profile
 */
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phone, optionalEmail, address } = req.body;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { fullName, email, phone, optionalEmail, address },
      { new: true, upsert: true } // create if missing
    );

    res.json({ ok: true, profile: updatedProfile });
  } catch (err) {
    console.error("PUT /profile/:userId error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
