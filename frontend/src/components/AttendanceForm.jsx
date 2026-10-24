import { useState } from 'react';
import { pct, riskOf, RISK_LABEL } from '../utils/attendance';
import { currentMonth } from '../utils/format';

export default function AttendanceForm({ initial, students, subjects, onSave, onCancel }) {
  const editing = Boolean(initial);
  const [form, setForm] = useState({
    student_id: initial?.student_id || '',
    subject_id: initial?.subject_id || '',
    month: initial ? initial.record_month.slice(0, 7) : '',
    held: initial ? String(initial.classes_held) : '',
    attended: initial ? String(initial.classes_attended) : '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const isNum = (v) => /^\d+$/.test(v);
  const heldN = isNum(form.held) ? Number(form.held) : NaN;
  const attN = isNum(form.attended) ? Number(form.attended) : NaN;
  const previewOk = heldN >= 1 && heldN <= 100 && attN >= 0 && attN <= heldN;
  const preview = previewOk ? pct(attN, heldN) : null;

  function validate() {
    const e = {};
    if (!form.student_id) e.student_id = 'Select a student.';
    if (!form.subject_id) e.subject_id = 'Select a subject.';
    if (!/^\d{4}-\d{2}$/.test(form.month)) e.month = 'Select a month.';
    else if (form.month > currentMonth()) e.month = 'Month cannot be in the future.';
    if (!isNum(form.held)) e.held = 'Enter a whole number.';
    else if (heldN < 1 || heldN > 100) e.held = 'Classes held must be between 1 and 100.';
    if (!isNum(form.attended)) e.attended = 'Enter a whole number.';
    else if (!isNaN(heldN) && attN > heldN) e.attended = 'Attended cannot be more than classes held.';
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
        subject_id: form.subject_id,
        record_month: form.month + '-01',
        classes_held: heldN,
        classes_attended: attN,
      });
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {serverError && <div className="alert-error">{serverError}</div>}

      <label>Student
        <select value={form.student_id} onChange={set('student_id')} disabled={editing}>
          <option value="">Select a student</option>
          {students.map((s) => (
            <option key={s.student_id} value={s.student_id}>{s.student_id} - {s.student_name}</option>
          ))}
        </select>
        {errors.student_id && <span className="field-error">{errors.student_id}</span>}
      </label>

      <div className="two-col">
        <label>Subject
          <select value={form.subject_id} onChange={set('subject_id')} disabled={editing}>
            <option value="">Select</option>
            {subjects.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select>
          {errors.subject_id && <span className="field-error">{errors.subject_id}</span>}
        </label>
        <label>Month
          <input type="month" value={form.month} max={currentMonth()} onChange={set('month')} disabled={editing} />
          {errors.month && <span className="field-error">{errors.month}</span>}
        </label>
      </div>

      <div className="two-col">
        <label>Classes held
          <input value={form.held} onChange={set('held')} inputMode="numeric" placeholder="e.g. 12" />
          {errors.held && <span className="field-error">{errors.held}</span>}
        </label>
        <label>Classes attended
          <input value={form.attended} onChange={set('attended')} inputMode="numeric" placeholder="e.g. 10" />
          {errors.attended && <span className="field-error">{errors.attended}</span>}
        </label>
      </div>

      {preview !== null && (
        <div className={'preview ' + riskOf(preview)}>
          Attendance for this record: <b>{preview.toFixed(1)}%</b> ({RISK_LABEL[riskOf(preview)]}, rule-based)
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary">{editing ? 'Save changes' : 'Add record'}</button>
      </div>
    </form>
  );
}
