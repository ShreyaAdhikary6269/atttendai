import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ demoMode }) {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <span className="topbar-title">AI-Based Student Attendance Risk Prediction System</span>
      <div className="topbar-right">
        {demoMode && <span className="demo-badge">DEMO DATA, not live</span>}
        <Bell size={20} color="#5b6b8a" />
        <span style={{ fontWeight: 600 }}>{user?.name}</span>
        <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
      </div>
    </header>
  );
}
