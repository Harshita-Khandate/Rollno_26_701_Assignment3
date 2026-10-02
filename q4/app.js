require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'replace-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  } : undefined
}) : null;

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/login');
  next();
}

function employeeValues(body) {
  return {
    name: body.name,
    email: body.email,
    department: body.department,
    designation: body.designation,
    basicSalary: Number(body.basicSalary),
    hra: Number(body.hra || 0),
    allowances: Number(body.allowances || 0),
    deductions: Number(body.deductions || 0)
  };
}

app.get('/', (req, res) => res.redirect(req.session.admin ? '/employees' : '/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', (req, res) => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if (req.body.username !== username || req.body.password !== password) {
    return res.status(401).render('login', { error: 'Invalid username or password.' });
  }
  req.session.admin = username;
  res.redirect('/employees');
});

app.post('/logout', requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.redirect('/login');
  });
});

app.get('/employees', requireAdmin, async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.render('employees', { employees, message: req.query.message });
  } catch (error) {
    next(error);
  }
});

app.get('/employees/new', requireAdmin, (req, res) => {
  res.render('employee-form', { employee: null, error: null });
});

app.post('/employees', requireAdmin, async (req, res, next) => {
  const temporaryPassword = crypto.randomBytes(9).toString('base64url');
  try {
    const employee = new Employee({
      ...employeeValues(req.body),
      empid: `EMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      passwordHash: await bcrypt.hash(temporaryPassword, 12)
    });
    await employee.save();

    let message = 'Employee added.';
    if (mailer && process.env.SMTP_FROM) {
      try {
        await mailer.sendMail({
          from: process.env.SMTP_FROM,
          to: employee.email,
          subject: 'Your employee account',
          text: `Hello ${employee.name},\nYour employee ID is ${employee.empid}.\nYour temporary password is ${temporaryPassword}. Please change it after signing in.`
        });
        message += ' Login details emailed.';
      } catch (mailError) {
        console.error('Employee email could not be sent:', mailError.message);
        message += ' Email could not be sent; configure SMTP and contact the employee securely.';
      }
    } else {
      message += ' Email not sent because SMTP is not configured.';
    }
    res.redirect(`/employees?message=${encodeURIComponent(message)}`);
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).render('employee-form', { employee: req.body, error: error.message });
    }
    next(error);
  }
});

app.get('/employees/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.sendStatus(404);
    res.render('employee-form', { employee, error: null });
  } catch (error) {
    next(error);
  }
});

app.post('/employees/:id/update', requireAdmin, async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.sendStatus(404);
    Object.assign(employee, employeeValues(req.body));
    await employee.save();
    res.redirect('/employees?message=Employee%20updated.');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).render('employee-form', { employee: { ...req.body, _id: req.params.id }, error: error.message });
    }
    next(error);
  }
});

app.post('/employees/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect('/employees?message=Employee%20deleted.');
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send('Something went wrong. Check the server log.');
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI before starting the server.');
    process.exitCode = 1;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(port, () => console.log(`ERP admin running at http://localhost:${port}`));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exitCode = 1;
  }
}

start();