const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
require('dotenv').config();

const { sequelize, initializeDatabase } = require('./db');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize MySQL database and sync Sequelize models
async function startServer() {
  await initializeDatabase();
  try {
    await sequelize.sync();
    console.log('Database synced with Sequelize');
    const count = await Student.count();
    if (count === 0) {
      console.log('Seeding initial students...');
      await Student.bulkCreate([
        { rollNo: '101', name: 'Aarav Sharma', email: 'aarav@example.com', course: 'Computer Science', semester: 4, marks: 88.5 },
        { rollNo: '102', name: 'Diya Patel', email: 'diya@example.com', course: 'Information Technology', semester: 4, marks: 92.0 },
        { rollNo: '103', name: 'Rohan Verma', email: 'rohan@example.com', course: 'Electronics', semester: 6, marks: 75.0 }
      ]);
      console.log('Initial students seeded successfully');
    }
  } catch (err) {
    console.error('Sequelize sync error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Sequelize Student CRUD server running on port ${PORT}`);
  });
}

startServer();

// ----------------- CRUD ROUTES -----------------

// READ: Get all students (with optional search)
app.get('/api/students', async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { rollNo: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { course: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const students = await Student.findAll({
      where: whereClause,
      order: [['id', 'DESC']]
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: Get single student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE: Add new student
app.post('/api/students', async (req, res) => {
  try {
    const { rollNo, name, email, course, semester, marks } = req.body;
    if (!rollNo || !name || !email || !course) {
      return res.status(400).json({ error: 'Roll No, Name, Email, and Course are required' });
    }

    const newStudent = await Student.create({
      rollNo,
      name,
      email,
      course,
      semester: Number(semester) || 1,
      marks: Number(marks) || 0
    });

    res.status(201).json(newStudent);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Roll No already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: Edit existing student
app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { rollNo, name, email, course, semester, marks } = req.body;
    await student.update({
      rollNo: rollNo !== undefined ? rollNo : student.rollNo,
      name: name !== undefined ? name : student.name,
      email: email !== undefined ? email : student.email,
      course: course !== undefined ? course : student.course,
      semester: semester !== undefined ? Number(semester) : student.semester,
      marks: marks !== undefined ? Number(marks) : student.marks
    });

    res.json(student);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Roll No already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await student.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
