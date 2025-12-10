const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  company:     { type: String, required: true },
  location:    { type: String, required: true },
  contact:     { type: String, required: true },
  poster:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salary:      { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
  