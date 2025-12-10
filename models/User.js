const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['employer','jobseeker'], default: 'jobseeker' },
  contact:  { type: String, required: true },
  position: {
    type: String,
    required: function() { return this.role === 'jobseeker'; }
  },
  yearsOfExperience: {
    type: Number,
    required: function() { return this.role === 'jobseeker'; },
    min: 0
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
