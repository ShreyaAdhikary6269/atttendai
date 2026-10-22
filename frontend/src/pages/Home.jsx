import { Link } from 'react-router-dom';
import {
  GraduationCap, BrainCircuit, BarChart3, ClipboardCheck,
  Users, FileDown, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Users, title: 'Student Management', text: 'Add, edit, search and manage student records with validated forms.' },
  { icon: ClipboardCheck, title: 'Attendance Tracking', text: 'Record classes held and attended per subject. Percentages are calculated automatically.' },
  { icon: BrainCircuit, title: 'AI Risk Prediction', text: 'A Decision Tree model estimates which students are likely to fall below 75%.' },
  { icon: BarChart3, title: 'Analytics', text: 'Department, subject and semester charts that make patterns easy to see.' },
  { icon: FileDown, title: 'Reports', text: 'Filter by date and risk category, then export to CSV or print.' },
  { icon: GraduationCap, title: 'Clear Explanations', text: 'See exactly why a student was flagged, rule-based or model-based.' },
];

const steps = [
  { n: '1', title: 'Record attendance', text: 'Enter classes held and attended for each subject.' },
  { n: '2', title: 'Detect risk', text: 'Rule-based alerts flag anyone below 75% immediately.' },
  { n: '3', title: 'Predict ahead', text: 'The ML model looks at trends to flag students before they cross the line.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="land">
      <header className="land-nav">
        <div className="land-logo"><GraduationCap size={28} /> AttendAI</div>
        <nav className="land-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="land-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="pill">DBMS Lab Project, PCCCS591</span>
          <h1>Spot attendance risk <span>before</span> it becomes a problem.</h1>
          <p>
            AttendAI monitors student attendance, flags anyone below 75%, and uses a
            machine learning model to predict who is heading toward risk.
          </p>
          <div className="hero-cta">
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
              Get started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-lg">Explore features</a>
          </div>
        </div>

        <div className="hero-card card">
          <div className="hero-card-head">
            <strong>Overview</strong>
            <span className="demo-badge">Sample illustration</span>
          </div>
          <div className="hero-stats">
            <div><small>Students</small><b>32</b></div>
            <div><small>Avg attendance</small><b>78.5%</b></div>
            <div><small>Flagged</small><b style={{ color: 'var(--risk-high)' }}>6</b></div>
          </div>
          <div className="hero-bars">
            {[82, 76, 71, 69].map((h, i) => (
              <div key={i} className="hero-bar" style={{ height: h + '%' }} />
            ))}
          </div>
          <small className="muted">Illustration only. Real numbers appear after you sign in.</small>
        </div>
      </section>

      <section id="features" className="section">
        <h2>Everything you need to track attendance</h2>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card feature">
              <div className="feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="section alt">
        <h2>How it works</h2>
        <div className="steps">
          {steps.map((s) => (
            <div key={s.n} className="step">
              <div className="step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="land-footer">
        AttendAI, AI-Based Student Attendance Risk Prediction System. Built with Oracle, PL/SQL, Node.js, React and scikit-learn.
      </footer>
    </div>
  );
}
