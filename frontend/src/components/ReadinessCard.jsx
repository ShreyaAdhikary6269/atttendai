import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { MIN_EXAMPLES, MIN_PER_CLASS, MIN_MONTHS } from '../utils/mlData';

export default function ReadinessCard({ readiness }) {
  const r = readiness;
  return (
    <div className="card">
      <h3 className="card-title">Training data check</h3>
      <div className="kv-list">
        <div><span>Students with {MIN_MONTHS}+ months of data</span><b>{r.examples}</b></div>
        <div><span>Latest month below 75%</span><b>{r.below}</b></div>
        <div><span>Latest month at or above 75%</span><b>{r.ok}</b></div>
      </div>
      {r.ready ? (
        <div className="notice good">
          <CheckCircle2 size={18} />
          <span>Enough examples to try training (minimum {MIN_EXAMPLES} students, {MIN_PER_CLASS} per outcome).</span>
        </div>
      ) : (
        <div className="notice warn">
          <AlertTriangle size={18} />
          <div>
            <b>Insufficient training data.</b> Predictions would not be reliable.
            <ul>{r.problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      )}
      <p className="muted small">
        Counted from the demo data in this browser. The real check runs on Oracle data when the ML service trains.
      </p>
    </div>
  );
}
