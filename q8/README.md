# Question 8: CRUD Operations for Student Collection using Sequelize (Express + Sequelize + React)

## Description
This project implements full CRUD (Create, Read, Update, Delete) operations for a Student collection using:
- **Express.js**: REST API server
- **Sequelize ORM**: Database models, validation, and queries (supports SQLite out-of-the-box and MySQL)
- **React**: Clean frontend interface with simple HTML tables and forms
- **Design**: Simple clean code, pure HTML, no external CSS.

## Features
- **Create**: Add student with Roll No, Name, Email, Course, Semester, and Marks.
- **Read**: View all students in a table, with real-time search filtering.
- **Update**: Edit existing student details and save changes.
- **Delete**: Remove a student record with confirmation.

## How to Run

### 1. Install Dependencies
Open terminal in `q8` folder:
```bash
npm install
cd client
npm install
cd ..
```

### 2. Start Application
From the `q8` directory:
```bash
npm run dev
```
- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:3001`
