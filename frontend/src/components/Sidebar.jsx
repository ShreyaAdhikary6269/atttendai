import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, BrainCircuit,
  BarChart3, UserSearch, GraduationCap, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/prediction', label: 'AI Risk Prediction', icon: BrainCircuit },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/details', label: 'Student Details', icon: UserSearch },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="brand"><GraduationCap size={30} /> AttendAI</div>
      <nav className="nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} /> {label}
          </NavLink>
        ))}
      </nav>
      <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
        <LogOut size={18} /> Log out
      </button>
      <div className="sidebar-footer">Better Attendance<br />Brighter Future</div>
    </aside>
  );
}
