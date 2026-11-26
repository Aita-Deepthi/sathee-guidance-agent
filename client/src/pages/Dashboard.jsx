import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { EmptyState, ErrorState } from '../components/States';
import { ProgressBar, Metric } from '../components/Progress';
import { PageSkeleton, ListSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import TaskItem from '../components/TaskItem';
import ActivityBars from '../components/ActivityBars';
import {
  IconCalendar, IconAlert, IconRefresh, IconSparkle, IconArrowRight, IconCheck, IconExternal,
  IconTarget, IconFire, IconListChecks, IconClock, IconTest, IconFlag, IconChart,
} from '../components/Icons';
import { SUBJECT_COLORS, formatDate, formatMinutes, TASK_TYPE_LABEL, todayISO } from '../utils/format';

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function scoreTone(p) { return p >= 60 ? 'success' : p >= 35 ? 'warning' : 'danger'; }

export default function Dashboard() {
  const { data, loading, error, reload, setData } = useApi('/dashboard');
  const { data: summary, reload: reloadSummary } = useApi('/progress/summary');

  if (loading && !data) return <PageSkeleton variant="dashboard" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const d = data;

  // Update the ticked task instantly, then refresh server-computed totals
  const onTaskChange = (task) => {
    setData((prev) => ({ ...prev, today: { ...prev.today, tasks: prev.today.tasks.map((t) => (t._id === task._id ? task : t)) } }));
    reload();
    reloadSummary();
  };

  const todayPct = d.today.total ? Math.round((d.today.completed / d.today.total) * 100) : 0;
  const totalChapters = d.syllabus.bySubject.reduce((n, s) => n + s.totalChapters, 0);
  const doneChapters = d.syllabus.bySubject.reduce((n, s) => n + s.completedChapters, 0);
  const firstName = d.name.split(' ')[0];

  return (
    <div className="stack dashboard">
      <PageHeader
        eyebrow={formatDate(d.today.date || todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting()}, ${firstName}`}
        description={`${d.profile.exam} · Class ${d.profile.classLevel} · ${d.profile.level}`}
        actions={<>
          <Link className="btn btn-secondary" to="/assistant"><IconSparkle /> Ask assistant</Link>
          <Link className="btn btn-primary" to="/progress"><IconListChecks /> Log today</Link>
        </>}
      />

      {d.missedTasks > 0 && (
        <div className="alert alert-warning">
          <IconAlert />
          <div className="alert-body"><div className="alert-title">{d.missedTasks} task{d.missedTasks === 1 ? '' : 's'} from earlier days still pending</div>Adjust your plan to reschedule unfinished topics from today.</div>
          <div className="alert-actions"><Link className="btn btn-secondary btn-sm" to="/plan"><IconRefresh /> Adjust plan</Link></div>
        </div>
      )}

      <section className="card" aria-label="Key numbers">
        <div className="metrics">
          <Metric icon={<IconFlag />} label="Exam in"
            value={d.daysLeft !== null ? d.daysLeft : '—'} unit={d.daysLeft !== null ? (d.daysLeft === 1 ? 'day' : 'days') : ''}
            hint={d.profile.examDate ? formatDate(d.profile.examDate) : <Link className="link" to="/profile">Set exam date</Link>} />
          <Metric icon={<IconListChecks />} label="Today"
            value={d.today.total ? `${d.today.completed}/${d.today.total}` : '—'} unit={d.today.total ? 'tasks' : ''}
            hint={d.today.total ? `${formatMinutes(d.today.minutesStudied)} of ${formatMinutes(d.today.targetMinutes)} logged` : 'Nothing scheduled'} />
          <Metric icon={<IconTarget />} label="Syllabus" value={`${d.syllabus.percent}%`}
            hint={`${doneChapters} of ${totalChapters} chapters complete`} />
          <Metric icon={<IconFire />} label="Study streak" value={d.streak.current} unit={d.streak.current === 1 ? 'day' : 'days'}
            hint={`${d.streak.activeDays} active day${d.streak.activeDays === 1 ? '' : 's'} in total`} />
        </div>
      </section>

      <div className="split">
        {/* ---------- Primary column ---------- */}
        <div className="stack">
          <NextAction d={d} onTaskChange={onTaskChange} />

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Today's plan</h2>
                <div className="card-subtitle num">
                  {d.today.total ? `${d.today.completed} of ${d.today.total} done · ${formatMinutes(d.today.targetMinutes)} planned` : 'No tasks scheduled for today'}
                </div>
              </div>
              {d.today.total > 0 && <span className={`badge ${todayPct === 100 ? 'badge-success' : 'badge-neutral'} num`}>{todayPct}%</span>}
            </div>
            {d.today.total > 0 && <div className="card-progress"><ProgressBar value={todayPct} size="sm" label="Today's tasks completed" /></div>}
            <div className="card-body tight">
              {d.today.tasks.length === 0 ? (
                <EmptyState compact icon={<IconCalendar />} title={d.hasPlan ? 'A free day' : 'No plan yet'}
                  text={d.hasPlan ? 'Use it to revise a weak chapter or attempt a practice test.' : 'Daily tasks appear here once your study plan is created.'}
                  action={d.hasPlan ? 'Browse mock tests' : undefined} to={d.hasPlan ? '/tests' : undefined} />
              ) : (
                <div className="task-list">
                  {d.today.tasks.map((t) => <TaskItem key={t._id} task={t} onChange={onTaskChange} compact />)}
                </div>
              )}
            </div>
            {d.today.total > 0 && (
              <div className="card-footer">
                <span className="text-sm muted">Log time, questions and notes for each task</span>
                <Link to="/progress" className="link text-sm">Daily progress <IconArrowRight /></Link>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div><h2 className="card-title">Coming up</h2><div className="card-subtitle">Next three days</div></div>
              <Link to="/plan" className="link text-sm">Full plan <IconArrowRight /></Link>
            </div>
            {d.upcoming.length === 0 ? (
              <EmptyState compact title="Nothing scheduled" text={d.hasPlan ? 'No pending tasks in the next three days.' : 'Your upcoming tasks will appear here.'} />
            ) : (
              <UpcomingList tasks={d.upcoming} />
            )}
          </section>
        </div>

        {/* ---------- Secondary column ---------- */}
        <aside className="stack" aria-label="Progress overview">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Preparation progress</h2>
              <Link to="/analytics" className="link-muted text-sm" aria-label="Open analytics"><IconChart width={16} height={16} /></Link>
            </div>
            <div className="card-body stack-4">
              {d.syllabus.bySubject.map((s) => (
                <div key={s.subject} className="subject-progress">
                  <div className="row between">
                    <span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[s.subject] }}><span className="dot" />{s.subject}</span>
                    <span className="text-sm num"><span className="strong">{s.percent}%</span> <span className="muted">· {s.completedChapters}/{s.totalChapters} ch</span></span>
                  </div>
                  <ProgressBar value={s.percent} color={SUBJECT_COLORS[s.subject]} size="sm" label={`${s.subject} progress`} />
                </div>
              ))}
              {d.syllabus.bySubject.length === 0 && <p className="muted text-sm">Subject progress appears once your syllabus is loaded.</p>}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div><h2 className="card-title">Study activity</h2><div className="card-subtitle">Minutes logged, last 14 days</div></div>
            </div>
            <div className="card-body">
              {!summary ? <ListSkeleton rows={2} /> : <ActivityBars days={summary.last14} />}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div><h2 className="card-title">Focus areas</h2><div className="card-subtitle">Marked weak or low test accuracy</div></div>
            </div>
            {d.weakTopics.length === 0 ? (
              <div className="card-body"><p className="text-sm muted">No weak areas yet. Mark difficult chapters in your plan or take a test to surface them.</p></div>
            ) : (
              <ul className="list">
                {d.weakTopics.map((w) => (
                  <li key={w.chapter} className="list-item">
                    <span className="dot" style={{ '--subject': SUBJECT_COLORS[w.subject] }} />
                    <div className="li-main"><div className="li-title">{w.chapter}</div><div className="li-sub">{w.subject}</div></div>
                    <span className={`badge ${w.source === 'tests' ? 'badge-danger' : 'badge-warning'}`}>{w.source === 'tests' ? 'From tests' : 'Self-marked'}</span>
                  </li>
                ))}
              </ul>
            )}
            {d.weakTopics.length > 0 && (
              <div className="card-footer"><span className="text-sm muted">Targeted practice helps most</span><Link to="/tests?section=topic" className="link text-sm">Practise <IconArrowRight /></Link></div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Recent tests</h2>
              <Link to="/tests" className="link text-sm">All tests <IconArrowRight /></Link>
            </div>
            {d.recentTests.length === 0 ? (
              <EmptyState compact icon={<IconTest />} title="No attempts yet" text="Your scores will appear here after your first mock test." action="Start a test" to="/tests" />
            ) : (
              <ul className="list">
                {d.recentTests.map((r) => (
                  <li key={r._id}>
                    <Link to={`/results/${r._id}`} className="list-item">
                      <div className="li-main"><div className="li-title">{r.testTitle}</div><div className="li-sub num">{formatDate(r.createdAt)} · {r.score}/{r.maxScore}</div></div>
                      <span className={`badge badge-${scoreTone(r.percentage)} num`}>{r.percentage}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Recommended next action: derived only from the student's real state ---------- */
function NextAction({ d, onTaskChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const next = d.today.tasks.find((t) => t.status !== 'completed');

  async function complete() {
    setBusy(true);
    try {
      const res = await api.patch(`/tasks/${next._id}`, { status: 'completed' });
      onTaskChange(res.data.task);
      toast.success(res.data.chapterCompleted ? `Chapter completed: ${next.chapter}` : 'Task completed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  let content;
  if (!d.hasPlan) {
    content = {
      label: 'Get started', title: 'Create your personalised study plan',
      text: 'The planner schedules every syllabus topic between today and your exam, with weekly revision and mock tests.',
      actions: <Link to="/plan" className="btn btn-primary"><IconCalendar /> Create study plan</Link>,
    };
  } else if (next) {
    const color = SUBJECT_COLORS[next.subject] || SUBJECT_COLORS.Mixed;
    content = {
      label: 'Up next', subject: next.subject, color,
      title: <>{next.topic}{next.part ? <span className="muted"> · {next.part}</span> : null}</>,
      meta: [next.chapter, TASK_TYPE_LABEL[next.type], formatMinutes(next.durationMinutes), next.practiceTarget ? `${next.practiceTarget} questions` : null].filter(Boolean),
      objectives: (next.objectives || []).slice(0, 3),
      actions: <>
        <button type="button" className="btn btn-primary" onClick={complete} disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <IconCheck />} {busy ? 'Saving' : 'Mark as done'}
        </button>
        {next.video?.url && (
          <a className="btn btn-secondary" href={next.video.url} target="_blank" rel="noreferrer"><IconExternal /> {next.video.kind === 'search' ? 'Find lectures' : 'Watch lecture'}</a>
        )}
        <Link to="/assistant" className="btn btn-ghost"><IconSparkle /> Ask a doubt</Link>
      </>,
    };
  } else if (d.today.total > 0) {
    const weak = d.weakTopics[0];
    content = {
      label: 'Today complete', tone: 'success', title: "You've finished today's plan",
      text: weak ? `Good time for targeted practice — ${weak.chapter} (${weak.subject}) is in your focus areas.` : 'Lock in what you learned with a timed practice test.',
      actions: <>
        <Link to={weak ? '/tests?section=topic' : '/tests'} className="btn btn-primary"><IconTest /> {weak ? 'Practise focus area' : 'Take a test'}</Link>
        <Link to="/plan" className="btn btn-secondary">Preview tomorrow</Link>
      </>,
    };
  } else {
    const up = d.upcoming[0];
    content = {
      label: 'No tasks today', title: up ? `Next: ${up.topic}` : 'Nothing scheduled today',
      text: up ? `${up.subject} · scheduled for ${formatDate(up.date, { weekday: 'long', day: 'numeric', month: 'short' })}. You can get ahead or revise.` : 'Use the time to revise or attempt a practice test.',
      actions: <>
        <Link to="/tests" className="btn btn-primary"><IconTest /> Practice test</Link>
        <Link to="/plan" className="btn btn-secondary">Open plan</Link>
      </>,
    };
  }

  return (
    <section className={`card next-action ${content.tone ? `tone-${content.tone}` : ''}`} aria-labelledby="next-action-title" style={{ '--subject': content.color }}>
      <div className="next-action-body">
        <div className="next-action-label">
          {content.tone === 'success' ? <IconCheck width={14} height={14} /> : <IconClock width={14} height={14} />}
          <span>{content.label}</span>
          {content.subject && <span className="subject-tag"><span className="dot" />{content.subject}</span>}
        </div>
        <h2 id="next-action-title" className="next-action-title">{content.title}</h2>
        {content.meta && <div className="next-action-meta">{content.meta.map((m) => <span key={m}>{m}</span>)}</div>}
        {content.text && <p className="next-action-text">{content.text}</p>}
        {content.objectives?.length > 0 && (
          <ul className="next-action-objectives">{content.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        )}
        <div className="next-action-actions">{content.actions}</div>
      </div>
    </section>
  );
}

function UpcomingList({ tasks }) {
  const groups = tasks.reduce((acc, t) => { (acc[t.date] = acc[t.date] || []).push(t); return acc; }, {});
  return (
    <div className="upcoming">
      {Object.entries(groups).map(([date, list]) => (
        <div key={date} className="upcoming-day">
          <div className="upcoming-date">
            <span className="upcoming-dow">{formatDate(date, { weekday: 'short' })}</span>
            <span className="upcoming-dom num">{formatDate(date, { day: 'numeric' })}</span>
          </div>
          <ul className="list grow">
            {list.map((t) => (
              <li key={t._id} className="list-item">
                <span className="dot" style={{ '--subject': SUBJECT_COLORS[t.subject] }} />
                <div className="li-main"><div className="li-title">{t.topic}</div><div className="li-sub">{t.subject}{t.chapter ? ` · ${t.chapter}` : ''}</div></div>
                <span className="text-xs muted nowrap hide-sm">{TASK_TYPE_LABEL[t.type]} · {formatMinutes(t.durationMinutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
