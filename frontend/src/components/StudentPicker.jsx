import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { summarize } from '../utils/attendance';
import RiskBadge from './RiskBadge';

export default function StudentPicker() {
  const navigate = useNavigate();
  const { students, attendance } = useData();
  const [q, setQ] = useState('');

  const rows = useMemo(() => summarize(students, attendance), [students, attendance]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .filter((r) => !t || r.student_name.toLowerCase().includes(t) || r.student_id.toLowerCase().includes(t))
      .sort((a, b) => a.student_id.localeCompare(b.student_id))
      .slice(0, 12);
  }, [rows, q]);

  return (
    <>
      <h1 className="page-title">Student Details</h1>
      <p className="page-sub">Pick a student to see their attendance history and why they have their current status.</p>
      <div className="card">
        <div className="search-box" style={{ marginBottom: 14 }}>
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or student ID" autoFocus />
        </div>
        <div className="picker-list">
          {results.map((r) => (
            <button key={r.student_id} className="picker-item" onClick={() => navigate('/details/' + r.student_id)}>
              <span><b>{r.student_name}</b> <small className="muted">{r.student_id} - {r.department}, Sem {r.semester}</small></span>
              <span className="picker-right">
                {r.held > 0 && <b>{r.pct.toFixed(1)}%</b>}
                <RiskBadge risk={r.risk} />
              </span>
            </button>
          ))}
          {results.length === 0 && <p className="muted" style={{ padding: 12 }}>No students match your search.</p>}
        </div>
      </div>
    </>
  );
}
