const nodemailer = require('nodemailer');

const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter;
if (isEmailConfigured) {
  // Use explicit SMTP configuration instead of 'service: gmail'
  // This works better with hosting platforms like Render
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log('❌ Email service configuration error:', error.message);
    } else {
      console.log('✅ Email service is ready to send messages');
    }
  });
}

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, verificationCode) => {
  if (!isEmailConfigured) {
    console.log('📧 Mock Email - Verification Code:', verificationCode);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - JobBoard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; text-align: center;">JobBoard Email Verification</h2>
        <p>Thank you for registering with JobBoard!</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account with JobBoard, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated email from JobBoard. Please do not reply.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetCode) => {
  if (!isEmailConfigured) {
    console.log('📧 Mock Email - Password Reset Code:', resetCode);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - JobBoard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; text-align: center;">JobBoard Password Reset</h2>
        <p>You requested a password reset for your JobBoard account.</p>
        <p>Your password reset code is:</p>
        <div style="background-color: #fef2f2; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #fecaca;">
          <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${resetCode}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated email from JobBoard. Please do not reply.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured
}; 