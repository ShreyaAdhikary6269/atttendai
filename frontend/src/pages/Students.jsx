import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { summarize } from '../utils/attendance';
import Modal from '../components/Modal';
import RiskBadge from '../components/RiskBadge';
import StudentForm, { DEPARTMENTS } from '../components/StudentForm';

const PAGE_SIZE = 10;

export default function Students() {
  const navigate = useNavigate();
  const { students, attendance, addStudent, updateStudent, deleteStudent } = useData();

  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [sem, setSem] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'delete', student }
  const [toast, setToast] = useState('');

  const rows = useMemo(() => summarize(students, attendance), [students, attendance]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.student_name.toLowerCase().includes(q) || r.student_id.toLowerCase().includes(q))
      .filter((r) => !dept || r.department === dept)
      .filter((r) => !sem || String(r.semester) === sem)
      .filter((r) => !risk || r.risk === risk)
      .sort((a, b) => a.student_id.localeCompare(b.student_id));
  }, [rows, query, dept, sem, risk]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filterChange = (setter) => (e) => { setter(e.target.value); setPage(1); };

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function nextId() {
    const max = students.reduce((m, s) => Math.max(m, parseInt(s.student_id.slice(1), 10) || 0), 1000);
    return 'S' + (max + 1);
  }

  function handleSave(values) {
    if (modal.type === 'add') {
      addStudent(values);
      showToast(values.student_name + ' was added.');
    } else {
      updateStudent(modal.student.student_id, values);
      showToast(values.student_name + ' was updated.');
    }
    setModal(null);
  }

  function handleDelete() {
    const s = modal.student;
    deleteStudent(s.student_id);
    setModal(null);
    showToast(s.student_name + ' was deleted.');
  }

  const recordCount = (id) => attendance.filter((a) => a.student_id === id).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">{students.length} students in total. Showing demo data.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setModal({ type: 'add' })}>
          <Plus size={18} /> Add Student
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input value={query} onChange={filterChange(setQuery)} placeholder="Search by name or student ID" />
          </div>
          <select value={dept} onChange={filterChange(setDept)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sem} onChange={filterChange(setSem)}>
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
          </select>
          <select value={risk} onChange={filterChange(setRisk)}>
            <option value="">All statuses</option>
            <option value="high">High Risk</option>
            <option value="monitor">Monitor</option>
            <option value="low">Low Risk</option>
            <option value="none">No data</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Dept</th><th>Sem</th>
                <th>Attendance</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.student_id}>
                  <td>{r.student_id}</td>
                  <td><b>{r.student_name}</b></td>
                  <td>{r.department}</td>
                  <td>{r.semester}</td>
                  <td style={{ fontWeight: 600, color: r.risk === 'high' ? 'var(--risk-high)' : 'inherit' }}>
                    {r.held > 0 ? r.pct.toFixed(1) + '%' : '-'}
                  </td>
                  <td><RiskBadge risk={r.risk} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="View details" onClick={() => navigate('/details/' + r.student_id)}><Eye size={18} /></button>
                      <button className="icon-btn" title="Edit" onClick={() => setModal({ type: 'edit', student: r })}><Pencil size={18} /></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setModal({ type: 'delete', student: r })}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No students match your search or filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span className="muted">
            {filtered.length === 0 ? '0 results' :
              'Showing ' + ((current - 1) * PAGE_SIZE + 1) + ' to ' + Math.min(current * PAGE_SIZE, filtered.length) + ' of ' + filtered.length}
          </span>
          <div className="pager-btns">
            <button className="btn btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button>
            <span>Page {current} of {pages}</span>
            <button className="btn btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
          </div>
        </div>
      </div>

      {modal && modal.type !== 'delete' && (
        <Modal title={modal.type === 'add' ? 'Add Student' : 'Edit Student'} onClose={() => setModal(null)}>
          <StudentForm
            initial={modal.type === 'edit' ? modal.student : null}
            defaultId={modal.type === 'add' ? nextId() : ''}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal && modal.type === 'delete' && (
        <Modal title="Delete student?" onClose={() => setModal(null)} width={440}>
          <p style={{ marginBottom: 8 }}>
            You are about to delete <b>{modal.student.student_name}</b> ({modal.student.student_id}).
          </p>
          <p className="muted">
            This also removes {recordCount(modal.student.student_id)} attendance records for this student.
          </p>
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
