const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: String, // user<->admin room id
  from: String,
  text: String,
  image: String,
  delivered: { type: Boolean, default: false },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
