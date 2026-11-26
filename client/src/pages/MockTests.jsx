import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState } from '../components/States';
import { Skeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Field from '../components/ui/Field';
import Segmented from '../components/ui/Segmented';
import { IconClock, IconTest, IconArrowRight, IconRotateCcw, IconAlertCircle, IconInfo, IconTarget } from '../components/Icons';
import { EXAMS, EXAM_SUBJECTS, SUBJECT_COLORS, formatDate } from '../utils/format';

const SECTIONS = ['full', 'topic', 'results'];
function tone(p) { return p >= 60 ? 'success' : p >= 35 ? 'warning' : 'danger'; }

export default function MockTests() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.includes(params.get('section')) ? params.get('section') : 'full';
  const setSection = (s) => setParams(s === 'full' ? {} : { section: s }, { replace: true });
  const [scope, setScope] = useState('mine');
  const { data, loading, error, reload } = useApi(scope === 'all' ? '/tests?exam=all' : '/tests');
  const { data: res, error: resError, reload: reloadRes } = useApi('/tests/results/me');

  const tabs = [
    { id: 'full', label: 'Full mock tests' },
    { id: 'topic', label: 'Topic practice' },
    { id: 'results', label: 'My results', count: res?.results?.length },
  ];

  function onTabKey(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = SECTIONS.indexOf(section);
    const next = SECTIONS[(i + (e.key === 'ArrowRight' ? 1 : -1) + SECTIONS.length) % SECTIONS.length];
    setSection(next);
    setTimeout(() => document.getElementById(`tab-${next}`)?.focus(), 0);
  }

  return (
    <div className="stack">
      <PageHeader title="Mock tests" description="Timed multiple-choice tests with negative marking and instant, explained results. Every attempt feeds your analytics." />

      <div className="tabs" role="tablist" aria-label="Test sections" onKeyDown={onTabKey}>
        {tabs.map((t) => (
          <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" className="tab" aria-selected={section === t.id} aria-controls={`panel-${t.id}`}
            tabIndex={section === t.id ? 0 : -1} onClick={() => setSection(t.id)}>
            {t.label}{t.count ? <span className="count num">{t.count}</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${section}`} aria-labelledby={`tab-${section}`} className="stack">
        {section === 'full' && (
          <>
            <div className="row between wrap">
              <p className="text-sm muted">{scope === 'mine' ? `Showing tests for ${user.profile.exam}` : 'Showing tests for all exams'}</p>
              <Segmented size="sm" label="Exam scope" value={scope} onChange={setScope} options={[{ value: 'mine', label: 'My exam' }, { value: 'all', label: 'All exams' }]} />
            </div>
            {loading && !data ? <PageSkeletonGrid /> : error ? <ErrorState message={error} onRetry={reload} /> : data.tests.length === 0 ? (
              <div className="card"><EmptyState icon={<IconTest />} title="No tests available" text="Try showing tests for all exams." /></div>
            ) : (
              <div className="test-grid">
                {data.tests.map((t) => (
                  <article key={t._id} className="card test-card">
                    <div className="test-card-body">
                      <div className="row between">
                        <span className="badge badge-neutral">{t.exam}</span>
                        {t.subject && <span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[t.subject] }}><span className="dot" />{t.subject}</span>}
                      </div>
                      <h3>{t.title}</h3>
                      <div className="test-meta">
                        <span><IconTest /> {t.questionCount} questions</span>
                        <span><IconClock /> {t.durationMinutes} min</span>
                      </div>
                      <div className="text-xs muted num">Marking +{t.marking.correct} / {t.marking.incorrect} · unanswered 0</div>
                    </div>
                    <div className="card-footer">
                      {t.attempts ? (
                        <span className="text-sm num">Best <span className={`strong text-${tone(t.bestPercentage)}`}>{t.bestPercentage}%</span> <span className="muted">· {t.attempts} attempt{t.attempts === 1 ? '' : 's'}</span></span>
                      ) : <span className="text-sm muted">Not attempted</span>}
                      <Link to={`/tests/${t._id}`} className={`btn btn-sm ${t.attempts ? 'btn-secondary' : 'btn-primary'}`}>
                        {t.attempts ? <><IconRotateCcw /> Retake</> : <>Start <IconArrowRight /></>}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'topic' && <TopicPractice defaultExam={user.profile.exam} />}

        {section === 'results' && (
          <section className="card">
            {resError ? <div className="card-body"><ErrorState message={resError} onRetry={reloadRes} /></div> : !res ? (
              <div className="card-body stack-3">{[0, 1, 2].map((i) => <Skeleton key={i} height={36} radius={6} />)}</div>
            ) : res.results.length === 0 ? (
              <EmptyState icon={<IconTest />} title="No attempts yet" text="Your scores and reviews are saved here after you submit a test." action="Browse tests" onAction={() => setSection('full')} />
            ) : (
              <>
                <div className="table-wrap hide-sm">
                  <table className="table">
                    <thead><tr><th>Test</th><th>Date</th><th className="right">Score</th><th className="right">Correct</th><th className="right">Wrong</th><th className="right">Skipped</th><th className="right">Result</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {res.results.map((r) => (
                        <tr key={r._id}>
                          <td><div className="row">{r.testType === 'topic' && <span className="badge badge-neutral">Topic</span>}<span className="medium">{r.testTitle}</span></div></td>
                          <td className="nowrap muted">{formatDate(r.createdAt)}</td>
                          <td className="right">{r.score}/{r.maxScore}</td>
                          <td className="right text-success">{r.correct}</td>
                          <td className="right text-danger">{r.incorrect}</td>
                          <td className="right muted">{r.unanswered}</td>
                          <td className="right"><span className={`badge badge-${tone(r.percentage)}`}>{r.percentage}%</span></td>
                          <td className="right"><Link className="link text-sm" to={`/results/${r._id}`}>Review</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="list only-sm">
                  {res.results.map((r) => (
                    <li key={r._id}>
                      <Link to={`/results/${r._id}`} className="list-item">
                        <div className="li-main">
                          <div className="li-title">{r.testTitle}</div>
                          <div className="li-sub num">{formatDate(r.createdAt)} · {r.score}/{r.maxScore} · {r.correct} correct · {r.incorrect} wrong</div>
                        </div>
                        <span className={`badge badge-${tone(r.percentage)} num`}>{r.percentage}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function PageSkeletonGrid() {
  return (
    <div className="test-grid" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card test-card"><div className="test-card-body stack-3"><Skeleton width={80} height={20} /><Skeleton width="80%" height={16} /><Skeleton width="60%" /></div><div className="card-footer"><Skeleton width={90} /><Skeleton width={70} height={30} /></div></div>
      ))}
    </div>
  );
}

function TopicPractice({ defaultExam }) {
  const navigate = useNavigate();
  const [topicExam, setTopicExam] = useState(defaultExam || 'JEE Main');
  const [topicSubject, setTopicSubject] = useState(EXAM_SUBJECTS[defaultExam || 'JEE Main'][0]);
  const [topicChapter, setTopicChapter] = useState('');
  const [questionCount, setQuestionCount] = useState(1);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [creating, setCreating] = useState(false);
  const [topicError, setTopicError] = useState('');
  const { data: topicOptions, loading: optionsLoading } = useApi(`/tests/topics/options?exam=${encodeURIComponent(topicExam)}&subject=${encodeURIComponent(topicSubject)}`);
  const selectedChapter = topicOptions?.chapters.find((chapter) => chapter.name === topicChapter);
  const availableQuestionCount = selectedChapter?.difficultyCounts?.[difficulty] || 0;
  const validQuestionCounts = selectedChapter?.questionCounts?.filter((count) => count <= availableQuestionCount) || [];

  useEffect(() => {
    if (!selectedChapter) {
      setQuestionCount(1);
      return;
    }
    setQuestionCount((current) => validQuestionCounts.includes(current) ? current : (validQuestionCounts[0] || 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicChapter, difficulty, topicOptions]);

  function changeTopicExam(exam) {
    setTopicExam(exam);
    setTopicSubject(EXAM_SUBJECTS[exam][0]);
    setTopicChapter('');
  }

  async function createTopicTest(e) {
    e.preventDefault();
    if (!topicChapter) return setTopicError('Choose a chapter to practise');
    setCreating(true);
    setTopicError('');
    try {
      const response = await api.post('/tests/topics', { exam: topicExam, subject: topicSubject, chapter: topicChapter, questionCount, difficulty });
      navigate(`/tests/${response.data.test._id}`);
    } catch (err) {
      setTopicError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const canStart = topicChapter && validQuestionCounts.includes(questionCount);

  return (
    <section className="card">
      <div className="card-header">
        <div><h2 className="card-title"><IconTarget /> Build a topic test</h2><div className="card-subtitle">Questions are drawn from the existing question bank, without duplicates.</div></div>
      </div>
      <form className="card-body form" onSubmit={createTopicTest} noValidate>
        <div className="form-row-3">
          <Field label="Examination">
            <select value={topicExam} onChange={(e) => changeTopicExam(e.target.value)}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <Field label="Subject">
            <select value={topicSubject} onChange={(e) => { setTopicSubject(e.target.value); setTopicChapter(''); }}>{EXAM_SUBJECTS[topicExam].map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <Field label="Chapter" error={!topicChapter && topicError ? topicError : undefined}>
            <select value={topicChapter} onChange={(e) => { setTopicChapter(e.target.value); setTopicError(''); }} disabled={optionsLoading && !topicOptions}>
              <option value="">{optionsLoading && !topicOptions ? 'Loading chapters…' : 'Select a chapter'}</option>
              {topicOptions?.chapters.map((chapter) => <option key={chapter.name} value={chapter.name}>{chapter.name} ({chapter.availableQuestions})</option>)}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <div className="field">
            <span className="field-label">Difficulty</span>
            <Segmented block label="Difficulty" value={difficulty} onChange={setDifficulty} options={['Mixed', 'Easy', 'Medium', 'Hard']} />
          </div>
          <Field label="Number of questions" hint={selectedChapter ? `${availableQuestionCount} unique ${difficulty.toLowerCase()} question${availableQuestionCount === 1 ? '' : 's'} available` : 'Choose a chapter first'}>
            <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} disabled={!selectedChapter || validQuestionCounts.length === 0}>
              {validQuestionCounts.length ? validQuestionCounts.map((count) => <option key={count} value={count}>{count} questions</option>) : <option value={1}>No questions available</option>}
            </select>
          </Field>
        </div>
        {selectedChapter && availableQuestionCount === 0 && (
          <div className="alert alert-warning"><IconInfo /><div className="alert-body">No {difficulty.toLowerCase()} questions for this chapter yet. Choose Mixed or another difficulty.</div></div>
        )}
        {topicError && topicChapter && <div className="alert alert-danger" role="alert"><IconAlertCircle /><div className="alert-body">{topicError}</div></div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={creating || (topicChapter && !canStart)}>
            {creating ? <span className="spinner" aria-hidden="true" /> : null} {creating ? 'Preparing test' : <>Start topic test <IconArrowRight /></>}
          </button>
        </div>
      </form>
    </section>
  );
}
