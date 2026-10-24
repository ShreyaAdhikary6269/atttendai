import { pct } from './attendance';
import { monthLabel } from './format';

const sum = (arr, k) => arr.reduce((t, x) => t + x[k], 0);
const f1 = (n) => n.toFixed(1);

export function analyze(records, subjects) {
  const held = sum(records, 'classes_held');
  const attended = sum(records, 'classes_attended');
  const overall = held > 0 ? pct(attended, held) : null;

  const subj = subjects.map((s) => {
    const r = records.filter((x) => x.subject_id === s.subject_id);
    const h = sum(r, 'classes_held');
    const a = sum(r, 'classes_attended');
    return { subject_id: s.subject_id, name: s.subject_name, held: h, attended: a, pct: h > 0 ? pct(a, h) : null };
  });

  const months = [...new Set(records.map((x) => x.record_month))].sort();
  const monthly = months.map((m) => {
    const r = records.filter((x) => x.record_month === m);
    const h = sum(r, 'classes_held');
    const a = sum(r, 'classes_attended');
    const bySubject = {};
    r.forEach((x) => { bySubject[x.subject_id] = pct(x.classes_attended, x.classes_held); });
    return { month: m, label: monthLabel(m), held: h, attended: a, pct: pct(a, h), bySubject };
  });

  // Smallest number of consecutive classes to attend to reach 75% overall
  const needed = overall !== null && overall < 75 ? Math.max(0, 3 * held - 4 * attended) : 0;

  return { held, attended, overall, subj, monthly, needed };
}

// Rule-based reasons only. Nothing here comes from a machine learning model.
export function explain(an) {
  if (an.overall === null) {
    return [{ tone: 'none', text: 'No attendance has been recorded for this student yet, so no status can be given.' }];
  }
  const out = [];
  const o = an.overall;

  if (o < 75) {
    out.push({ tone: 'high', text: 'Overall attendance is ' + f1(o) + '% (' + an.attended + ' of ' + an.held + ' classes), which is below the 75% minimum.' });
  } else if (o < 85) {
    out.push({ tone: 'monitor', text: 'Overall attendance is ' + f1(o) + '%. It is above 75% but within 10 points of the minimum, so it needs watching.' });
  } else {
    out.push({ tone: 'low', text: 'Overall attendance is ' + f1(o) + '%, comfortably above the 75% minimum.' });
  }

  const weak = an.subj.filter((s) => s.pct !== null && s.pct < 75).sort((a, b) => a.pct - b.pct);
  if (weak.length > 0) {
    out.push({
      tone: 'high',
      text: 'Below 75% in ' + weak.length + (weak.length === 1 ? ' subject: ' : ' subjects: ') +
        weak.map((s) => s.name + ' (' + f1(s.pct) + '%)').join(', ') + '.',
    });
  } else {
    out.push({ tone: 'low', text: 'No individual subject is below 75%.' });
  }

  if (an.monthly.length >= 2) {
    const last = an.monthly[an.monthly.length - 1];
    const prev = an.monthly[an.monthly.length - 2];
    const d = last.pct - prev.pct;
    if (d <= -3) {
      out.push({ tone: 'monitor', text: 'Attendance dropped by ' + f1(-d) + ' points in ' + last.label + ' (from ' + f1(prev.pct) + '% to ' + f1(last.pct) + '%).' });
    } else if (d >= 3) {
      out.push({ tone: 'low', text: 'Attendance improved by ' + f1(d) + ' points in ' + last.label + ' (from ' + f1(prev.pct) + '% to ' + f1(last.pct) + '%).' });
    } else {
      out.push({ tone: 'low', text: 'Attendance was steady in ' + last.label + ' (' + f1(last.pct) + '%, change of ' + (d >= 0 ? '+' : '') + f1(d) + ' points).' });
    }
  }

  if (an.needed > 0) {
    out.push({ tone: 'high', text: 'To get back to 75% overall, the student would need to attend the next ' + an.needed + ' classes in a row without missing any.' });
  }

  return out;
}
