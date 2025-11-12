const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
title: String,
description: String,
price: Number,
images: [String],
createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Product', ProductSchema);