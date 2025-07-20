const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  issueType: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  busNumber: { type: String },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Problem', problemSchema); 