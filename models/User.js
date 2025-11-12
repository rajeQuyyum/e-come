const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
name: String,
email: { type: String, unique: true, required: true },
password: String,
cart: [{ productId: mongoose.Types.ObjectId, qty: Number }]
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);