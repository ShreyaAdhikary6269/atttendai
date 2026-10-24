import { pct } from './attendance';

// Readiness thresholds. The ML service must enforce the same rules on Oracle data.
export const MIN_EXAMPLES = 30;
export const MIN_PER_CLASS = 5;
export const MIN_MONTHS = 4;

// A training example is a student with at least MIN_MONTHS of history.
// The label is whether attendance in their latest month fell below 75%.
export function trainingReadiness(students, attendance) {
  const ids = new Set(students.map((s) => s.student_id));
  const by = new Map();
  attendance.forEach((a) => {
    if (!ids.has(a.student_id)) return;
    let months = by.get(a.student_id);
    if (!months) { months = new Map(); by.set(a.student_id, months); }
    const m = months.get(a.record_month) || { held: 0, att: 0 };
    m.held += a.classes_held;
    m.att += a.classes_attended;
    months.set(a.record_month, m);
  });

  let examples = 0;
  let below = 0;
  by.forEach((months) => {
    const keys = [...months.keys()].sort();
    if (keys.length < MIN_MONTHS) return;
    examples += 1;
    const last = months.get(keys[keys.length - 1]);
    if (pct(last.att, last.held) < 75) below += 1;
  });
  const ok = examples - below;

  const problems = [];
  if (examples < MIN_EXAMPLES) {
    problems.push('Only ' + examples + ' students have ' + MIN_MONTHS + ' or more months of data. At least ' + MIN_EXAMPLES + ' are needed.');
  }
  if (below < MIN_PER_CLASS) {
    problems.push('Only ' + below + ' examples fell below 75%. At least ' + MIN_PER_CLASS + ' are needed so the model can learn what risk looks like.');
  }
  if (ok < MIN_PER_CLASS) {
    problems.push('Only ' + ok + ' examples stayed at or above 75%. At least ' + MIN_PER_CLASS + ' are needed.');
  }
  return { examples, below, ok, ready: problems.length === 0, problems };
}
