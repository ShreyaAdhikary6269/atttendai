import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Placeholder from './components/Placeholder';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Placeholder title="Students" />} />
            <Route path="/attendance" element={<Placeholder title="Attendance" />} />
            <Route path="/prediction" element={<Placeholder title="AI Risk Prediction" />} />
            <Route path="/reports" element={<Placeholder title="Reports & Analytics" />} />
            <Route path="/details" element={<Placeholder title="Student Details" />} />
            <Route path="/details/:id" element={<Placeholder title="Student Details" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
