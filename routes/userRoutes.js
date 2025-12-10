const express = require('express');
const { protect } = require('../middleware/auth');
const { getEmployees, applyEmployee } = require('../controllers/userController');
const router = express.Router();
const User = require('../models/User');


router.get('/',                  protect, getEmployees);
router.post('/:employeeId/apply', protect, applyEmployee);

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
