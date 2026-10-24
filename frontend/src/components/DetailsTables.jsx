import { riskOf } from '../utils/attendance';
import RiskBadge from './RiskBadge';

const f1 = (n) => n.toFixed(1);
const cls = (p) => 'pc ' + riskOf(p);

export default function DetailsTables({ an, subjects }) {
  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">Subject-wise summary</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Subject</th><th>Held</th><th>Attended</th><th>Attendance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {an.subj.map((s) => (
                <tr key={s.subject_id}>
                  <td><b>{s.name}</b></td>
                  <td>{s.held || '-'}</td>
                  <td>{s.held ? s.attended : '-'}</td>
                  {s.pct === null ? <td className="pc none">-</td> : <td className={cls(s.pct)}>{f1(s.pct)}%</td>}
                  <td><RiskBadge risk={s.pct === null ? 'none' : riskOf(s.pct)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Attendance history</h3>
        <div className="table-wrap">
          <table className="table matrix">
            <thead>
              <tr>
                <th>Month</th>
                {subjects.map((s) => <th key={s.subject_id}>{s.subject_name}</th>)}
                <th>Held</th><th>Attended</th><th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {[...an.monthly].reverse().map((m) => (
                <tr key={m.month}>
                  <td><b>{m.label}</b></td>
                  {subjects.map((s) => {
                    const v = m.bySubject[s.subject_id];
                    return v === undefined
                      ? <td key={s.subject_id} className="pc none">-</td>
                      : <td key={s.subject_id} className={cls(v)}>{f1(v)}%</td>;
                  })}
                  <td>{m.held}</td>
                  <td>{m.attended}</td>
                  <td className={cls(m.pct) + ' overall'}>{f1(m.pct)}%</td>
                </tr>
              ))}
              {an.monthly.length === 0 && (
                <tr><td colSpan={subjects.length + 4} className="empty-row">No attendance records for this student yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
