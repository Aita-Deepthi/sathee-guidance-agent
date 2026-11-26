import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../services/api';
import { EXAMS, LEVELS } from '../utils/format';
import { IconAlertCircle, IconCheck, IconCircle, IconEye, IconEyeOff } from '../components/Icons';
import Field from '../components/ui/Field';
import Segmented from '../components/ui/Segmented';
import AuthShell from './AuthShell';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordRules(pw) {
  return [
    { label: '8+ characters', valid: pw.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(pw) },
    { label: 'Number', valid: /\d/.test(pw) },
    { label: 'Special character', valid: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function PasswordChecklist({ password, id }) {
  return (
    <ul className="check-list" id={id} aria-label="Password requirements">
      {passwordRules(password).map((r) => (
        <li key={r.label} className={r.valid ? 'ok' : ''}>
          {r.valid ? <IconCheck /> : <IconCircle />}<span>{r.label}</span><span className="sr-only">{r.valid ? ' — met' : ' — not met'}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', classLevel: 12, exam: 'JEE Main', level: 'Beginner' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const check = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = 'Enter your full name';
    if (!f.email.trim()) e.email = 'Enter your email address';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
    if (passwordRules(f.password).some((r) => !r.valid)) e.password = 'Password does not meet all requirements';
    return e;
  };
  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (touched[k]) setErrors(check(next));
  };
  const blur = (k) => () => { setTouched((t) => ({ ...t, [k]: true })); setErrors(check(form)); };
  const shown = (k) => (touched[k] ? errors[k] : undefined);

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    const errs = check(form);
    setErrors(errs);
    setTouched({ name: true, email: true, password: true });
    if (Object.keys(errs).length) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), classLevel: Number(form.classLevel) });
      toast.success("Account created — let's build your study plan.");
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Free, and takes less than a minute."
      footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}>
      <form onSubmit={submit} className="form" noValidate>
        {serverError && <div className="alert alert-danger" role="alert"><IconAlertCircle /><div className="alert-body">{serverError}</div></div>}
        <Field label="Full name" error={shown('name')}>
          <input value={form.name} onChange={set('name')} onBlur={blur('name')} autoComplete="name" placeholder="e.g. Priya Sharma" autoFocus />
        </Field>
        <Field label="Email" error={shown('email')}>
          <input type="email" inputMode="email" value={form.email} onChange={set('email')} onBlur={blur('email')} autoComplete="email" placeholder="you@example.com" />
        </Field>
        <div className="field">
          <label className="field-label" htmlFor="reg-password">Password</label>
          <div className="input-affix">
            <input id="reg-password" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} onBlur={blur('password')}
              autoComplete="new-password" placeholder="Create a strong password"
              aria-invalid={shown('password') ? 'true' : undefined} aria-describedby="reg-password-rules" />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
              {show ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          <PasswordChecklist password={form.password} id="reg-password-rules" />
          {shown('password') && <div className="field-error"><IconAlertCircle /> {errors.password}</div>}
        </div>
        <div className="form-row">
          <Field label="Class">
            <select value={form.classLevel} onChange={set('classLevel')}><option value={11}>Class 11</option><option value={12}>Class 12</option></select>
          </Field>
          <Field label="Target exam">
            <select value={form.exam} onChange={set('exam')}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
        </div>
        <div className="field">
          <span className="field-label" id="level-label">Preparation level</span>
          <Segmented block label="Preparation level" options={LEVELS} value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />} {busy ? 'Creating account' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
