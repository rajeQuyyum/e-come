const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    optionalEmail: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
