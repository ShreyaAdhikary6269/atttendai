import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Printer, BrainCircuit, Info,
  CalendarCheck, BookOpen, AlertTriangle, Target,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { riskOf, RISK_LABEL } from '../utils/attendance';
import { analyze, explain } from '../utils/analysis';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import StudentPicker from '../components/StudentPicker';
import DetailsCharts from '../components/DetailsCharts';
import DetailsTables from '../components/DetailsTables';

const f1 = (n) => n.toFixed(1);

export default function StudentDetails() {
  const { id } = useParams();
  const { students, subjects, attendance } = useData();

  const student = students.find((s) => s.student_id === id);
  const records = useMemo(() => attendance.filter((a) => a.student_id === id), [attendance, id]);
  const an = useMemo(() => analyze(records, subjects), [records, subjects]);
  const reasons = useMemo(() => explain(an), [an]);

  if (!id) return <StudentPicker />;

  if (!student) {
    return (
      <>
        <h1 className="page-title">Student not found</h1>
        <p className="page-sub">There is no student with ID {id}. They may have been deleted.</p>
        <Link to="/details" className="btn">Choose another student</Link>
      </>
    );
  }

  const risk = an.overall === null ? 'none' : riskOf(an.overall);
  const subjectsBelow = an.subj.filter((s) => s.pct !== null && s.pct < 75).length;
  const withData = an.subj.filter((s) => s.pct !== null).length;

  return (
    <>
      <Link to="/details" className="back-link no-print"><ArrowLeft size={16} /> All students</Link>

      <div className="profile-head">
        <div className="profile-avatar">{student.student_name[0]}</div>
        <div className="profile-info">
          <h1 className="page-title">{student.student_name}</h1>
          <p className="muted">
            {student.student_id} - {student.department}, Semester {student.semester}
            {student.email ? ' - ' + student.email : ''}
          </p>
        </div>
        <div className="profile-status">
          <RiskBadge risk={risk} />
          <small className="muted">Rule-based status</small>
        </div>
        <button className="btn no-print" onClick={() => window.print()}>
          <Printer size={16} style={{ verticalAlign: 'middle' }} /> Print
        </button>
      </div>

      <div className="stat-grid">
        <StatCard icon={CalendarCheck} label="Overall Attendance"
          value={an.overall === null ? '-' : f1(an.overall) + '%'} note={RISK_LABEL[risk]} />
        <StatCard icon={BookOpen} label="Classes Attended" value={an.attended + ' / ' + an.held}
          note="Attended / held, all subjects" />
        <StatCard icon={AlertTriangle} tone="red" label="Subjects Below 75%" value={subjectsBelow}
          note={'Out of ' + withData + ' subjects'} />
        <StatCard icon={Target} tone={an.needed > 0 ? 'red' : 'green'} label="Classes To Reach 75%"
          value={an.overall === null ? '-' : an.needed > 0 ? an.needed : 'None'}
          note={an.needed > 0 ? 'Consecutive classes to attend' : 'Already at or above 75%'} />
      </div>

      <div className="grid-row r-explain">
        <div className="card">
          <h3 className="card-title"><Info size={18} /> Why this status</h3>
          <div className="reason-list">
            {reasons.map((r, i) => (
              <div key={i} className="reason">
                <i className={'dot ' + r.tone} />
                <span>{r.text}</span>
              </div>
            ))}
          </div>
          <p className="tag-note" style={{ marginTop: 14 }}>
            This explanation uses fixed attendance rules (below 75% is High Risk, 75% to 84% is Monitor,
            85% and above is Low Risk). It is not a machine learning prediction.
          </p>
        </div>

        <div className="card ml-card">
          <h3 className="card-title"><BrainCircuit size={18} /> ML Risk Prediction</h3>
          <div className="ml-state">Not available</div>
          <p className="muted">
            The Decision Tree model has not been trained and tested yet, so there is no prediction
            for this student. Nothing is estimated or made up here.
          </p>
          <Link to="/prediction" className="btn no-print">Go to AI Risk Prediction</Link>
        </div>
      </div>

      <DetailsCharts an={an} />
      <DetailsTables an={an} subjects={subjects} />
    </>
  );
}
