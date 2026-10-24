import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { riskOf } from '../utils/attendance';
import { COLORS } from '../theme/colors';

export default function ReportChart({ data }) {
  if (data.length === 0) return <p className="muted">No data to chart.</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" interval={0} angle={data.length > 6 ? -30 : 0}
          textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 70 : 30}
          tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} unit="%" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => v.toFixed(1) + '%'} />
        <ReferenceLine y={75} stroke={COLORS.high} strokeDasharray="5 4" />
        <Bar dataKey="pct" name="Attendance" radius={[6, 6, 0, 0]}>
          {data.map((d) => <Cell key={d.label} fill={COLORS[riskOf(d.pct)]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
