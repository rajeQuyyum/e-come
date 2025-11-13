const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  images: [String],

  // ⭐ NEW FIELD: number of available items
  stock: {
    type: Number,
    default: 0,
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
