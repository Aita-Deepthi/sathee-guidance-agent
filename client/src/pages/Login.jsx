import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../services/api';
import { IconAlertCircle, IconEye, IconEyeOff } from '../components/Icons';
import Field from '../components/ui/Field';
import AuthShell from './AuthShell';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = 'Enter your email address';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Enter your password';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      // Redirect is handled by <PublicOnly> in App.jsx once the user is set
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Continue where you left off."
      footer={<>New to SATHEE? <Link to="/register" className="link">Create a free account</Link></>}>
      <form onSubmit={submit} className="form" noValidate>
        {serverError && <div className="alert alert-danger" role="alert"><IconAlertCircle /><div className="alert-body">{serverError}</div></div>}
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" inputMode="email" value={form.email} autoFocus
            onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }} placeholder="you@example.com" />
        </Field>
        <div className="field">
          <label className="field-label" htmlFor="login-password">Password</label>
          <div className="input-affix">
            <input id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
              aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'login-password-err' : undefined}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: undefined }); }} placeholder="Your password" />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
              {show ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          {errors.password && <div className="field-error" id="login-password-err"><IconAlertCircle /> {errors.password}</div>}
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />} {busy ? 'Logging in' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
