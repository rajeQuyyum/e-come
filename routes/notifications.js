const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

/**
 * GET /api/notifications/:userId
 * Get notifications for a user (includes 'all' and user-specific)
 */
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const all = await Notification.find({
      $or: [{ target: 'all' }, { target: userId }]
    }).sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.error('GET /notifications/:userId error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/notifications/read/:id
 * Mark notification as read by a user
 * Body: { userId }
 */
router.post('/read/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ error: 'Notification not found' });

    n.readBy = n.readBy || [];
    if (!n.readBy.includes(userId)) n.readBy.push(userId);
    await n.save();

    res.json(n);
  } catch (err) {
    console.error('POST /notifications/read/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * (Optional) POST /api/notifications
 * Create a notification and emit to sockets.
 * This is useful for non-admin systems too, but your admin route already creates/emit notifications.
 * Body: { title, body, target } // target = 'all' or specific userId
 */
router.post('/', async (req, res) => {
  try {
    const { title, body, target } = req.body;
    const n = await Notification.create({ title, body, target });

    // Emit via Socket.IO
    try {
      const { io } = require('../server');
      if (target === 'all') io.emit('notification', n);
      else io.to(target).emit('notification', n);
    } catch (e) {
      console.warn('Could not emit socket notification:', e.message);
    }

    res.json(n);
  } catch (err) {
    console.error('POST /notifications error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
