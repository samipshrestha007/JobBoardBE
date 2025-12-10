// server/controllers/notificationController.js
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Replace markAsRead with a true delete:
exports.deleteNotification = async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
