import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { riskOf } from '../utils/attendance';
import { COLORS } from '../theme/colors';

const f1 = (n) => n.toFixed(1);

export default function DetailsCharts({ an }) {
  const monthlyChart = an.monthly.map((m) => ({ label: m.label, value: m.pct }));
  const barData = an.subj.filter((s) => s.pct !== null).map((s) => ({ name: s.name, value: s.pct }));

  return (
    <div className="grid-row r-two">
      <div className="card">
        <h3 className="card-title">Monthly attendance trend</h3>
        {monthlyChart.length === 0 ? <p className="muted">No data to chart.</p> : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyChart} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => f1(v) + '%'} />
              <ReferenceLine y={75} stroke={COLORS.high} strokeDasharray="5 4" />
              <Line type="monotone" dataKey="value" name="Attendance" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="muted small">Dashed red line marks the 75% minimum.</p>
      </div>

      <div className="card">
        <h3 className="card-title">Subject-wise attendance</h3>
        {barData.length === 0 ? <p className="muted">No data to chart.</p> : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={barData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => f1(v) + '%'} />
              <ReferenceLine y={75} stroke={COLORS.high} strokeDasharray="5 4" />
              <Bar dataKey="value" name="Attendance" radius={[6, 6, 0, 0]}>
                {barData.map((d) => <Cell key={d.name} fill={COLORS[riskOf(d.value)]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
