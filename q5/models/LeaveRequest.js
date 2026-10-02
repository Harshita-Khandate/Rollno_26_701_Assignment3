const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeEmpid: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  grant: { type: String, enum: ['Yes', 'No'], required: true, default: 'No' }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);