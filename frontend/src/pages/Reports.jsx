import { useMemo, useState } from 'react';
import { Download, Printer, RotateCcw, FileText, Percent, AlertTriangle, ClipboardList } from 'lucide-react';
import { useData } from '../context/DataContext';
import { buildReport, exportTable, describeFilters, REPORT_TYPES } from '../utils/reports';
import { downloadCsv } from '../utils/csv';
import { currentMonth } from '../utils/format';
import StatCard from '../components/StatCard';
import ReportChart from '../components/ReportChart';
import ReportTable from '../components/ReportTable';
import { DEPARTMENTS } from '../components/StudentForm';

const EMPTY = { from: '', to: '', risk: '', dept: '', sem: '' };
const NO_SUMMARY = { rows: 0, held: 0, attended: 0, overall: null, highRows: 0, below: 0 };

export default function Reports() {
  const { students, subjects, attendance } = useData();
  const [type, setType] = useState('student');
  const [filters, setFilters] = useState(EMPTY);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const rangeError = filters.from && filters.to && filters.from > filters.to;

  const report = useMemo(() => {
    if (rangeError) return { rows: [], summary: NO_SUMMARY };
    return buildReport({ type, students, subjects, attendance, filters });
  }, [type, students, subjects, attendance, filters, rangeError]);

  const { rows, summary } = report;
  const chartRows = type === 'student' ? rows.slice(0, 15) : rows;
  const chartData = chartRows.map((r) => ({ label: r.label, pct: r.pct }));
  const typeLabel = REPORT_TYPES.find((t) => t.id === type).label;
  const filterText = describeFilters(filters);
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  function exportCsv() {
    const { headers, data } = exportTable(type, rows);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv('attendai-report-' + type + '-' + today + '.csv', headers, data);
  }

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-sub">Build attendance reports, then export or print them. Showing demo data.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-lg" onClick={() => window.print()} disabled={rows.length === 0}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary btn-lg" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="print-only print-head">
        <h2>AttendAI attendance report ({typeLabel.toLowerCase()})</h2>
        <p>{filterText}</p>
        <p>Generated on {new Date().toLocaleDateString('en-IN')}. Status labels are rule-based, not ML predictions.</p>
      </div>

      <div className="card no-print" style={{ marginBottom: 20 }}>
        <div className="tabs">
          {REPORT_TYPES.map((t) => (
            <button key={t.id} className={'tab' + (type === t.id ? ' active' : '')} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <label className="filter-field">From month
            <input type="month" value={filters.from} max={currentMonth()} onChange={set('from')} />
          </label>
          <label className="filter-field">To month
            <input type="month" value={filters.to} max={currentMonth()} onChange={set('to')} />
          </label>
          <label className="filter-field">Department
            <select value={filters.dept} onChange={set('dept')}>
              <option value="">All</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="filter-field">Semester
            <select value={filters.sem} onChange={set('sem')}>
              <option value="">All</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </label>
          <label className="filter-field">Risk category
            <select value={filters.risk} onChange={set('risk')}>
              <option value="">All</option>
              <option value="high">High Risk (below 75%)</option>
              <option value="monitor">Monitor (75% to 84%)</option>
              <option value="low">Low Risk (85% and above)</option>
            </select>
          </label>
          <button className="btn reset-btn" onClick={() => setFilters(EMPTY)} disabled={!filtered}>
            <RotateCcw size={15} style={{ verticalAlign: 'middle' }} /> Reset
          </button>
        </div>
        {rangeError && <div className="alert-error" style={{ marginTop: 12 }}>The From month must not be after the To month.</div>}
      </div>

      <div className="stat-grid">
        <StatCard icon={FileText} label="Rows in report" value={summary.rows} note={typeLabel} />
        <StatCard icon={Percent} label="Overall attendance"
          value={summary.overall === null ? '-' : summary.overall.toFixed(1) + '%'}
          note={summary.attended + ' of ' + summary.held + ' classes'} />
        <StatCard icon={AlertTriangle} tone="red" label="High risk rows" value={summary.highRows}
          note="Rows below 75%" />
        <StatCard icon={ClipboardList} tone="red" label="Students below 75%" value={summary.below}
          note={type === 'subject' ? 'Counted per subject' : 'Within the rows shown'} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">Attendance chart ({typeLabel.toLowerCase()})</h3>
        <ReportChart data={chartData} />
        <p className="muted small">
          Dashed red line marks 75%.
          {type === 'student' && rows.length > 15 ? ' Chart shows the 15 lowest of ' + rows.length + ' students; the table lists all.' : ''}
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Report table</h3>
        <p className="note-line">Status is rule-based (below 75% High Risk, 75% to 84% Monitor, 85% and above Low Risk).</p>
        <ReportTable type={type} rows={rows} />
      </div>
    </>
  );
}
