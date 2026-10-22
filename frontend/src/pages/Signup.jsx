import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      e.password = 'Include both letters and numbers.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
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
      await signup(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Link to="/" className="land-logo light"><GraduationCap size={28} /> AttendAI</Link>
        <h2>Create your account</h2>
        <p>Start tracking attendance and spotting risk early.</p>
      </aside>
      <main className="auth-main">
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <h1>Sign up</h1>
          <p className="muted">It only takes a minute.</p>
          {serverError && <div className="alert-error">{serverError}</div>}

          <label>Full name
            <input value={form.name} onChange={set('name')} placeholder="Your name" />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <label>Email
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label>Password
            <div className="pw-field">
              <input type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} />
              <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <label>Confirm password
            <input type={show ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </label>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
          <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </main>
    </div>
  );
}
