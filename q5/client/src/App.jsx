import { useEffect, useState } from 'react'

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  const text = await response.text()
  let result = {}
  try {
    result = text ? JSON.parse(text) : {}
  } catch {
    result = { message: text || 'Backend returned an empty or invalid response. Ensure server is running.' }
  }
  if (!response.ok) throw new Error(result.message || 'Request failed.')
  return result
}

function today() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function Login({ onLogin }) {
  const [empid, setEmpid] = useState('EMP001')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ empid, password }) })
      onLogin(result.employee)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Employee login</h1>
      <p><b>Hardcoded / Default Credentials:</b><br />Employee ID: <code>EMP001</code> | Password: <code>admin123</code></p>
      <form onSubmit={submit}>
        <p><label>Employee ID <input value={empid} onChange={(event) => setEmpid(event.target.value)} required /></label></p>
        <p><label>Password <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label></p>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        <button disabled={busy}>{busy ? 'Signing in...' : 'Login'}</button>
      </form>
    </main>
  )
}

function App() {
  const [employee, setEmployee] = useState(null)
  const [page, setPage] = useState('profile')
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [leaveForm, setLeaveForm] = useState({ date: today(), reason: '', grant: 'No' })

  useEffect(() => {
    let active = true
    api('/api/employee/profile').then(({ employee: current }) => {
      if (active) setEmployee(current)
    }).catch(() => {
      if (active) setEmployee(null)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!employee) return
    let active = true
    api('/api/leaves').then(({ leaves: current }) => {
      if (active) setLeaves(current)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    })
    return () => { active = false }
  }, [employee])

  async function addLeave(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { leave } = await api('/api/leaves', { method: 'POST', body: JSON.stringify(leaveForm) })
      setLeaves((current) => [leave, ...current])
      setLeaveForm({ date: today(), reason: '', grant: 'No' })
      setNotice('Leave application added.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setEmployee(null)
    setLeaves([])
    setPage('profile')
  }

  if (loading) return <main><p>Loading employee portal...</p></main>
  if (!employee) return <Login onLogin={(current) => { setEmployee(current); setError(''); setNotice('') }} />

  const currency = (value) => value == null ? 'Not provided' : Number(value).toLocaleString(undefined, { style: 'currency', currency: 'INR' })

  return (
    <main>
      <header>
        <h1>Employee portal</h1>
        <p>Signed in as {employee.name} ({employee.empid})</p>
        <button onClick={logout}>Logout</button>
      </header>
      <nav aria-label="Pages">
        <button onClick={() => setPage('profile')}>Page 1: Profile</button>{' '}
        <button onClick={() => setPage('leave')}>Page 2: Leave applications</button>
      </nav>
      {error && <p role="alert">{error}</p>}
      {page === 'profile' ? <section>
        <h2>Employee profile</h2>
        <dl>
          <dt>Employee ID</dt><dd>{employee.empid}</dd>
          <dt>Name</dt><dd>{employee.name}</dd>
          <dt>Email</dt><dd>{employee.email}</dd>
          <dt>Department</dt><dd>{employee.department}</dd>
          <dt>Designation</dt><dd>{employee.designation}</dd>
          <dt>Net salary</dt><dd>{currency(employee.netSalary)}</dd>
        </dl>
      </section> : <section>
        <h2>Application for leave</h2>
        {notice && <p role="status">{notice}</p>}
        <form onSubmit={addLeave}>
          <p><label>Date <input type="date" value={leaveForm.date} onChange={(event) => setLeaveForm({ ...leaveForm, date: event.target.value })} required /></label></p>
          <p><label>Reason <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} maxLength={500} required /></label></p>
          <p><label>Grant <select value={leaveForm.grant} onChange={(event) => setLeaveForm({ ...leaveForm, grant: event.target.value })}><option value="No">No</option><option value="Yes">Yes</option></select></label></p>
          <button disabled={busy}>{busy ? 'Adding...' : 'Add application'}</button>
        </form>
        <h2>My applications</h2>
        {leaves.length === 0 ? <p>No leave applications.</p> : <ul>{leaves.map((leave) => <li key={leave._id}>{new Date(leave.date).toLocaleDateString()} - {leave.reason} - Grant: {leave.grant}</li>)}</ul>}
      </section>}
    </main>
  )
}

export default App
