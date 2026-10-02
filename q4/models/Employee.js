const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  department: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  basicSalary: { type: Number, required: true, min: 0 },
  hra: { type: Number, default: 0, min: 0 },
  allowances: { type: Number, default: 0, min: 0 },
  deductions: { type: Number, default: 0, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

employeeSchema.pre('validate', function () {
  this.netSalary = Number(this.basicSalary || 0) + Number(this.hra || 0)
    + Number(this.allowances || 0) - Number(this.deductions || 0);
  if (this.netSalary < 0) this.invalidate('deductions', 'Deductions cannot exceed gross salary.');
});

module.exports = mongoose.model('Employee', employeeSchema);