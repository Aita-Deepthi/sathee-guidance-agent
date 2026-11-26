import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { ErrorState, EmptyState } from '../components/States';
import { PageSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Segmented from '../components/ui/Segmented';
import { ProgressRing, ProgressBar } from '../components/Progress';
import { IconCheckCircle, IconXCircle, IconMinusCircle, IconClock, IconChevronLeft, IconRotateCcw, IconCheck, IconClose, IconInfo } from '../components/Icons';
import { SUBJECT_COLORS, formatDate } from '../utils/format';

function tone(p) { return p >= 60 ? 'success' : p >= 35 ? 'warning' : 'danger'; }

export default function TestResult() {
  const { id } = useParams();
  const location = useLocation();
  const fromSubmit = location.state;
  const { data: fetched, loading, error, reload } = useApi(`/tests/results/${id}`, { skip: Boolean(fromSubmit) });
  const data = fromSubmit || fetched;
  const [filter, setFilter] = useState('all');

  if (!data && loading) return <PageSkeleton variant="split" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton variant="split" />;
  const { result, review } = data;
  const secs = result.timeTakenSeconds || 0;
  const mins = Math.floor(secs / 60);
  const ringColor = { success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)' }[tone(result.percentage)];

  const verdict = result.percentage >= 70 ? 'Excellent work. Keep this consistency going.'
    : result.percentage >= 40 ? 'Good effort. Review the incorrect answers below to close the gaps.'
      : 'Keep practising. Revise the chapters below, then retake the test.';

  const items = review.map((q, i) => ({ ...q, i, state: q.chosen === -1 ? 'skipped' : q.correct ? 'right' : 'wrong' }));
  const counts = { all: items.length, wrong: items.filter((x) => x.state === 'wrong').length, skipped: items.filter((x) => x.state === 'skipped').length, right: items.filter((x) => x.state === 'right').length };
  const shown = filter === 'all' ? items : items.filter((x) => x.state === filter);

  return (
    <div className="stack">
      <PageHeader
        eyebrow={<Link to="/tests?section=results" className="link-muted"><IconChevronLeft width={14} height={14} /> My results</Link>}
        title={result.testTitle}
        description={result.createdAt ? `Attempted ${formatDate(result.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Test result'}
        actions={<>
          <Link to="/tests" className="btn btn-secondary">All tests</Link>
          <Link to={`/tests/${result.test}`} className="btn btn-primary"><IconRotateCcw /> Retake</Link>
        </>}
      />

      <section className="card result-summary">
        <div className="result-score">
          <ProgressRing value={result.percentage} size={112} stroke={9} color={ringColor} label={`${result.percentage}%`} sublabel="score" />
          <div>
            <div className="overline">Score</div>
            <div className="result-points num">{result.score}<span className="muted"> / {result.maxScore}</span></div>
            <p className="text-sm secondary mt-1">{verdict}</p>
          </div>
        </div>
        <dl className="result-stats">
          <div><dt><IconCheckCircle className="text-success" /> Correct</dt><dd className="num">{result.correct}</dd></div>
          <div><dt><IconXCircle className="text-danger" /> Incorrect</dt><dd className="num">{result.incorrect}</dd></div>
          <div><dt><IconMinusCircle /> Unanswered</dt><dd className="num">{result.unanswered}</dd></div>
          <div><dt><IconClock /> Time taken</dt><dd className="num">{mins}<small> min</small> {secs % 60 ? <>{secs % 60}<small> s</small></> : null}</dd></div>
        </dl>
      </section>

      {(result.subjectBreakdown?.length > 0 || result.chapterBreakdown?.length > 0) && (
        <div className="grid-2">
          {result.subjectBreakdown?.length > 0 && (
            <section className="card">
              <div className="card-header"><h2 className="card-title">By subject</h2></div>
              <div className="card-body stack-4">
                {result.subjectBreakdown.map((s) => {
                  const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={s.subject} className="stack-2">
                      <div className="row between text-sm">
                        <span className="subject-tag" style={{ '--subject': SUBJECT_COLORS[s.subject] }}><span className="dot" />{s.subject}</span>
                        <span className="num"><span className="strong">{s.correct}</span><span className="muted">/{s.total} correct</span></span>
                      </div>
                      <ProgressBar value={pct} color={SUBJECT_COLORS[s.subject]} size="sm" label={`${s.subject} accuracy`} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {result.chapterBreakdown?.length > 0 && (
            <section className="card">
              <div className="card-header"><h2 className="card-title">By chapter</h2></div>
              <ul className="list">
                {result.chapterBreakdown.map((c) => (
                  <li key={`${c.subject}-${c.chapter}`} className="list-item">
                    <span className="dot" style={{ '--subject': SUBJECT_COLORS[c.subject] }} />
                    <div className="li-main"><div className="li-title">{c.chapter}</div><div className="li-sub num">{c.correct}/{c.total} correct</div></div>
                    <span className={`badge badge-${tone(c.accuracy)} num`}>{c.accuracy}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Answer review</h2>
          <Segmented size="sm" label="Filter questions" value={filter} onChange={setFilter} options={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'wrong', label: `Incorrect ${counts.wrong}` },
            { value: 'skipped', label: `Skipped ${counts.skipped}` },
            { value: 'right', label: `Correct ${counts.right}` },
          ]} />
        </div>
        <div className="card-body">
          {shown.length === 0 ? <EmptyState compact title="Nothing in this filter" text="Choose another filter to see questions." /> : (
            <ol className="review">
              {shown.map((q) => (
                <li key={q.i} className={`review-item ${q.state}`}>
                  <div className="review-head">
                    <span className="overline num">Q{q.i + 1}{q.subject ? ` · ${q.subject}` : ''}</span>
                    <span className={`badge ${q.state === 'right' ? 'badge-success' : q.state === 'wrong' ? 'badge-danger' : 'badge-neutral'}`}>
                      {q.state === 'right' ? <><IconCheck /> Correct</> : q.state === 'wrong' ? <><IconClose /> Incorrect</> : 'Not answered'}
                    </span>
                  </div>
                  <div className="review-q">{q.text}</div>
                  <ul className="review-options">
                    {q.options.map((o, k) => {
                      const isAnswer = k === q.answerIndex;
                      const isWrongPick = k === q.chosen && !q.correct;
                      return (
                        <li key={k} className={`${isAnswer ? 'is-answer' : ''} ${isWrongPick ? 'is-wrong' : ''}`}>
                          <span className="option-key">{String.fromCharCode(65 + k)}</span>
                          <span className="grow">{o}</span>
                          {isAnswer && <span className="review-flag">Correct answer</span>}
                          {isWrongPick && <span className="review-flag">Your answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && <div className="explain"><IconInfo /><div><span className="strong">Explanation. </span>{q.explanation}</div></div>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
