require('dotenv').config();

const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const LeaveRequest = require('./models/LeaveRequest');

const app = express();
const port = Number(process.env.API_PORT || 4001);
const tokenCookie = 'employee_token';
const demoMode = process.env.NODE_ENV !== 'production';
const demoPassword = 'admin123';
const demoEmployee = {
  empid: 'EMP001',
  name: 'Demo Employee',
  email: 'employee@example.com',
  department: 'General',
  designation: 'Employee',
  netSalary: 25000
};
const demoLeaves = [];
const jwtSecret = process.env.JWT_SECRET || (demoMode ? 'q5-development-only-secret' : null);
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/'
};

app.use(express.json());
app.use(cookieParser());

function requireEmployee(req, res, next) {
  const token = req.cookies[tokenCookie];
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  try {
    req.employeeEmpid = jwt.verify(token, jwtSecret).sub;
    next();
  } catch {
    res.clearCookie(tokenCookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.status(401).json({ message: 'Your session expired. Please log in again.' });
  }
}

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const empid = String(req.body.empid || '').trim().toUpperCase();
    const password = String(req.body.password || '');
    if (demoMode && empid === demoEmployee.empid && password === demoPassword) {
      const token = jwt.sign({ sub: demoEmployee.empid }, jwtSecret, { expiresIn: '8h' });
      res.cookie(tokenCookie, token, cookieOptions);
      return res.json({ employee: demoEmployee });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'MongoDB is unavailable. Use the development demo login.' });
    }
    const employee = await Employee.findOne({ empid }).select('+passwordHash');
    if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) {
      return res.status(401).json({ message: 'Employee ID or password is incorrect.' });
    }
    const token = jwt.sign({ sub: employee.empid }, jwtSecret, { expiresIn: '8h' });
    res.cookie(tokenCookie, token, cookieOptions);
    const publicEmployee = employee.toObject();
    delete publicEmployee.passwordHash;
    res.json({ employee: publicEmployee });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(tokenCookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  res.json({ message: 'Logged out.' });
});

app.get('/api/employee/profile', requireEmployee, async (req, res, next) => {
  if (demoMode && req.employeeEmpid === demoEmployee.empid) {
    return res.json({ employee: demoEmployee });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is unavailable.' });
  }
  try {
    const employee = await Employee.findOne({ empid: req.employeeEmpid });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ employee });
  } catch (error) {
    next(error);
  }
});

app.get('/api/leaves', requireEmployee, async (req, res, next) => {
  if (demoMode && req.employeeEmpid === demoEmployee.empid) {
    return res.json({ leaves: demoLeaves });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is unavailable.' });
  }
  try {
    const leaves = await LeaveRequest.find({ employeeEmpid: req.employeeEmpid })
      .sort({ date: -1, createdAt: -1 });
    res.json({ leaves });
  } catch (error) {
    next(error);
  }
});

app.post('/api/leaves', requireEmployee, async (req, res, next) => {
  const { date, reason, grant } = req.body;
  if (!date || Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Enter a valid leave date.' });
  }
  if (!String(reason || '').trim()) {
    return res.status(400).json({ message: 'Enter a reason for your leave.' });
  }
  if (!['Yes', 'No'].includes(grant)) {
    return res.status(400).json({ message: 'Choose Yes or No for leave granted.' });
  }
  if (demoMode && req.employeeEmpid === demoEmployee.empid) {
    const leave = {
      _id: `${Date.now()}`,
      employeeEmpid: demoEmployee.empid,
      date: new Date(`${date}T00:00:00.000Z`),
      reason: String(reason).trim(),
      grant
    };
    demoLeaves.unshift(leave);
    return res.status(201).json({ leave });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is unavailable.' });
  }
  try {
    const leave = await LeaveRequest.create({
      employeeEmpid: req.employeeEmpid,
      date: new Date(`${date}T00:00:00.000Z`),
      reason: String(reason).trim(),
      grant
    });
    res.status(201).json({ leave });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

async function start() {
  if (!jwtSecret) {
    console.error('Set JWT_SECRET before starting in production.');
    process.exitCode = 1;
    return;
  }
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
      if (!demoMode) {
        console.error('Could not connect to MongoDB:', error.message);
        process.exitCode = 1;
        return;
      }
      console.warn('MongoDB unavailable; development demo login enabled.');
    }
  } else if (!demoMode) {
    console.error('Set MONGODB_URI before starting in production.');
    process.exitCode = 1;
    return;
  }
  app.listen(port, () => console.log(`Employee API listening on http://localhost:${port}`));
}

start();