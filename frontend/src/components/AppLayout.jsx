import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const demoMode = true; // becomes false once the backend is connected
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar demoMode={demoMode} />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
