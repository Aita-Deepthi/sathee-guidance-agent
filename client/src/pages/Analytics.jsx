import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import useApi from '../hooks/useApi';
import { EmptyState, ErrorState } from '../components/States';
import { PageSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Segmented from '../components/ui/Segmented';
import { Metric, ProgressBar } from '../components/Progress';
import { IconChart, IconClock, IconFire, IconTest, IconTarget, IconTrend, IconAlert, IconCheckCircle } from '../components/Icons';
import { SUBJECT_COLORS, CHART } from '../utils/format';

const tip = CHART.tooltip;

function ChartCard({ title, subtitle, children, action, empty }) {
  return (
    <section className="card">
      <div className="card-header">
        <div><h2 className="card-title">{title}</h2>{subtitle && <div className="card-subtitle">{subtitle}</div>}</div>
        {action}
      </div>
      <div className="card-body">{empty || children}</div>
    </section>
  );
}

export default function Analytics() {
  const { data, loading, error, reload } = useApi('/analytics');
  const [chapterSubject, setChapterSubject] = useState(null);

  if (loading && !data) return <PageSkeleton variant="charts" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const d = data;
  const o = d.overall;
  const chSubject = chapterSubject || d.chapterCompletion[0]?.subject;
  const chData = (d.chapterCompletion.find((c) => c.subject === chSubject)?.chapters || [])
    .map((c) => ({ ...c, short: c.name.length > 22 ? c.name.slice(0, 21) + '…' : c.name }));
  const noActivity = o.tasksCompleted === 0 && o.testsTaken === 0;
  const hasHours = d.weeklyHours.some((w) => w.hours > 0);
  const hasDaily = d.daily.some((x) => x.planned > 0 || x.completed > 0);

  return (
    <div className="stack">
      <PageHeader title="Analytics" description="Calculated only from your own tasks, study logs and test results." />

      {noActivity && (
        <div className="alert alert-info"><IconChart /><div className="alert-body"><div className="alert-title">Your charts fill in as you study</div>Complete study tasks or take a mock test to see trends here.</div></div>
      )}

      <section className="card" aria-label="Summary">
        <div className="metrics">
          <Metric icon={<IconTarget />} label="Syllabus" value={`${o.syllabusPercent}%`} hint={`${o.taskCompletionPercent}% of planned tasks done`} />
          <Metric icon={<IconClock />} label="Study hours" value={o.totalHours} unit="h" hint={`Last 8 weeks · ${o.tasksCompleted} tasks`} />
          <Metric icon={<IconTest />} label="Average mock score" value={o.averageMockPercent !== null ? `${o.averageMockPercent}%` : '—'} hint={`${o.testsTaken} test${o.testsTaken === 1 ? '' : 's'} taken`} />
          <Metric icon={<IconFire />} label="Streak" value={o.streak.current} unit={o.streak.current === 1 ? 'day' : 'days'} hint={`${o.streak.activeDays} active days`} />
        </div>
      </section>

      <div className="grid-2">
        <ChartCard title="Subject progress" subtitle="Topics completed per subject">
          <div className="stack-4">
            {d.subjectProgress.map((s) => (
              <div key={s.subject} className="stack-2">
                <div className="row between text-sm">
                  <span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[s.subject], fontSize: 'var(--text-sm)' }}><span className="dot" />{s.subject}</span>
                  <span className="num"><span className="strong">{s.percent}%</span></span>
                </div>
                <ProgressBar value={s.percent} color={SUBJECT_COLORS[s.subject]} label={`${s.subject} progress`} />
                <div className="text-xs muted num">{s.doneTopics}/{s.totalTopics} topics · {s.completedChapters}/{s.totalChapters} chapters</div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Weekly study hours" subtitle="Logged time on completed tasks, last 8 weeks"
          empty={!hasHours && <EmptyState compact icon={<IconClock />} title="No study time logged yet" text="Log time on a task to start this chart." action="Log today" to="/progress" />}>
          <div className="chart" role="img" aria-label={`Weekly study hours: ${d.weeklyHours.map((w) => `${w.week} ${w.hours} hours`).join(', ')}`}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.weeklyHours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="week" tick={CHART.axis} tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis tick={CHART.axis} tickLine={false} axisLine={false} allowDecimals />
                <Tooltip {...tip} formatter={(v) => [`${v} h`, 'Studied']} labelFormatter={(l) => `Week of ${l}`} />
                <Bar dataKey="hours" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Mock test scores" subtitle="Percentage per attempt, oldest to newest"
          empty={d.mockPerformance.length === 0 && <EmptyState compact icon={<IconTest />} title="No tests yet" text="Take a mock test to track your scores over time." action="Go to mock tests" to="/tests" />}>
          <div className="chart" role="img" aria-label={`Mock test scores: ${d.mockPerformance.map((m) => `${m.percentage}%`).join(', ')}`}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.mockPerformance.map((m, i) => ({ ...m, n: `#${i + 1}` }))} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="n" tick={CHART.axis} tickLine={false} axisLine={{ stroke: CHART.grid }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={CHART.axis} tickLine={false} axisLine={false} />
                <Tooltip {...tip} cursor={{ stroke: CHART.secondary, strokeWidth: 1 }} formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(l, p) => (p && p[0] ? `${p[0].payload.title} · ${p[0].payload.date}` : l)} />
                <Line type="monotone" dataKey="percentage" stroke={CHART.primary} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: CHART.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {d.subjectAccuracy.length > 0 && (
            <div className="stack-3 mt-4">
              <div className="overline">Accuracy by subject</div>
              {d.subjectAccuracy.map((s) => (
                <div key={s.subject} className="stack-1">
                  <div className="row between text-sm"><span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[s.subject] }}><span className="dot" />{s.subject}</span><span className="num muted">{s.correct}/{s.total} · <span className="strong">{s.accuracy}%</span></span></div>
                  <ProgressBar value={s.accuracy} color={SUBJECT_COLORS[s.subject]} size="sm" label={`${s.subject} accuracy`} />
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Daily activity" subtitle="Planned vs completed tasks, last 14 days"
          empty={!hasDaily && <EmptyState compact icon={<IconTrend />} title="No scheduled tasks yet" text="Create a study plan to compare planned and completed work." action="Open study plan" to="/plan" />}>
          <div className="chart" role="img" aria-label="Planned versus completed tasks for each of the last 14 days">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" tick={CHART.axis} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={1} />
                <YAxis tick={CHART.axis} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tip} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#344054', paddingTop: 8 }} />
                <Bar dataKey="planned" name="Planned" fill={CHART.secondary} radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="completed" name="Completed" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Chapter completion" subtitle={`${chSubject || ''} · topics completed per chapter`}
        action={d.chapterCompletion.length > 1 && (
          <Segmented size="sm" label="Subject" value={chSubject} onChange={setChapterSubject} options={d.chapterCompletion.map((c) => c.subject)} />
        )}>
        <div className="chart" role="img" aria-label={`Chapter completion for ${chSubject}`}>
          <ResponsiveContainer width="100%" height={Math.max(260, chData.length * 28)}>
            <BarChart data={chData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={CHART.axis} tickLine={false} axisLine={false} unit="%" />
              <YAxis type="category" dataKey="short" width={180} tick={{ ...CHART.axis, fill: '#344054' }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} formatter={(v, n, p) => [`${v}%${p.payload.completed ? ' · complete' : ''}`, 'Topics done']} labelFormatter={(l, p) => (p && p[0] ? p[0].payload.name : l)} />
              <Bar dataKey="percent" fill={SUBJECT_COLORS[chSubject] || CHART.primary} radius={[0, 4, 4, 0]} background={{ fill: CHART.track, radius: 4 }} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {d.chapterAccuracy?.length > 0 && (
        <section className="card">
          <div className="card-header"><div><h2 className="card-title">Chapter accuracy in tests</h2><div className="card-subtitle">Across full-length and topic-wise attempts</div></div></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Chapter</th><th>Subject</th><th className="right">Correct</th><th className="right">Accuracy</th></tr></thead>
              <tbody>
                {d.chapterAccuracy.map((c) => (
                  <tr key={`${c.subject}-${c.chapter}`}>
                    <td className="medium">{c.chapter}</td>
                    <td><span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[c.subject] }}><span className="dot" />{c.subject}</span></td>
                    <td className="right">{c.correct}/{c.total}</td>
                    <td className="right"><span className={`badge badge-${c.accuracy >= 60 ? 'success' : c.accuracy >= 35 ? 'warning' : 'danger'}`}>{c.accuracy}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-header"><h2 className="card-title"><IconCheckCircle /> Strengths</h2></div>
          {d.strengths.length === 0 ? <div className="card-body"><p className="muted text-sm">Strengths appear as you complete chapters and score well in tests.</p></div> : (
            <ul className="list">{d.strengths.map((s) => <li key={s.name} className="list-item"><div className="li-main"><div className="li-title">{s.name}</div></div><span className="badge badge-success">{s.reason}</span></li>)}</ul>
          )}
        </section>
        <section className="card">
          <div className="card-header"><h2 className="card-title"><IconAlert /> Needs attention</h2></div>
          {d.weaknesses.length === 0 ? <div className="card-body"><p className="muted text-sm">No weak areas detected yet.</p></div> : (
            <ul className="list">{d.weaknesses.map((s) => <li key={s.name} className="list-item"><div className="li-main"><div className="li-title">{s.name}</div></div><span className="badge badge-danger">{s.reason}</span></li>)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
