import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import { riskOf } from '../utils/attendance';

const f1 = (n) => n.toFixed(1);

export default function ReportTable({ type, rows }) {
  const navigate = useNavigate();
  const isStudent = type === 'student';
  const firstHead = { subject: 'Subject', department: 'Department', semester: 'Semester' }[type];

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          {isStudent ? (
            <tr>
              <th>Student ID</th><th>Name</th><th>Dept / Sem</th><th>Held</th><th>Attended</th>
              <th>Attendance</th><th>Status</th><th className="no-print"></th>
            </tr>
          ) : (
            <tr>
              <th>{firstHead}</th><th>Students</th><th>Held</th><th>Attended</th>
              <th>Attendance</th><th>Below 75%</th><th>Status</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((r) =>
            isStudent ? (
              <tr key={r.key}>
                <td>{r.key}</td>
                <td><b>{r.label}</b></td>
                <td>{r.student.department} / {r.student.semester}</td>
                <td>{r.held}</td>
                <td>{r.attended}</td>
                <td className={'pc ' + riskOf(r.pct)}>{f1(r.pct)}%</td>
                <td><RiskBadge risk={r.risk} /></td>
                <td className="no-print">
                  <button className="btn btn-sm" onClick={() => navigate('/details/' + r.key)}>View</button>
                </td>
              </tr>
            ) : (
              <tr key={r.key}>
                <td><b>{r.label}</b></td>
                <td>{r.students}</td>
                <td>{r.held}</td>
                <td>{r.attended}</td>
                <td className={'pc ' + riskOf(r.pct)}>{f1(r.pct)}%</td>
                <td>{r.below}</td>
                <td><RiskBadge risk={r.risk} /></td>
              </tr>
            )
          )}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="empty-row">No data matches these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
