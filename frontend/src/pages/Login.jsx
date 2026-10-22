import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function validate() {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Link to="/" className="land-logo light"><GraduationCap size={28} /> AttendAI</Link>
        <h2>Welcome back</h2>
        <p>Sign in to monitor attendance and review students at risk.</p>
      </aside>
      <main className="auth-main">
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <h1>Log in</h1>
          <p className="muted">Enter your details to continue.</p>
          {serverError && <div className="alert-error">{serverError}</div>}

          <label>Email
            <input type="email" value={form.email} placeholder="you@college.edu"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label>Password
            <div className="pw-field">
              <input type={show ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in...' : 'Log in'}
          </button>
          <p className="auth-switch">No account? <Link to="/signup">Sign up</Link></p>
        </form>
      </main>
    </div>
  );
}
