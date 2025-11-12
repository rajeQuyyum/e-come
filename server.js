// ✅ IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const fs = require("fs");
const multer = require("multer");
const { Server } = require("socket.io");
require("dotenv").config();


// ✅ ROUTES
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const notifRoutes = require("./routes/notifications");
const msgRoutes = require("./routes/messages");
const profileRoutes = require("./routes/profile");


// ✅ MONGODB CONNECTION STRING
const MONGO_URI = process.env.MONGO_URI;

// ✅ SAFE MONGODB CONNECTION FUNCTION
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // ⏳ Wait max 5s for MongoDB
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("🔁 Retrying connection in 10 seconds...");
    setTimeout(connectDB, 10000); // 🔁 Retry after 10 seconds
  }
}

connectDB();

// 🔌 Reconnect if MongoDB disconnects
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected — retrying...");
  setTimeout(connectDB, 10000);
});

// 🚨 Prevent app crash on unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled Rejection:", reason);
});

// ✅ EXPRESS APP + SERVER
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ✅ MAKE IO AVAILABLE TO OTHER ROUTES
module.exports.io = io;

// ✅ CREATE UPLOAD FOLDERS IF THEY DON'T EXIST
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
app.use("/admin", adminRoutes); // 👈 alias for compatibility
app.use("/api/products", productRoutes(upload));
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/notifications", notifRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/profile", profileRoutes);



// ✅ SOCKET.IO REAL-TIME HANDLERS
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // ✅ Join user/admin to their own room
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`👥 Joined room: ${room}`);
  });

  // ✅ Handle typing events
  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data);
  });

  socket.on("stopTyping", (data) => {
    socket.to(data.room).emit("stopTyping", data);
  });

  // ✅ Send new chat message (text/image)
  socket.on("sendMessage", (payload) => {
    io.to(payload.toRoom).emit("receiveMessage", payload);
  });

  // ✅ Mark all messages in a room as seen
  socket.on("markSeen", async (room) => {
    console.log(`👁️ Marking messages as seen in room: ${room}`);

    try {
      // Import your Message model
      const Message = require("./models/Message");

      // 1️⃣ Update DB
      await Message.updateMany(
  { room, $or: [{ seen: false }, { seen: { $exists: false } }] },
  { $set: { seen: true } }
);

      // 2️⃣ Notify the user’s room that messages were seen
      io.to(room).emit("messagesSeen", room);

      console.log(`✅ Messages in ${room} marked as seen`);
    } catch (err) {
      console.error("❌ Error marking messages as seen:", err);
    }
  });

  // ✅ Send notification
  socket.on("sendNotification", (payload) => {
    if (payload.target === "all") io.emit("notification", payload);
    else io.to(payload.target).emit("notification", payload);
  });

  // ✅ Handle cart updates
  socket.on("cartUpdated", (payload) => {
    io.to(payload.userId).emit("cartCount", payload);
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});


// ✅ START SERVER
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
