// server/routes/notificationRoutes.js
const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

// List
router.get('/',          protect, getNotifications);

router.post('/respond/:id', protect, async (req, res) => {
  try {
    const { response } = req.body;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Original notification not found' });
    }

    // 1. Save response in original notification (for record-keeping)
    notification.response = response;
    await notification.save();

    // 2. Create a new notification for the applicant (job seeker)
    const responseNotification = await Notification.create({
      user: notification.from, // job seeker
      from: req.user.id,       // employer
      type: 'cvResponse',
      job: notification.job,
      message: response,
    });

    res.status(200).json({ original: notification, response: responseNotification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send response' });
  }
});
// **Delete** instead of PUT
router.delete('/:id',    protect, deleteNotification);

module.exports = router;
