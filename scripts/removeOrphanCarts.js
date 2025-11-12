// scripts/removeOrphanCarts.js
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const User = require("../models/User");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://garalili20_db_user:sJUfPAnAGVbtrqQF@grail.mpgccht.mongodb.net/?appName=Grail";

(async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected!");

    const carts = await Cart.find();
    let deletedCount = 0;

    for (const cart of carts) {
      const user = await User.findById(cart.userId);
      if (!user) {
        console.log(`🗑️ Removing orphan cart ${cart._id} (user ${cart.userId} not found)`);
        await Cart.findByIdAndDelete(cart._id);
        deletedCount++;
      }
    }

    console.log(`\n✅ Done! Removed ${deletedCount} orphan cart(s).`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error cleaning carts:", err);
    process.exit(1);
  }
})();
