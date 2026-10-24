import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { summarize, RISK_LABEL } from '../utils/attendance';
import RiskBadge from './RiskBadge';

const ORDER = { high: 0, monitor: 1, low: 2 };
const factorText = (f) => (typeof f === 'string' ? f : f.label || f.feature || '');

export default function PredictionResults({ result, students, attendance }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const rule = useMemo(
    () => new Map(summarize(students, attendance).map((r) => [r.student_id, r])),
    [students, attendance]
  );

  const rows = useMemo(
    () =>
      (result.predictions || [])
        .map((p) => {
          const s = rule.get(p.student_id);
          return s ? { ...p, risk: String(p.predicted_risk).toLowerCase(), s } : null;
        })
        .filter(Boolean)
        .filter((r) => !filter || r.risk === filter)
        .sort((a, b) => (ORDER[a.risk] ?? 3) - (ORDER[b.risk] ?? 3) || a.s.student_id.localeCompare(b.s.student_id)),
    [result, rule, filter]
  );

  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">ML predictions</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All predicted categories</option>
          <option value="high">Predicted High Risk</option>
          <option value="monitor">Predicted Monitor</option>
          <option value="low">Predicted Low Risk</option>
        </select>
      </div>
      <p className="note-line">
        Confidence is the share of training examples in the same decision-tree leaf that had this outcome. It is not a guarantee.
        {result.generated_at ? ' Generated ' + new Date(result.generated_at).toLocaleString('en-IN') + '.' : ''}
      </p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Rule-based status</th><th>ML prediction</th>
              <th>Confidence</th><th>Main factors</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id}>
                <td><b>{r.s.student_name}</b> <small className="muted">{r.student_id}</small></td>
                <td>
                  <RiskBadge risk={r.s.risk} />
                  {r.s.held > 0 && <small className="muted"> {r.s.pct.toFixed(1)}%</small>}
                </td>
                <td>
                  <RiskBadge risk={r.risk} />
                  {r.s.risk !== 'none' && r.risk !== r.s.risk && <span className="tag-diff">Differs from rule</span>}
                </td>
                <td>{r.confidence === null || r.confidence === undefined ? '-' : (r.confidence * 100).toFixed(0) + '%'}</td>
                <td>
                  <div className="chips">
                    {(r.top_factors || []).map((f, i) => <span key={i} className="chip">{factorText(f)}</span>)}
                    {(!r.top_factors || r.top_factors.length === 0) && <span className="muted">-</span>}
                  </div>
                </td>
                <td><button className="btn btn-sm" onClick={() => navigate('/details/' + r.student_id)}>View</button></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="empty-row">No predictions to show for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted small">Rule-based labels: {Object.values(RISK_LABEL).slice(0, 3).join(', ')}.</p>
    </div>
  );
}
