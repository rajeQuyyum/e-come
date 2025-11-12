const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
title: String,
body: String,
target: String, // 'all' or userId
readBy: [String], // userIds who read
createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Notification', NotificationSchema);