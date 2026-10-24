import { useState } from 'react';

export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'ME', 'EE', 'CE'];

export default function StudentForm({ initial, defaultId, onSave, onCancel }) {
  const editing = Boolean(initial);
  const [form, setForm] = useState({
    student_id: initial?.student_id || defaultId || '',
    student_name: initial?.student_name || '',
    department: initial?.department || '',
    semester: initial?.semester ? String(initial.semester) : '',
    email: initial?.email || '',
    phone: initial?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!/^S[0-9]{4}$/.test(form.student_id)) e.student_id = 'Use the format S1234 (S followed by 4 digits).';
    const name = form.student_name.trim();
    if (name.length < 2) e.student_name = 'Enter the full name (at least 2 characters).';
    else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) e.student_name = 'Name can contain letters, spaces, . - and apostrophes only.';
    if (!DEPARTMENTS.includes(form.department)) e.department = 'Select a department.';
    const sem = Number(form.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) e.semester = 'Select a semester from 1 to 8.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits.';
    return e;
  }

  function submit(ev) {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      onSave({
        student_id: form.student_id,
        student_name: form.student_name.trim().replace(/\s+/g, ' '),
        department: form.department,
        semester: Number(form.semester),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {serverError && <div className="alert-error">{serverError}</div>}

      <label>Student ID
        <input value={form.student_id} onChange={set('student_id')} disabled={editing} placeholder="S1033" />
        {errors.student_id && <span className="field-error">{errors.student_id}</span>}
      </label>

      <label>Full name
        <input value={form.student_name} onChange={set('student_name')} placeholder="Student name" />
        {errors.student_name && <span className="field-error">{errors.student_name}</span>}
      </label>

      <div className="two-col">
        <label>Department
          <select value={form.department} onChange={set('department')}>
            <option value="">Select</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.department && <span className="field-error">{errors.department}</span>}
        </label>
        <label>Semester
          <select value={form.semester} onChange={set('semester')}>
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {errors.semester && <span className="field-error">{errors.semester}</span>}
        </label>
      </div>

      <label>Email (optional)
        <input type="email" value={form.email} onChange={set('email')} placeholder="student@college.edu" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>Phone (optional)
        <input value={form.phone} onChange={set('phone')} placeholder="10-digit number" inputMode="numeric" />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </label>

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary">{editing ? 'Save changes' : 'Add student'}</button>
      </div>
    </form>
  );
}
