const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  from:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // sender
  type:     { type: String, enum: ['applyJob', 'applyEmployee', 'cvResponse', 'contact'], required: true },
  job:      { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  cv:       { type: String },
  match:    { type: Boolean, default: false },
  response: { type: String},
  coverLetter: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
