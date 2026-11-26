import { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { ErrorState, EmptyState } from '../components/States';
import { PageSkeleton, ListSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Field from '../components/ui/Field';
import Segmented from '../components/ui/Segmented';
import TaskItem from '../components/TaskItem';
import { ProgressBar } from '../components/Progress';
import { IconRefresh, IconCalendar, IconSparkle, IconAlert, IconChevron, IconChevronLeft, IconCheck, IconAlertCircle, IconSettings } from '../components/Icons';
import { EXAMS, LEVELS, EXAM_SUBJECTS, SUBJECT_COLORS, formatDate, formatMinutes, todayISO, addDaysISO } from '../utils/format';

export default function StudyPlan() {
  const { data, loading, error, reload } = useApi('/plan');
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <PageSkeleton variant="split" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  if (!data.plan || editing) {
    return <PlanForm hasPlan={Boolean(data.plan)} onCancel={() => setEditing(false)} onDone={() => { setEditing(false); reload(); }} />;
  }
  return <PlanView data={data} onRegenerate={() => setEditing(true)} reload={reload} />;
}

/* ---------- Plan generator form ---------- */
function PlanForm({ hasPlan, onCancel, onDone }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const p = user.profile;
  const [form, setForm] = useState({
    exam: p.exam,
    examDate: p.examDate || '',
    classLevel: p.classLevel,
    level: p.level,
    hoursPerDay: p.hoursPerDay || 6,
    subjects: p.subjects?.length ? p.subjects : EXAM_SUBJECTS[p.exam],
  });
  const [chapterState, setChapterState] = useState(() => {
    const s = {};
    (p.completedChapters || []).forEach((c) => (s[`${c.subject}|${c.chapter}`] = 'done'));
    (p.weakChapters || []).forEach((c) => (s[`${c.subject}|${c.chapter}`] = 'weak'));
    return s;
  });
  const [openSubject, setOpenSubject] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { data: syl, loading: sylLoading } = useApi(`/syllabus?exam=${encodeURIComponent(form.exam)}`);

  const changeExam = (exam) => {
    setForm({ ...form, exam, subjects: EXAM_SUBJECTS[exam] });
    setChapterState({});
  };
  const toggleSubject = (s) => setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));
  const setChapter = (key, value) => setChapterState((st) => ({ ...st, [key]: st[key] === value ? undefined : value }));

  const counts = useMemo(() => {
    const vals = Object.values(chapterState);
    return { done: vals.filter((v) => v === 'done').length, weak: vals.filter((v) => v === 'weak').length };
  }, [chapterState]);

  const daysAvailable = form.examDate && form.examDate > todayISO()
    ? Math.round((new Date(form.examDate + 'T00:00:00Z') - new Date(todayISO() + 'T00:00:00Z')) / 86400000) : null;

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    const errs = {};
    if (!form.examDate) errs.examDate = 'Enter your exam date';
    else if (form.examDate <= todayISO()) errs.examDate = 'The exam date must be in the future';
    if (form.subjects.length === 0) errs.subjects = 'Choose at least one subject';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (hasPlan) {
      const ok = await confirm({
        title: 'Regenerate your study plan?',
        description: 'Completed work is kept. All future pending tasks are replaced with a new schedule based on these settings.',
        confirmLabel: 'Regenerate plan', tone: 'warning',
      });
      if (!ok) return;
    }

    const toList = (kind) => Object.entries(chapterState).filter(([, v]) => v === kind)
      .map(([k]) => { const [subject, chapter] = k.split('|'); return { subject, chapter }; })
      .filter((c) => form.subjects.includes(c.subject));
    setBusy(true);
    try {
      await api.post('/plan/generate', {
        ...form,
        classLevel: Number(form.classLevel),
        hoursPerDay: Number(form.hoursPerDay),
        completedChapters: toList('done'),
        weakChapters: toList('weak'),
      });
      await refreshUser();
      toast.success('Your study plan is ready');
      onDone();
    } catch (err) {
      setServerError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  const subjects = (syl?.subjects || []).filter((s) => form.subjects.includes(s.subject));

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <PageHeader
        eyebrow={hasPlan ? <button type="button" className="link-muted" onClick={onCancel}><IconChevronLeft width={14} height={14} /> Back to plan</button> : null}
        title={hasPlan ? 'Edit and regenerate plan' : 'Create your study plan'}
        description="The planner uses the syllabus dataset, your exam date and daily hours to schedule every topic, with weekly revision and mock-test days."
      />
      {serverError && <div className="alert alert-danger" role="alert"><IconAlertCircle /><div className="alert-body">{serverError}</div></div>}

      <section className="card">
        <div className="card-header"><div><h2 className="card-title"><span className="step-badge">1</span> Exam and availability</h2></div></div>
        <div className="card-body form">
          <div className="form-row-3">
            <Field label="Examination">
              <select value={form.exam} onChange={(e) => changeExam(e.target.value)}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Exam date" error={errors.examDate} hint={daysAvailable ? `${daysAvailable} days from today` : 'Confirm on the official NTA / JEE Advanced site'}>
              <input type="date" min={addDaysISO(todayISO(), 1)} value={form.examDate}
                onChange={(e) => { setForm({ ...form, examDate: e.target.value }); setErrors({ ...errors, examDate: undefined }); }} />
            </Field>
            <Field label="Class">
              <select value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })}><option value={11}>Class 11</option><option value={12}>Class 12</option></select>
            </Field>
          </div>
          <div className="form-row">
            <div className="field">
              <span className="field-label">Preparation level</span>
              <Segmented block label="Preparation level" options={LEVELS} value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="plan-hours"><span>Study hours per day</span><span className="strong num">{form.hoursPerDay} h</span></label>
              <input id="plan-hours" type="range" min="1" max="14" step="0.5" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} />
              <div className="range-scale text-xs muted num"><span>1 h</span><span>14 h</span></div>
            </div>
          </div>
          <div className="field">
            <span className="field-label">Subjects</span>
            <div className="row wrap" role="group" aria-label="Subjects">
              {EXAM_SUBJECTS[form.exam].map((s) => {
                const on = form.subjects.includes(s);
                return (
                  <label key={s} className={`chip-toggle ${on ? 'on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => { toggleSubject(s); setErrors({ ...errors, subjects: undefined }); }} />
                    <span className="box"><IconCheck /></span>{s}
                  </label>
                );
              })}
            </div>
            {errors.subjects && <div className="field-error"><IconAlertCircle /> {errors.subjects}</div>}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title"><span className="step-badge">2</span> Chapters done or difficult <span className="muted text-sm" style={{ fontWeight: 400 }}>(optional)</span></h2>
            <div className="card-subtitle">Completed chapters are skipped. Weak chapters are scheduled earlier with 25% more time.</div>
          </div>
          <div className="row">
            <span className="badge badge-success num">{counts.done} done</span>
            <span className="badge badge-warning num">{counts.weak} weak</span>
          </div>
        </div>
        <div className="card-body">
          {sylLoading ? <ListSkeleton rows={3} /> : subjects.length === 0 ? (
            <p className="muted text-sm">Select at least one subject to mark chapters.</p>
          ) : subjects.map((s) => {
            const isOpen = openSubject === s.subject;
            const marked = s.chapters.filter((c) => chapterState[`${s.subject}|${c.name}`]).length;
            return (
              <div key={s.subject} className="accordion">
                <button type="button" className="accordion-trigger" aria-expanded={isOpen} onClick={() => setOpenSubject(isOpen ? null : s.subject)}>
                  <IconChevron className="chev" />
                  <span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[s.subject], fontSize: 'var(--text-base)' }}><span className="dot" />{s.subject}</span>
                  <span className="grow" />
                  <span className="text-sm muted num">{marked ? `${marked} marked · ` : ''}{s.chapters.length} chapters</span>
                </button>
                {isOpen && (
                  <div className="accordion-panel">
                    <ul className="chapter-list">
                      {s.chapters.map((c) => {
                        const key = `${s.subject}|${c.name}`;
                        const st = chapterState[key];
                        return (
                          <li key={key} className="chapter-row">
                            <div className="grow">
                              <div className="medium">{c.name}</div>
                              <div className="text-xs muted">Class {c.classLevel} · {c.priority} priority</div>
                            </div>
                            <Segmented size="sm" label={`Status of ${c.name}`} value={st}
                              options={[{ value: 'done', label: 'Done', tone: 'success' }, { value: 'weak', label: 'Weak', tone: 'warning' }]}
                              onChange={(v) => setChapter(key, v)} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="form-actions">
        {hasPlan && <span className="text-sm muted grow">Regenerating keeps completed work and replaces only future pending tasks.</span>}
        <div className="row">
          {hasPlan && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <IconCalendar />} {busy ? 'Generating plan' : hasPlan ? 'Regenerate plan' : 'Generate study plan'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------- Plan viewer ---------- */
function PlanView({ data, onRegenerate, reload }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { plan, stats } = data;
  const startFrom = todayISO() > plan.startDate ? todayISO() : plan.startDate;
  const [from, setFrom] = useState(startFrom);
  const [days, setDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rebalancing, setRebalancing] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [retry, setRetry] = useState(0);
  const to = addDaysISO(from, 6);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api.get(`/plan/tasks?from=${from}&to=${to}`)
      .then((r) => { if (active) setDays(r.data.days); })
      .catch((err) => { if (active) setLoadError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, plan._id, retry]);

  async function rebalance() {
    const ok = await confirm({
      title: 'Reschedule missed tasks?',
      description: 'Unfinished topics from earlier days are moved into the schedule from today. Completed work is not affected.',
      confirmLabel: 'Reschedule', tone: 'primary',
    });
    if (!ok) return;
    setRebalancing(true);
    try {
      const res = await api.post('/plan/rebalance');
      toast.success(res.data.message || 'Plan adjusted');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRebalancing(false);
    }
  }

  const onTaskChange = (task) => setDays((ds) => ds.map((d) => ({ ...d, tasks: d.tasks.map((t) => (t._id === task._id ? task : t)) })));
  const pct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const s = plan.summary;
  const today = todayISO();
  const strategy = plan.strategy?.text || '';
  const longStrategy = strategy.length > 420;

  return (
    <div className="stack">
      <PageHeader
        title="Study plan"
        description={<span className="num">{plan.exam} · {formatDate(plan.startDate)} – {formatDate(plan.examDate)} · {plan.hoursPerDay} h/day · {plan.level}</span>}
        actions={<>
          <button type="button" className="btn btn-secondary" onClick={rebalance} disabled={rebalancing}>
            {rebalancing ? <span className="spinner" aria-hidden="true" /> : <IconRefresh />} {rebalancing ? 'Adjusting' : 'Reschedule missed'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRegenerate}><IconSettings /> Edit plan</button>
        </>}
      />

      {stats.missed > 0 && (
        <div className="alert alert-warning">
          <IconAlert />
          <div className="alert-body"><div className="alert-title">{stats.missed} pending task{stats.missed === 1 ? '' : 's'} from previous days</div>Reschedule them to spread unfinished topics across the days ahead.</div>
          <div className="alert-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={rebalance} disabled={rebalancing}>Reschedule</button></div>
        </div>
      )}

      <div className="split">
        <section className="card" aria-labelledby="schedule-title">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="schedule-title">Schedule</h2>
              <div className="card-subtitle num">{formatDate(from, { day: 'numeric', month: 'short' })} – {formatDate(to, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div className="week-nav" role="group" aria-label="Change week">
              <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => setFrom(addDaysISO(from, -7))} disabled={from <= plan.startDate} aria-label="Previous week"><IconChevronLeft /></button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFrom(startFrom)} disabled={from === startFrom}>This week</button>
              <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => setFrom(addDaysISO(from, 7))} disabled={to >= plan.examDate} aria-label="Next week"><IconChevron /></button>
            </div>
          </div>
          <div className="card-body">
            {loading ? <ListSkeleton rows={5} /> : loadError ? <ErrorState message={loadError} onRetry={() => setRetry((n) => n + 1)} /> : days.length === 0 ? (
              <EmptyState icon={<IconCalendar />} title="No tasks in this range" text="Try another week." />
            ) : (
              <div className="days">
                {days.map((d) => {
                  const mins = d.tasks.reduce((n, t) => n + t.durationMinutes, 0);
                  const done = d.tasks.filter((t) => t.status === 'completed').length;
                  const isToday = d.date === today;
                  const isPast = d.date < today;
                  return (
                    <section key={d.date} className={`day ${isToday ? 'is-today' : ''} ${isPast ? 'is-past' : ''}`} aria-label={formatDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}>
                      <div className="day-head">
                        <div className="row">
                          <span className="day-name">{formatDate(d.date, { weekday: 'long' })}</span>
                          <span className="muted num">{formatDate(d.date, { day: 'numeric', month: 'short' })}</span>
                          {isToday && <span className="badge badge-solid">Today</span>}
                        </div>
                        <span className="text-sm muted num">{done}/{d.tasks.length} done · {formatMinutes(mins)}</span>
                      </div>
                      <div className="task-list">
                        {d.tasks.map((t) => <TaskItem key={t._id} task={t} onChange={onTaskChange} />)}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="stack">
          <section className="card">
            <div className="card-header"><h2 className="card-title">Overview</h2><span className="badge badge-neutral num">{stats.daysLeft} days left</span></div>
            <div className="card-body stack-4">
              <div>
                <div className="row between text-sm"><span className="muted">Tasks completed</span><span className="num"><span className="strong">{stats.completed}</span> <span className="muted">/ {stats.total}</span></span></div>
                <div className="mt-2"><ProgressBar value={pct} label="Plan completion" /></div>
              </div>
              <dl className="stat-grid">
                <div><dt>Topics</dt><dd className="num">{s.topicsScheduled}</dd></div>
                <div><dt>Study days</dt><dd className="num">{s.studyDays}</dd></div>
                <div><dt>Mock tests</dt><dd className="num">{s.mockTests}</dd></div>
                <div><dt>Final revision</dt><dd className="num">{s.finalRevisionDays} <small>days</small></dd></div>
              </dl>
              {s.compressed && (
                <div className="alert alert-warning">
                  <IconAlert />
                  <div className="alert-body">Time is tight: durations were compressed{s.topicsSkipped ? ` and ${s.topicsSkipped} low-priority topic${s.topicsSkipped === 1 ? ' was' : 's were'} left out` : ''}. Increase daily hours for fuller coverage.</div>
                </div>
              )}
            </div>
          </section>

          {strategy && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><IconSparkle /> Strategy</h2>
                <span className={`badge ${plan.strategy?.source === 'ai' ? 'badge-primary' : 'badge-neutral'}`}>{plan.strategy?.source === 'ai' ? 'AI personalised' : 'Rule-based'}</span>
              </div>
              <div className="card-body">
                <div className={`strategy-text prewrap ${longStrategy && !showStrategy ? 'clamped' : ''}`}>{strategy}</div>
                {longStrategy && (
                  <button type="button" className="link text-sm mt-3" onClick={() => setShowStrategy((v) => !v)} aria-expanded={showStrategy}>
                    {showStrategy ? 'Show less' : 'Read full strategy'}
                  </button>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
