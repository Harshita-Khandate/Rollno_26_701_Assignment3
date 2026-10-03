import { useState, useEffect } from 'react';

export default function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('1');
  const [marks, setMarks] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      const url = search ? `/api/students?search=${encodeURIComponent(search)}` : '/api/students';
      const res = await fetch(url);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRollNo('');
    setName('');
    setEmail('');
    setCourse('');
    setSemester('1');
    setMarks('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      rollNo,
      name,
      email,
      course,
      semester: Number(semester),
      marks: Number(marks) || 0
    };

    try {
      if (editingId) {
        // UPDATE
        const res = await fetch(`/api/students/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to update student');
        setMessage('Student updated successfully!');
      } else {
        // CREATE
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to add student');
        setMessage('Student added successfully!');
      }
      resetForm();
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setRollNo(student.rollNo);
    setName(student.name);
    setEmail(student.email);
    setCourse(student.course);
    setSemester(student.semester);
    setMarks(student.marks);
    setError('');
    setMessage(`Editing student: ${student.name}`);
  };

  const handleDelete = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      setMessage(`Student "${studentName}" deleted successfully`);
      fetchStudents();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Student Management System</h1>
      <h3>CRUD Operations using Sequelize (Express + Sequelize + React)</h3>

      {message && <p><b>Success:</b> {message}</p>}
      {error && <p><b>Error:</b> {error}</p>}
      <hr />

      {/* Form for Create / Update */}
      <fieldset>
        <legend><b>{editingId ? 'Edit Student Details' : 'Add New Student'}</b></legend>
        <form onSubmit={handleSubmit}>
          <p>
            <label>
              Roll Number:{' '}
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
              />
            </label>
            {'  '}
            <label>
              Name:{' '}
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {'  '}
            <label>
              Email:{' '}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </p>

          <p>
            <label>
              Course / Branch:{' '}
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </label>
            {'  '}
            <label>
              Semester:{' '}
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </label>
            {'  '}
            <label>
              Marks / Score:{' '}
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </label>
          </p>

          <p>
            <button type="submit">{editingId ? 'Update Student' : 'Add Student'}</button>
            {' '}
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
          </p>
        </form>
      </fieldset>

      <br />

      {/* Search Bar */}
      <div>
        <label>
          <b>Search Student:</b>{' '}
          <input
            type="text"
            placeholder="Search by Roll No, Name, Course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="35"
          />
        </label>
        {' '}
        {search && <button onClick={() => setSearch('')}>Clear Search</button>}
      </div>

      <br />

      {/* Student List Table */}
      <h3>Student Records Table</h3>
      {students.length === 0 ? (
        <p>No student records found.</p>
      ) : (
        <table border="1" cellPadding="5" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td><b>{student.rollNo}</b></td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.course}</td>
                <td>Sem {student.semester}</td>
                <td>{student.marks}</td>
                <td>
                  <button onClick={() => handleEdit(student)}>Edit</button>
                  {' '}
                  <button onClick={() => handleDelete(student.id, student.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
