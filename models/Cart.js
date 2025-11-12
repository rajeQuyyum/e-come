const mongoose = require('mongoose');
const CartSchema = new mongoose.Schema({
userId: { type: mongoose.Types.ObjectId, ref: 'User' },
items: [{ productId: { type: mongoose.Types.ObjectId, ref: 'Product' }, qty: Number }],
status: { type: String, default: 'open' },
createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Cart', CartSchema);