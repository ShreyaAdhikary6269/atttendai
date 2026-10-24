import { pct, riskOf, RISK_LABEL } from './attendance';
import { monthLabel } from './format';

export const REPORT_TYPES = [
  { id: 'student', label: 'By student' },
  { id: 'subject', label: 'By subject' },
  { id: 'department', label: 'By department' },
  { id: 'semester', label: 'By semester' },
];

export function buildReport({ type, students, subjects, attendance, filters }) {
  const { from, to, risk, dept, sem } = filters;

  const stuMap = new Map(
    students
      .filter((s) => (!dept || s.department === dept) && (!sem || String(s.semester) === sem))
      .map((s) => [s.student_id, s])
  );
  const subjName = new Map(subjects.map((s) => [s.subject_id, s.subject_name]));

  const recs = attendance.filter((a) => {
    const m = a.record_month.slice(0, 7);
    return stuMap.has(a.student_id) && (!from || m >= from) && (!to || m <= to);
  });

  const groups = new Map();
  recs.forEach((a) => {
    const s = stuMap.get(a.student_id);
    let gk;
    let label;
    let sortKey;
    if (type === 'student') {
      gk = s.student_id; label = s.student_name; sortKey = s.student_id;
    } else if (type === 'subject') {
      gk = a.subject_id; label = subjName.get(a.subject_id) || a.subject_id; sortKey = label;
    } else if (type === 'department') {
      gk = s.department; label = s.department; sortKey = s.department;
    } else {
      gk = String(s.semester); label = 'Semester ' + s.semester; sortKey = String(s.semester).padStart(2, '0');
    }
    let g = groups.get(gk);
    if (!g) {
      g = { key: gk, label, sortKey, held: 0, attended: 0, stu: new Map(), student: type === 'student' ? s : null };
      groups.set(gk, g);
    }
    g.held += a.classes_held;
    g.attended += a.classes_attended;
    const e = g.stu.get(a.student_id) || { held: 0, attended: 0 };
    e.held += a.classes_held;
    e.attended += a.classes_attended;
    g.stu.set(a.student_id, e);
  });

  let rows = [...groups.values()].map((g) => {
    const p = pct(g.attended, g.held);
    let below = 0;
    g.stu.forEach((e) => { if (pct(e.attended, e.held) < 75) below += 1; });
    return {
      key: g.key, label: g.label, sortKey: g.sortKey, student: g.student,
      students: g.stu.size, held: g.held, attended: g.attended,
      pct: p, risk: riskOf(p), below,
    };
  });

  rows = rows.filter((r) => !risk || r.risk === risk);
  if (type === 'student') rows.sort((a, b) => a.pct - b.pct || a.sortKey.localeCompare(b.sortKey));
  else rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const held = rows.reduce((t, r) => t + r.held, 0);
  const attended = rows.reduce((t, r) => t + r.attended, 0);
  const summary = {
    rows: rows.length,
    held,
    attended,
    overall: held > 0 ? pct(attended, held) : null,
    highRows: rows.filter((r) => r.risk === 'high').length,
    below: rows.reduce((t, r) => t + r.below, 0),
  };

  return { rows, summary };
}

export function exportTable(type, rows) {
  if (type === 'student') {
    return {
      headers: ['Student ID', 'Name', 'Department / Semester', 'Classes held', 'Classes attended', 'Attendance %', 'Status'],
      data: rows.map((r) => [
        r.key, r.label, r.student.department + ' / Semester ' + r.student.semester,
        r.held, r.attended, r.pct.toFixed(1), RISK_LABEL[r.risk],
      ]),
    };
  }
  const first = { subject: 'Subject', department: 'Department', semester: 'Semester' }[type];
  return {
    headers: [first, 'Students', 'Classes held', 'Classes attended', 'Attendance %', 'Students below 75%', 'Status'],
    data: rows.map((r) => [r.label, r.students, r.held, r.attended, r.pct.toFixed(1), r.below, RISK_LABEL[r.risk]]),
  };
}

export function describeFilters(f) {
  const parts = [];
  if (f.from || f.to) {
    parts.push('Period: ' + (f.from ? monthLabel(f.from) : 'earliest') + ' to ' + (f.to ? monthLabel(f.to) : 'latest'));
  } else {
    parts.push('Period: all months');
  }
  parts.push('Department: ' + (f.dept || 'all'));
  parts.push('Semester: ' + (f.sem || 'all'));
  parts.push('Status: ' + (f.risk ? RISK_LABEL[f.risk] : 'all'));
  return parts.join(' | ');
}
