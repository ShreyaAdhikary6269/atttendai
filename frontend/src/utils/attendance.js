export const THRESHOLD = 75;

export const pct = (attended, held) => (held > 0 ? (attended / held) * 100 : 0);

// Rule-based risk (NOT a machine learning prediction)
export function riskOf(p) {
  if (p < 75) return 'high';
  if (p < 85) return 'monitor';
  return 'low';
}

export const RISK_LABEL = { high: 'High Risk', monitor: 'Monitor', low: 'Low Risk' };

export function summarize(students, attendance) {
  const totals = new Map(students.map((s) => [s.student_id, { held: 0, attended: 0 }]));
  attendance.forEach((a) => {
    const t = totals.get(a.student_id);
    if (t) { t.held += a.classes_held; t.attended += a.classes_attended; }
  });
  return students.map((s) => {
    const t = totals.get(s.student_id);
    const p = pct(t.attended, t.held);
    return { ...s, held: t.held, attended: t.attended, pct: p, risk: riskOf(p) };
  });
}
