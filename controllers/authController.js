const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { generateVerificationCode, sendVerificationEmail, isEmailConfigured, sendPasswordResetEmail } = require('../utils/emailService');

// Step 1: Send verification code
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // If user exists but not verified, update the verification code
    if (existingUser && !existingUser.isEmailVerified) {
      existingUser.emailVerificationCode = verificationCode;
      existingUser.emailVerificationExpires = expiresAt;
      await existingUser.save();
    } else {
      // Store verification code in temporary user document
      // Use 'employer' role to avoid validation errors for jobseeker fields
      await User.create({
        email,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt,
        name: 'temp', // temporary placeholder
        password: 'temp', // temporary placeholder
        contact: 'temp', // temporary placeholder
        role: 'employer' // temporary role to avoid validation errors
      });
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Log if using mock email service
    if (!isEmailConfigured) {
      console.log('⚠️  Using mock email service. Check server console for verification code.');
    }

    res.json({ 
      message: 'Verification code sent to your email',
      mockMode: !isEmailConfigured 
    });
  } catch (err) {
    console.error('Send verification error:', err);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Step 2: Verify email and complete registration
exports.verifyEmailAndRegister = async (req, res) => {
  const { 
    email, 
    verificationCode, 
    name, 
    password, 
    role, 
    contact, 
    position, 
    yearsOfExperience 
  } = req.body;

  // basic validation
  if (!contact?.trim()) {
    return res.status(400).json({ error: 'Contact number is required' });
  }
  if (role === 'jobseeker') {
    if (!position?.trim()) {
      return res.status(400).json({ error: 'Position is required for job seekers' });
    }
    if (yearsOfExperience == null) {
      return res.status(400).json({ error: 'Years of experience is required' });
    }
  }

  try {
    // Find user with verification code
    const user = await User.findOne({ 
      email, 
      emailVerificationCode: verificationCode,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with actual data
    user.name = name;
    user.password = hashedPassword;
    user.role = role;
    user.contact = contact;
    user.position = role === 'jobseeker' ? position.trim() : undefined;
    user.yearsOfExperience = role === 'jobseeker' ? Number(yearsOfExperience) : undefined;
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Resend verification code
exports.resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Log if using mock email service
    if (!isEmailConfigured) {
      console.log('⚠️  Using mock email service. Check server console for verification code.');
    }

    res.json({ 
      message: 'Verification code resent to your email',
      mockMode: !isEmailConfigured 
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update checkVerificationCode to handle both verification and reset codes
exports.checkVerificationCode = async (req, res) => {
  const { email, verificationCode, type } = req.body;
  try {
    let user;
    if (type === 'reset') {
      user = await User.findOne({
        email,
        passwordResetCode: verificationCode,
        passwordResetExpires: { $gt: new Date() }
      });
    } else {
      user = await User.findOne({
        email,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: { $gt: new Date() }
      });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    return res.json({ message: 'Code is valid' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Forgot Password: Send reset code
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists and is verified
    const user = await User.findOne({ email, isEmailVerified: true });
    if (!user) {
      return res.status(404).json({ error: 'No verified account found with this email' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store reset code in user document
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetCode);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    // Log if using mock email service
    if (!isEmailConfigured) {
      console.log('⚠️  Using mock email service. Check server console for password reset code.');
    }

    res.json({ 
      message: 'Password reset code sent to your email',
      mockMode: !isEmailConfigured 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
};

// Reset Password: Verify code and update password
exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find user with valid reset code
    const user = await User.findOne({ 
      email, 
      passwordResetCode: resetCode,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
