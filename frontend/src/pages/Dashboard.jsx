import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, CalendarCheck, AlertTriangle, ShieldCheck, Bell, BrainCircuit, ArrowRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, LineChart, Line,
} from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { COLORS } from '../theme/colors';
import { students, subjects, attendance } from '../data/demoData';
import { summarize, pct, RISK_LABEL } from '../utils/attendance';

const f1 = (n) => n.toFixed(1);

export default function Dashboard() {
  const navigate = useNavigate();

  const d = useMemo(() => {
    const rows = summarize(students, attendance);
    const total = rows.length;
    const avg = rows.reduce((s, r) => s + r.pct, 0) / total;
    const count = { low: 0, monitor: 0, high: 0 };
    rows.forEach((r) => { count[r.risk] += 1; });

    const deptNames = [...new Set(rows.map((r) => r.department))];
    const dept = deptNames.map((name) => {
      const g = rows.filter((r) => r.department === name);
      return {
        dept: name,
        avg: g.reduce((s, r) => s + r.pct, 0) / g.length,
        below: (g.filter((r) => r.risk === 'high').length / g.length) * 100,
      };
    });

    const subj = subjects.map((s) => {
      const recs = attendance.filter((a) => a.subject_id === s.subject_id);
      const held = recs.reduce((t, a) => t + a.classes_held, 0);
      const att = recs.reduce((t, a) => t + a.classes_attended, 0);
      return { name: s.subject_name, value: pct(att, held) };
    });

    const monthKeys = [...new Set(attendance.map((a) => a.record_month))].sort();
    const trend = monthKeys.map((m) => {
      const recs = attendance.filter((a) => a.record_month === m);
      const held = recs.reduce((t, a) => t + a.classes_held, 0);
      const att = recs.reduce((t, a) => t + a.classes_attended, 0);
      const label = new Date(m + 'T00:00:00').toLocaleString('en-US', { month: 'short' });
      return { month: label, value: pct(att, held) };
    });
    const change = trend.length > 1 ? trend[trend.length - 1].value - trend[trend.length - 2].value : 0;

    const flagged = rows.filter((r) => r.risk !== 'low').sort((a, b) => a.pct - b.pct);

    return { rows, total, avg, count, dept, subj, trend, change, flagged, deptCount: deptNames.length };
  }, []);

  const pie = [
    { key: 'low', name: 'Low Risk (85% and above)', value: d.count.low, color: COLORS.low },
    { key: 'monitor', name: 'Monitor (75% to 84%)', value: d.count.monitor, color: COLORS.monitor },
    { key: 'high', name: 'High Risk (below 75%)', value: d.count.high, color: COLORS.high },
  ];

  return (
    <>
      <h1 className="page-title">Welcome, Admin</h1>
      <p className="page-sub">Here is an overview of student attendance and risk. Showing demo data.</p>

      <div className="stat-grid">
        <StatCard icon={Users} label="Total Students" value={d.total}
          note={'Across ' + d.deptCount + ' departments'} />
        <StatCard icon={CalendarCheck} label="Average Attendance" value={f1(d.avg) + '%'}
          note={(d.change >= 0 ? '+' : '') + f1(d.change) + ' pts vs last month'} />
        <StatCard icon={AlertTriangle} tone="red" label="High Risk Students" value={d.count.high}
          note="Attendance below 75%" />
        <StatCard icon={ShieldCheck} tone="green" label="Low Risk Students" value={d.count.low}
          note="Attendance 85% and above" />
      </div>

      <div className="grid-row r2">
        <div className="card">
          <h3 className="card-title">Attendance Distribution</h3>
          <div className="donut-row">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {pie.map((p) => <Cell key={p.key} fill={p.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><b>{d.total}</b><span>Students</span></div>
            </div>
            <div className="legend-list">
              {pie.map((p) => (
                <div key={p.key} className="legend-row">
                  <i style={{ background: p.color }} />
                  <span>{p.name}</span>
                  <b>{p.value}</b>
                  <em>{f1((p.value / d.total) * 100)}%</em>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Department-wise Attendance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.dept} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: COLORS.axis, fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => f1(v) + '%'} />
              <Legend />
              <Bar dataKey="avg" name="Average attendance" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="below" name="Students below 75%" fill={COLORS.secondary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title"><Bell size={18} /> Recent Alerts</h3>
            <Link to="/students" className="link">View All</Link>
          </div>
          <p className="tag-note">Rule-based alerts (attendance threshold), not ML predictions</p>
          <div className="alert-list">
            {d.flagged.slice(0, 5).map((r) => (
              <div key={r.student_id} className="alert-item"
                onClick={() => navigate('/details/' + r.student_id)}>
                <i className={'dot ' + r.risk} />
                <div>
                  <b>{r.student_name}</b> <small>({r.department})</small>
                  <div className="muted small">
                    {r.risk === 'high'
                      ? 'Attendance below 75% (' + f1(r.pct) + '%)'
                      : 'Attendance at ' + f1(r.pct) + '% (Monitor)'}
                  </div>
                </div>
              </div>
            ))}
            {d.flagged.length === 0 && <p className="muted">No students need attention.</p>}
          </div>
        </div>
      </div>

      <div className="grid-row r3">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Students Requiring Attention</h3>
            <Link to="/students" className="link">View All</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student ID</th><th>Name</th><th>Dept</th><th>Sem</th>
                  <th>Attendance</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {d.flagged.slice(0, 5).map((r) => (
                  <tr key={r.student_id}>
                    <td>{r.student_id}</td>
                    <td>{r.student_name}</td>
                    <td>{r.department}</td>
                    <td>{r.semester}</td>
                    <td style={{ color: r.risk === 'high' ? COLORS.high : 'inherit', fontWeight: 600 }}>
                      {f1(r.pct)}%
                    </td>
                    <td><RiskBadge risk={r.risk} /></td>
                    <td>
                      <button className="btn btn-sm" onClick={() => navigate('/details/' + r.student_id)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card insight">
          <div className="insight-icon"><BrainCircuit size={30} /></div>
          <h3>AI-Powered Insights</h3>
          <p>
            The Decision Tree model has not been trained yet, so no ML predictions are shown.
            The alerts above use only the 75% attendance rule. Train and test the model on the
            prediction page.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/prediction')}>
            Open AI Risk Prediction <ArrowRight size={16} style={{ verticalAlign: 'middle' }} />
          </button>
        </div>
      </div>

      <div className="grid-row r4">
        <div className="card">
          <h3 className="card-title">Subject-wise Attendance (Average)</h3>
          <div className="subj-list">
            {d.subj.map((s) => (
              <div key={s.name} className="subj-row">
                <span>{s.name}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: s.value + '%' }} /></div>
                <b>{f1(s.value)}%</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Risk Category Breakdown</h3>
          <div className="legend-list">
            {pie.map((p) => (
              <div key={p.key} className="legend-row">
                <i style={{ background: p.color }} />
                <span>{RISK_LABEL[p.key]}</span>
                <b>{p.value}</b>
                <em>{f1((p.value / d.total) * 100)}%</em>
              </div>
            ))}
          </div>
          <div className="stack-bar">
            {pie.map((p) => (
              <div key={p.key} style={{ width: (p.value / d.total) * 100 + '%', background: p.color }} />
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={d.trend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[(m) => Math.floor(m - 5), (m) => Math.min(100, Math.ceil(m + 5))]}
                unit="%" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => f1(v) + '%'} />
              <Line type="monotone" dataKey="value" name="Attendance" stroke={COLORS.primary}
                strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
