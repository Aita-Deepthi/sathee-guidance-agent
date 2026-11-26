import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PageHeader from '../components/ui/PageHeader';
import Field from '../components/ui/Field';
import Segmented from '../components/ui/Segmented';
import { IconEye, IconEyeOff, IconInfo, IconLock, IconAlertCircle } from '../components/Icons';
import { EXAMS, LEVELS, EXAM_SUBJECTS, todayISO, addDaysISO, daysUntil } from '../utils/format';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const p = user.profile;
  const initial = useMemo(() => ({
    name: user.name, classLevel: String(p.classLevel), exam: p.exam, level: p.level,
    examDate: p.examDate || '', hoursPerDay: String(p.hoursPerDay || 6), subjects: p.subjects,
  }), [user, p]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const dirty = JSON.stringify({ ...form, subjects: undefined }) !== JSON.stringify({ ...initial, subjects: undefined });
  const initials = (user.name || '?').split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const left = daysUntil(form.examDate);

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your name';
    if (form.examDate && form.examDate <= todayISO()) errs.examDate = 'The exam date must be in the future';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (form.exam !== p.exam) {
      const ok = await confirm({
        title: `Switch target exam to ${form.exam}?`,
        description: 'Your subjects change to match the new exam. You will need to regenerate your study plan for the change to take effect.',
        confirmLabel: 'Switch exam', tone: 'warning',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await api.put('/profile', {
        ...form, name: form.name.trim(), classLevel: Number(form.classLevel), hoursPerDay: Number(form.hoursPerDay),
        subjects: form.exam === p.exam ? form.subjects : undefined,
      });
      await refreshUser();
      toast.success(res.data.examChanged ? 'Profile updated. Regenerate your study plan for the new exam.' : 'Profile updated. Regenerate your plan to apply new hours or dates.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack narrow">
      <PageHeader title="Profile" description="Your account and the exam settings the planner uses." />

      <section className="card profile-head">
        <span className="avatar lg">{initials}</span>
        <div className="grow">
          <div className="strong">{user.name}</div>
          <div className="text-sm muted">{user.email}</div>
        </div>
        <span className="badge badge-neutral hide-sm">{p.exam} · Class {p.classLevel}</span>
      </section>

      <form className="card" onSubmit={save} noValidate>
        <div className="card-header"><div><h2 className="card-title">Exam details</h2><div className="card-subtitle">Changes apply to new or regenerated plans</div></div>{dirty && <span className="badge badge-warning">Unsaved changes</span>}</div>
        <div className="card-body form">
          <Field label="Full name" error={errors.name}><input value={form.name} onChange={set('name')} autoComplete="name" /></Field>
          <div className="form-row">
            <Field label="Target exam">
              <select value={form.exam} onChange={(e) => setForm({ ...form, exam: e.target.value, subjects: EXAM_SUBJECTS[e.target.value] })}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Exam date" error={errors.examDate} hint={left !== null && left > 0 ? `${left} days from today · confirm on the official NTA / JEE Advanced site` : 'Confirm on the official NTA / JEE Advanced site'}>
              <input type="date" min={addDaysISO(todayISO(), 1)} value={form.examDate} onChange={set('examDate')} />
            </Field>
            <Field label="Class">
              <select value={form.classLevel} onChange={set('classLevel')}><option value="11">Class 11</option><option value="12">Class 12</option></select>
            </Field>
            <div className="field">
              <span className="field-label">Preparation level</span>
              <Segmented block label="Preparation level" options={LEVELS} value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="profile-hours"><span>Study hours per day</span><span className="strong num">{form.hoursPerDay} h</span></label>
            <input id="profile-hours" type="range" min="1" max="14" step="0.5" value={form.hoursPerDay} onChange={set('hoursPerDay')} />
            <div className="range-scale text-xs muted num"><span>1 h</span><span>14 h</span></div>
          </div>
          {form.exam !== p.exam && (
            <div className="alert alert-warning"><IconInfo /><div className="alert-body">Switching exam changes your subjects. <Link className="link" to="/plan">Regenerate your plan</Link> after saving.</div></div>
          )}
        </div>
        <div className="card-footer">
          <button type="button" className="btn btn-ghost" onClick={() => { setForm(initial); setErrors({}); }} disabled={!dirty || busy}>Discard</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>{busy && <span className="spinner" aria-hidden="true" />} {busy ? 'Saving' : 'Save changes'}</button>
        </div>
      </form>

      <PasswordForm />
    </div>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setPw({ ...pw, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); setServerError(''); };

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 6) errs.newPassword = 'Use at least 6 characters';
    else if (pw.newPassword === pw.currentPassword) errs.newPassword = 'Choose a password different from the current one';
    if (pw.confirm !== pw.newPassword) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api.put('/profile/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const type = show ? 'text' : 'password';
  return (
    <form className="card" onSubmit={submit} noValidate>
      <div className="card-header">
        <div><h2 className="card-title"><IconLock /> Password</h2><div className="card-subtitle">You stay signed in on this device after changing it</div></div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? <IconEyeOff /> : <IconEye />} {show ? 'Hide' : 'Show'}</button>
      </div>
      <div className="card-body form">
        {serverError && <div className="alert alert-danger" role="alert"><IconAlertCircle /><div className="alert-body">{serverError}</div></div>}
        <Field label="Current password" error={errors.currentPassword}><input type={type} autoComplete="current-password" value={pw.currentPassword} onChange={set('currentPassword')} /></Field>
        <div className="form-row">
          <Field label="New password" error={errors.newPassword} hint="At least 6 characters; a mix of letters, numbers and symbols is stronger"><input type={type} autoComplete="new-password" value={pw.newPassword} onChange={set('newPassword')} /></Field>
          <Field label="Confirm new password" error={errors.confirm}><input type={type} autoComplete="new-password" value={pw.confirm} onChange={set('confirm')} /></Field>
        </div>
      </div>
      <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-secondary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />} {busy ? 'Updating' : 'Update password'}</button>
      </div>
    </form>
  );
}
