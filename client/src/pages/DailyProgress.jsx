import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { EmptyState, ErrorState } from '../components/States';
import { PageSkeleton, ListSkeleton, Skeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import TaskItem from '../components/TaskItem';
import ActivityBars from '../components/ActivityBars';
import { ProgressBar, ProgressRing } from '../components/Progress';
import { IconClock, IconFire, IconTarget, IconCheckCircle, IconCalendar, IconChevron, IconChevronLeft, IconPlay, IconExternal, IconNote } from '../components/Icons';
import { SUBJECT_COLORS, formatDate, formatMinutes, todayISO, addDaysISO } from '../utils/format';

export default function DailyProgress() {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState(null);
  const [summary, setSummary] = useState(null);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [error, setError] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [openSubject, setOpenSubject] = useState(null);
  const [selectedLearningTaskId, setSelectedLearningTaskId] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [chapterBusy, setChapterBusy] = useState('');

  const loadDay = useCallback(async () => {
    try {
      const r = await api.get('/progress/day', { params: { date } });
      setDay(r.data);
      setNote(r.data.note || '');
      setSavedNote(r.data.note || '');
      setError(null);
    } catch (err) { setError(errorMessage(err)); }
  }, [date]);
  const loadSummary = useCallback(async () => {
    try {
      const r = await api.get('/progress/summary');
      setSummary(r.data);
    } catch (err) { setError(errorMessage(err)); }
  }, []);

  useEffect(() => { setDay(null); loadDay(); }, [loadDay]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  const learningTasks = (day?.tasks || []).filter((task) => task.subject !== 'Mixed' && task.chapter);
  const selectedLearningTask = learningTasks.find((task) => task._id === selectedLearningTaskId) || learningTasks[0];

  useEffect(() => {
    if (!selectedLearningTask) {
      setSelectedLearningTaskId('');
      setRecommendations(null);
      return;
    }
    if (selectedLearningTask._id !== selectedLearningTaskId) setSelectedLearningTaskId(selectedLearningTask._id);
  }, [selectedLearningTask, selectedLearningTaskId]);

  useEffect(() => {
    if (!selectedLearningTask) return;
    let active = true;
    setRecommendationsLoading(true);
    setRecommendationsError('');
    api.get('/resources/recommendations', { params: { taskId: selectedLearningTask._id } })
      .then((response) => { if (active) setRecommendations(response.data); })
      .catch((err) => { if (active) setRecommendationsError(errorMessage(err)); })
      .finally(() => { if (active) setRecommendationsLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLearningTask?._id]);

  // Update instantly, then refresh numbers from the server
  const onTaskChange = (task) => {
    setDay((d) => ({ ...d, tasks: d.tasks.map((t) => (t._id === task._id ? task : t)) }));
    loadDay();
    loadSummary();
  };

  async function saveNote(e) {
    e?.preventDefault();
    setSavingNote(true);
    try {
      await api.put('/progress/note', { date, note });
      setSavedNote(note);
      toast.success('Note saved');
    } catch (err) { toast.error(errorMessage(err)); } finally { setSavingNote(false); }
  }

  async function toggleChapter(subject, chapter, completed) {
    setChapterBusy(`${subject}|${chapter}`);
    try {
      await api.post('/profile/chapters', { subject, chapter, completed });
      toast.success(completed ? `Marked “${chapter}” as completed` : `Marked “${chapter}” as pending`);
      await loadSummary();
    } catch (err) { toast.error(errorMessage(err)); } finally { setChapterBusy(''); }
  }

  if (error && !day && !summary) return <ErrorState message={error} onRetry={() => { loadDay(); loadSummary(); }} />;
  if (!day && !summary) return <PageSkeleton variant="split" />;
  const s = day?.summary;
  const isToday = date === todayISO();
  const noteDirty = note !== savedNote;

  return (
    <div className="stack">
      <PageHeader
        title="Daily progress"
        description="Tick off tasks, log study time and questions, and keep notes for each day."
        actions={
          <div className="date-nav" role="group" aria-label="Choose day">
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Previous day"><IconChevronLeft /></button>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Next day"><IconChevron /></button>
            <button type="button" className="btn btn-secondary" onClick={() => setDate(todayISO())} disabled={isToday}>Today</button>
          </div>
        }
      />

      <div className="split">
        <div className="stack">
          <section className="card" aria-labelledby="day-title">
            <div className="card-header">
              <div>
                <h2 className="card-title" id="day-title">{isToday ? "Today's tasks" : formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                {s && <div className="card-subtitle num">{s.completed} of {s.total} complete</div>}
              </div>
              {s && <span className={`badge ${s.percent === 100 && s.total ? 'badge-success' : 'badge-neutral'} num`}>{s.percent}%</span>}
            </div>
            {!day ? <div className="card-body"><ListSkeleton rows={4} /></div> : (
              <>
                <div className="targets">
                  <Target icon={<IconClock />} label="Study time" value={formatMinutes(s.minutesStudied)} of={formatMinutes(s.targetMinutes)}
                    pct={s.targetMinutes ? (s.minutesStudied / s.targetMinutes) * 100 : 0} color="var(--subject-chemistry)" />
                  <Target icon={<IconTarget />} label="Questions" value={s.questionsSolved} of={s.targetQuestions}
                    pct={s.targetQuestions ? (s.questionsSolved / s.targetQuestions) * 100 : 0} color="var(--subject-mathematics)" />
                  <Target icon={<IconCheckCircle />} label="Tasks" value={s.completed} of={s.total} pct={s.percent} />
                </div>
                <div className="card-body">
                  {day.tasks.length === 0 ? (
                    <EmptyState icon={<IconCalendar />} title="No tasks on this day" text="Tasks appear here once your study plan covers this date." action="Open study plan" to="/plan" />
                  ) : (
                    <div className="task-list">{day.tasks.map((t) => <TaskItem key={t._id} task={t} onChange={onTaskChange} />)}</div>
                  )}
                </div>
              </>
            )}
          </section>

          {day && (
            <TopicRecommendations
              tasks={learningTasks}
              selectedTask={selectedLearningTask}
              selectedTaskId={selectedLearningTaskId}
              onSelect={setSelectedLearningTaskId}
              data={recommendations}
              loading={recommendationsLoading}
              error={recommendationsError}
            />
          )}

          <form className="card" onSubmit={saveNote}>
            <div className="card-header">
              <div><h2 className="card-title"><IconNote /> Notes</h2><div className="card-subtitle">Private reflection for {formatDate(date)}</div></div>
              {noteDirty && <span className="badge badge-warning">Unsaved</span>}
            </div>
            <div className="card-body stack-3">
              <label htmlFor="day-note" className="sr-only">Notes for {formatDate(date)}</label>
              <textarea id="day-note" rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did today go? Doubts to ask, topics to revise…" disabled={!day} />
              <div className="row between">
                <span className="text-xs muted num">{note.length}/2000</span>
                <button type="submit" className="btn btn-secondary btn-sm" disabled={savingNote || !noteDirty}>
                  {savingNote && <span className="spinner" aria-hidden="true" />} {savingNote ? 'Saving' : 'Save note'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="stack">
          {!summary ? (
            <div className="card card-pad stack-3"><Skeleton width={120} height={14} /><Skeleton height={120} radius={8} /></div>
          ) : (
            <>
              <section className="card">
                <div className="card-header"><h2 className="card-title">All-time totals</h2></div>
                <dl className="stat-grid card-body">
                  <div><dt><IconFire /> Streak</dt><dd className="num">{summary.streak.current} <small>{summary.streak.current === 1 ? 'day' : 'days'}</small></dd></div>
                  <div><dt><IconClock /> Hours</dt><dd className="num">{summary.totals.hours}</dd></div>
                  <div><dt><IconCheckCircle /> Tasks done</dt><dd className="num">{summary.totals.tasksCompleted}</dd></div>
                  <div><dt><IconTarget /> Questions</dt><dd className="num">{summary.totals.questions}</dd></div>
                </dl>
              </section>

              <section className="card">
                <div className="card-header"><h2 className="card-title">Consistency</h2></div>
                <div className="card-body stack-4">
                  {[['Last 7 days', summary.week], ['Last 30 days', summary.month]].map(([label, r]) => (
                    <div key={label} className="stack-2">
                      <div className="row between text-sm"><span className="medium">{label}</span><span className="num"><span className="strong">{r.percent}%</span></span></div>
                      <ProgressBar value={r.percent} size="sm" label={`${label} completion`} />
                      <div className="text-xs muted num">{r.completedTasks}/{r.plannedTasks} tasks · {formatMinutes(r.minutes)} · {r.activeDays} active days · {r.questions} questions</div>
                    </div>
                  ))}
                  <hr style={{ margin: 0 }} />
                  <ActivityBars days={summary.last14} />
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <div><h2 className="card-title">Chapters</h2><div className="card-subtitle">Auto-completes when all topics are done</div></div>
                  <ProgressRing value={summary.syllabus.percent} size={44} stroke={5} ariaLabel={`${summary.syllabus.percent}% of syllabus complete`} />
                </div>
                <div className="card-body">
                  {summary.syllabus.bySubject.map((sub) => {
                    const isOpen = openSubject === sub.subject;
                    return (
                      <div key={sub.subject} className="accordion">
                        <button type="button" className="accordion-trigger" aria-expanded={isOpen} onClick={() => setOpenSubject(isOpen ? null : sub.subject)}>
                          <IconChevron className="chev" />
                          <span className="subject-tag grow" style={{ '--subject': SUBJECT_COLORS[sub.subject], fontSize: 'var(--text-base)' }}><span className="dot" />{sub.subject}</span>
                          <span className="text-xs muted num">{sub.completedChapters}/{sub.totalChapters}</span>
                        </button>
                        {isOpen && (
                          <ul className="accordion-panel chapter-checklist">
                            {sub.chapters.map((c) => {
                              const key = `${sub.subject}|${c.name}`;
                              return (
                                <li key={c.name}>
                                  <label>
                                    <input type="checkbox" checked={c.completed} disabled={chapterBusy === key} onChange={(e) => toggleChapter(sub.subject, c.name, e.target.checked)} />
                                    <span className={c.completed ? 'muted' : ''}>{c.name}</span>
                                  </label>
                                  <span className="text-xs muted num">{chapterBusy === key ? <span className="spinner spinner-sm" /> : `${c.topicsDone}/${c.topics}`}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Target({ icon, label, value, of, pct, color }) {
  return (
    <div className="target">
      <div className="metric-label">{icon}{label}</div>
      <div className="target-value num"><span className="strong">{value}</span> <span className="muted">/ {of}</span></div>
      <ProgressBar value={pct} color={color} size="sm" label={`${label} progress`} />
    </div>
  );
}

function decodeEntities(text) {
  if (typeof DOMParser === 'undefined') return text;
  return new DOMParser().parseFromString(text || '', 'text/html').documentElement.textContent;
}

function TopicRecommendations({ tasks, selectedTask, selectedTaskId, onSelect, data, loading, error }) {
  return (
    <section className="card" aria-labelledby="rec-title">
      <div className="card-header">
        <div>
          <h2 className="card-title" id="rec-title"><IconPlay /> Lectures for this day's topics</h2>
          {selectedTask && <div className="card-subtitle">{selectedTask.subject} · {selectedTask.chapter}{selectedTask.topic ? ` · ${selectedTask.topic}` : ''}</div>}
        </div>
        {tasks.length > 1 && (
          <select className="rec-select" value={selectedTaskId} onChange={(event) => onSelect(event.target.value)} aria-label="Choose topic">
            {tasks.map((task) => <option key={task._id} value={task._id}>{task.subject} · {task.topic || task.chapter}</option>)}
          </select>
        )}
      </div>
      <div className="card-body">
        {!selectedTask ? (
          <p className="muted text-sm">Topic-specific lectures appear when this day has a scheduled chapter.</p>
        ) : loading ? (
          <div className="video-grid">{[0, 1, 2].map((i) => <div key={i} className="video-card"><Skeleton height={140} radius={0} /><div className="video-meta stack-2"><Skeleton width="80%" /><Skeleton width="40%" height={10} /></div></div>)}</div>
        ) : error ? (
          <div className="alert alert-warning"><div className="alert-body">{error}</div></div>
        ) : data?.notice ? (
          <div className="alert alert-info"><div className="alert-body">{data.notice}</div></div>
        ) : !data?.videos?.length ? (
          <EmptyState compact icon={<IconPlay />} title="No lectures found" text="Try another topic, or search in Learning resources." action="Open resources" to="/resources" />
        ) : (
          <div className="video-grid">
            {data.videos.map((video) => (
              <article key={video.videoId} className="video-card">
                <img className="video-thumb" src={video.thumbnail} alt="" loading="lazy" />
                <div className="video-meta">
                  <div className="video-title">{decodeEntities(video.title)}</div>
                  <div className="video-channel">{decodeEntities(video.channel)}</div>
                  {video.description && <p className="video-desc">{decodeEntities(video.description)}</p>}
                  <div className="video-actions">
                    <a className="btn btn-secondary btn-sm" href={video.url} target="_blank" rel="noreferrer"><IconExternal /> Watch on YouTube</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
