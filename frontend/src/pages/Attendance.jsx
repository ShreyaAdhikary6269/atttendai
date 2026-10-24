import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, CheckCircle2,
  ClipboardList, Percent, AlertTriangle, BookOpen,
} from 'lucide-react';
import { useData, attKey } from '../context/DataContext';
import { pct, riskOf } from '../utils/attendance';
import { monthLabel } from '../utils/format';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import AttendanceForm from '../components/AttendanceForm';
import { DEPARTMENTS } from '../components/StudentForm';

const PAGE_SIZE = 12;
const f1 = (n) => n.toFixed(1);

export default function Attendance() {
  const navigate = useNavigate();
  const { students, subjects, attendance, addAttendance, updateAttendance, deleteAttendance } = useData();

  const [tab, setTab] = useState('overview');
  const [month, setMonth] = useState('');
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [subject, setSubject] = useState('');
  const [belowOnly, setBelowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'delete', record }
  const [toast, setToast] = useState('');

  const months = useMemo(
    () => [...new Set(attendance.map((a) => a.record_month))].sort().reverse(),
    [attendance]
  );
  const studentMap = useMemo(() => new Map(students.map((s) => [s.student_id, s])), [students]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.subject_id, s])), [subjects]);

  const inView = useMemo(
    () => attendance.filter((a) => !month || a.record_month === month),
    [attendance, month]
  );

  // One row per student with subject-wise and overall totals
  const base = useMemo(() => {
    const by = new Map();
    inView.forEach((a) => {
      let e = by.get(a.student_id);
      if (!e) { e = { held: 0, att: 0, subj: {} }; by.set(a.student_id, e); }
      e.held += a.classes_held;
      e.att += a.classes_attended;
      const s = e.subj[a.subject_id] || { held: 0, att: 0 };
      s.held += a.classes_held;
      s.att += a.classes_attended;
      e.subj[a.subject_id] = s;
    });
    return students
      .map((s) => {
        const e = by.get(s.student_id);
        return { ...s, has: Boolean(e), overall: e ? pct(e.att, e.held) : null, subj: e ? e.subj : {} };
      })
      .sort((a, b) => a.student_id.localeCompare(b.student_id));
  }, [students, inView]);

  const stats = useMemo(() => {
    const held = inView.reduce((t, a) => t + a.classes_held, 0);
    const att = inView.reduce((t, a) => t + a.classes_attended, 0);
    let belowStudents = 0;
    let belowSubjects = 0;
    base.forEach((r) => {
      if (r.has && r.overall < 75) belowStudents += 1;
      Object.values(r.subj).forEach((s) => { if (pct(s.att, s.held) < 75) belowSubjects += 1; });
    });
    return { records: inView.length, overall: held > 0 ? pct(att, held) : null, belowStudents, belowSubjects };
  }, [inView, base]);

  const q = query.trim().toLowerCase();
  const matchesStudent = (s) =>
    s && (!dept || s.department === dept) &&
    (!q || s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));

  const matrix = useMemo(
    () => base.filter((r) => matchesStudent(r)).filter((r) => !belowOnly || (r.has && r.overall < 75)),
    [base, q, dept, belowOnly]
  );

  const records = useMemo(
    () =>
      inView
        .filter((a) => !subject || a.subject_id === subject)
        .filter((a) => matchesStudent(studentMap.get(a.student_id)))
        .filter((a) => !belowOnly || pct(a.classes_attended, a.classes_held) < 75)
        .sort(
          (a, b) =>
            b.record_month.localeCompare(a.record_month) ||
            a.student_id.localeCompare(b.student_id) ||
            a.subject_id.localeCompare(b.subject_id)
        ),
    [inView, subject, q, dept, belowOnly, studentMap]
  );

  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = records.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleSave(values) {
    if (modal.type === 'add') {
      addAttendance(values);
      showToast('Attendance record added.');
    } else {
      updateAttendance(attKey(modal.record), values);
      showToast('Attendance record updated.');
    }
    setModal(null);
  }

  function handleDelete() {
    deleteAttendance(attKey(modal.record));
    setModal(null);
    showToast('Attendance record deleted.');
  }

  const cellClass = (p) => 'pc ' + riskOf(p);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-sub">Record classes held and attended. Percentages are calculated automatically. Showing demo data.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setModal({ type: 'add' })}>
          <Plus size={18} /> Add Record
        </button>
      </div>

      <div className="stat-grid">
        <StatCard icon={ClipboardList} label="Records" value={stats.records}
          note={month ? monthLabel(month) : 'All months'} />
        <StatCard icon={Percent} label="Overall Attendance"
          value={stats.overall === null ? '-' : f1(stats.overall) + '%'} note="Classes attended / held" />
        <StatCard icon={AlertTriangle} tone="red" label="Students Below 75%" value={stats.belowStudents}
          note="By overall attendance" />
        <StatCard icon={BookOpen} tone="red" label="Subject Entries Below 75%" value={stats.belowSubjects}
          note="Student and subject pairs" />
      </div>

      <div className="card">
        <div className="tabs">
          <button className={'tab' + (tab === 'overview' ? ' active' : '')} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={'tab' + (tab === 'records' ? ' active' : '')} onClick={() => { setTab('records'); setPage(1); }}>
            All records
          </button>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input value={query} onChange={onFilter(setQuery)} placeholder="Search by name or student ID" />
          </div>
          <select value={month} onChange={onFilter(setMonth)}>
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select value={dept} onChange={onFilter(setDept)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {tab === 'records' && (
            <select value={subject} onChange={onFilter(setSubject)}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
            </select>
          )}
          <label className="check-label">
            <input type="checkbox" checked={belowOnly}
              onChange={(e) => { setBelowOnly(e.target.checked); setPage(1); }} />
            Below 75% only
          </label>
        </div>

        <p className="note-line">
          Red is below 75% (High Risk), amber is 75% to 84% (Monitor). These are rule-based percentages, not ML predictions.
        </p>

        {tab === 'overview' && (
          <div className="table-wrap">
            <table className="table matrix">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Dept</th>
                  {subjects.map((s) => <th key={s.subject_id}>{s.subject_name}</th>)}
                  <th>Overall</th><th></th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((r) => (
                  <tr key={r.student_id}>
                    <td>{r.student_id}</td>
                    <td><b>{r.student_name}</b></td>
                    <td>{r.department}</td>
                    {subjects.map((s) => {
                      const v = r.subj[s.subject_id];
                      if (!v) return <td key={s.subject_id} className="pc none">-</td>;
                      const p = pct(v.att, v.held);
                      return <td key={s.subject_id} className={cellClass(p)}>{f1(p)}%</td>;
                    })}
                    {r.has
                      ? <td className={cellClass(r.overall) + ' overall'}>{f1(r.overall)}%</td>
                      : <td className="pc none overall">-</td>}
                    <td>
                      <button className="btn btn-sm" onClick={() => navigate('/details/' + r.student_id)}>View</button>
                    </td>
                  </tr>
                ))}
                {matrix.length === 0 && (
                  <tr><td colSpan={subjects.length + 5} className="empty-row">No students match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'records' && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th><th>Subject</th><th>Month</th><th>Held</th><th>Attended</th>
                    <th>Attendance</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => {
                    const p = pct(a.classes_attended, a.classes_held);
                    const s = studentMap.get(a.student_id);
                    return (
                      <tr key={attKey(a)}>
                        <td><b>{s.student_name}</b> <small className="muted">{a.student_id}</small></td>
                        <td>{subjectMap.get(a.subject_id)?.subject_name}</td>
                        <td>{monthLabel(a.record_month)}</td>
                        <td>{a.classes_held}</td>
                        <td>{a.classes_attended}</td>
                        <td className={cellClass(p)}>{f1(p)}%</td>
                        <td><RiskBadge risk={riskOf(p)} /></td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-btn" title="Edit" onClick={() => setModal({ type: 'edit', record: a })}><Pencil size={18} /></button>
                            <button className="icon-btn danger" title="Delete" onClick={() => setModal({ type: 'delete', record: a })}><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visible.length === 0 && (
                    <tr><td colSpan={8} className="empty-row">No attendance records match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted">
                {records.length === 0 ? '0 results' :
                  'Showing ' + ((current - 1) * PAGE_SIZE + 1) + ' to ' + Math.min(current * PAGE_SIZE, records.length) + ' of ' + records.length}
              </span>
              <div className="pager-btns">
                <button className="btn btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button>
                <span>Page {current} of {pages}</span>
                <button className="btn btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && modal.type !== 'delete' && (
        <Modal title={modal.type === 'add' ? 'Add Attendance Record' : 'Edit Attendance Record'} onClose={() => setModal(null)}>
          <AttendanceForm
            initial={modal.type === 'edit' ? modal.record : null}
            students={students}
            subjects={subjects}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal && modal.type === 'delete' && (
        <Modal title="Delete attendance record?" onClose={() => setModal(null)} width={440}>
          <p style={{ marginBottom: 8 }}>
            Delete <b>{subjectMap.get(modal.record.subject_id)?.subject_name}</b> attendance for{' '}
            <b>{studentMap.get(modal.record.student_id)?.student_name}</b> in {monthLabel(modal.record.record_month)}?
          </p>
          <p className="muted">This changes the student's overall percentage.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {toast && <div className="toast"><CheckCircle2 size={18} /> {toast}</div>}
    </>
  );
}
