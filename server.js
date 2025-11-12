// ✅ IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();
const { initSocket } = require("./socket"); // ✅ NEW import

// ✅ ROUTES
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const notifRoutes = require("./routes/notifications");
const msgRoutes = require("./routes/messages");
const profileRoutes = require("./routes/profile");

// ✅ MONGODB CONNECTION
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("🔁 Retrying connection in 10 seconds...");
    setTimeout(connectDB, 10000);
  }
}
connectDB();

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected — retrying...");
  setTimeout(connectDB, 10000);
});

process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled Rejection:", reason);
});

// ✅ EXPRESS APP + SERVER
const app = express();
const server = http.createServer(app);
const io = initSocket(server); // ✅ Initialize socket here

// ✅ CREATE UPLOAD FOLDERS
const chatUploadPath = path.join(__dirname, "uploads/chat");
if (!fs.existsSync(chatUploadPath)) {
  fs.mkdirSync(chatUploadPath, { recursive: true });
}

// ✅ MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MULTER SETUP (for product uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ API ROUTES
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);
app.use("/api/products", productRoutes(upload));
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/notifications", notifRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/profile", profileRoutes);

// ✅ SOCKET.IO HANDLERS
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`👥 Joined room: ${room}`);
  });

  socket.on("typing", (data) => socket.to(data.room).emit("typing", data));
  socket.on("stopTyping", (data) => socket.to(data.room).emit("stopTyping", data));

  socket.on("sendMessage", (payload) => {
    io.to(payload.toRoom).emit("receiveMessage", payload);
  });

  socket.on("markSeen", async (room) => {
    console.log(`👁️ Marking messages as seen in room: ${room}`);
    try {
      const Message = require("./models/Message");
      await Message.updateMany(
        { room, $or: [{ seen: false }, { seen: { $exists: false } }] },
        { $set: { seen: true } }
      );
      io.to(room).emit("messagesSeen", room);
      console.log(`✅ Messages in ${room} marked as seen`);
    } catch (err) {
      console.error("❌ Error marking messages as seen:", err);
    }
  });

  socket.on("sendNotification", (payload) => {
    if (payload.target === "all") io.emit("notification", payload);
    else io.to(payload.target).emit("notification", payload);
  });

  socket.on("cartUpdated", (payload) => {
    io.to(payload.userId).emit("cartCount", payload);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
