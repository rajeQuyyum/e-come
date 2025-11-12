const express = require('express');
const Product = require('../models/Product');

module.exports = function(upload){
const router = express.Router();

// create product (multipart, images)
router.post('/', upload.array('images', 6), async (req, res) => {
const { title, description, price } = req.body;
const images = (req.files || []).map(f => `/uploads/${f.filename}`);
const p = await Product.create({ title, description, price, images });
res.json(p);
});

// list products
router.get('/', async (req, res) => {
const products = await Product.find();
res.json(products);
});

// get single
router.get('/:id', async (req, res)=>{
const p = await Product.findById(req.params.id);
res.json(p);
});

// delete
router.delete('/:id', async (req, res)=>{
await Product.findByIdAndDelete(req.params.id);
res.json({ ok: true });
});

return router;
}