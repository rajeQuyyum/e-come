const express = require("express");
const Product = require("../models/Product");

module.exports = function (upload) {
  const router = express.Router();

  /**
   * 🖼️ POST /api/products
   * Create a new product (supports Cloudinary uploads)
   */
  router.post("/", upload.array("images", 6), async (req, res) => {
    try {
      const { title, description, price } = req.body;

      if (!title || !price) {
        return res.status(400).json({ error: "Title and price are required" });
      }

      // ✅ Cloudinary URLs instead of local paths
      const images = (req.files || []).map((f) => f.path);

      const product = await Product.create({ title, description, price, images });

      res.json(product);
    } catch (err) {
      console.error("POST /products error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  /**
   * 📦 GET /api/products
   * Fetch all products
   */
  router.get("/", async (req, res) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.json(products);
    } catch (err) {
      console.error("GET /products error:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  /**
   * 🔍 GET /api/products/:id
   * Fetch a single product by ID
   */
  router.get("/:id", async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error("GET /products/:id error:", err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  /**
   * ❌ DELETE /api/products/:id
   * Delete a product by ID
   */
  router.delete("/:id", async (req, res) => {
    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ error: "Product not found" });
      res.json({ ok: true, message: "Product deleted" });
    } catch (err) {
      console.error("DELETE /products/:id error:", err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  return router;
};
