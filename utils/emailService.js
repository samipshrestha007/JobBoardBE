const nodemailer = require('nodemailer');

const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter;
let emailServiceAvailable = false;

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
    connectionTimeout: 20000, // 20 seconds (increased)
    greetingTimeout: 20000,
    socketTimeout: 20000,
    // Add retry logic
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  });

  // Verify connection configuration (async, don't block startup)
  transporter.verify(function (error, success) {
    if (error) {
      console.log('❌ Email service configuration error:', error.message);
      console.log('⚠️  Email service will fall back to mock mode');
      console.log('💡 Tip: Consider using a transactional email service (Brevo/SendGrid) for better reliability');
      emailServiceAvailable = false;
    } else {
      console.log('✅ Email service is ready to send messages');
      emailServiceAvailable = true;
    }
  });
}

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, verificationCode) => {
  if (!isEmailConfigured || !emailServiceAvailable) {
    console.log('📧 Mock Email - Verification Code for', email + ':', verificationCode);
    console.log('⚠️  Check Render logs above to see the verification code');
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    // Add timeout wrapper
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), 15000)
    );
    
    await Promise.race([sendPromise, timeoutPromise]);
    console.log('✅ Verification email sent successfully to', email);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('📧 Falling back to mock mode - Verification Code for', email + ':', verificationCode);
    console.log('⚠️  Check Render logs to see verification codes');
    // Fallback to mock mode - don't fail the request
    return true;
  }
};

const sendPasswordResetEmail = async (email, resetCode) => {
  if (!isEmailConfigured || !emailServiceAvailable) {
    console.log('📧 Mock Email - Password Reset Code for', email + ':', resetCode);
    console.log('⚠️  Check Render logs above to see the reset code');
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    // Add timeout wrapper
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), 15000)
    );
    
    await Promise.race([sendPromise, timeoutPromise]);
    console.log('✅ Password reset email sent successfully to', email);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('📧 Falling back to mock mode - Password Reset Code for', email + ':', resetCode);
    console.log('⚠️  Check Render logs to see reset codes');
    // Fallback to mock mode - don't fail the request
    return true;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured
}; 