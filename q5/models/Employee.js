const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  basicSalary: Number,
  hra: Number,
  allowances: Number,
  deductions: Number,
  netSalary: Number,
  passwordHash: { type: String, required: true, select: false }
}, { collection: 'employees' });

module.exports = mongoose.model('Employee', employeeSchema);