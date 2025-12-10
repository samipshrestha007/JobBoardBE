// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Email verification routes
router.post('/send-verification', authController.sendVerificationCode);
router.post('/verify-email', authController.verifyEmailAndRegister);
router.post('/resend-verification', authController.resendVerificationCode);
router.post('/check-code', authController.checkVerificationCode);

// Forgot password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Auth routes
router.post('/login', authController.login);

module.exports = router;
