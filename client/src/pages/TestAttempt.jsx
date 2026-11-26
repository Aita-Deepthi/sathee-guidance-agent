import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { ErrorState } from '../components/States';
import { PageSkeleton } from '../components/ui/Skeleton';
import { ProgressBar } from '../components/Progress';
import { IconClock, IconFlag, IconChevron, IconChevronLeft, IconDashboard, IconClose } from '../components/Icons';
import { SUBJECT_COLORS } from '../utils/format';

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useApi(`/tests/${id}`);
  const [answers, setAnswers] = useState([]);
  const [marked, setMarked] = useState([]);
  const [visited, setVisited] = useState([]);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const startRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const blockerPrompting = useRef(false);
  const questionRef = useRef(null);

  const test = data?.test;

  useEffect(() => {
    if (!test) return;
    setAnswers(new Array(test.questions.length).fill(-1));
    setMarked(new Array(test.questions.length).fill(false));
    setVisited(test.questions.map((_, i) => i === 0));
    setRemaining(test.durationMinutes * 60);
    startRef.current = Date.now();
  }, [test]);

  const submit = useCallback(async (auto = false) => {
    if (submittedRef.current || !test) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post(`/tests/${id}/submit`, {
        answers,
        timeTakenSeconds: Math.round((Date.now() - startRef.current) / 1000),
      });
      if (auto) toast.info('Time is up — your test was submitted automatically.');
      navigate(`/results/${res.data.result._id}`, { replace: true, state: res.data });
    } catch (err) {
      submittedRef.current = false;
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  }, [answers, id, navigate, test, toast]);

  // Countdown timer
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) { submit(true); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, submit]);

  // Warn before refreshing/closing the tab mid-test
  useEffect(() => {
    const warn = (e) => { if (!submittedRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  // Confirm before navigating to another page mid-test
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !submittedRef.current && remaining !== null && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked' || blockerPrompting.current) return;
    blockerPrompting.current = true;
    confirm({
      title: 'Leave this test?',
      description: 'Your answers have not been submitted and will be lost. The timer keeps running only while you stay on this page.',
      confirmLabel: 'Leave test', cancelLabel: 'Keep going', tone: 'danger',
    }).then((ok) => {
      blockerPrompting.current = false;
      if (ok) blocker.proceed(); else blocker.reset();
    });
  }, [blocker, confirm]);

  const total = test?.questions.length || 0;
  const go = useCallback((i) => {
    if (!test) return;
    const n = Math.max(0, Math.min(total - 1, i));
    setCurrent(n);
    setVisited((v) => v.map((x, k) => (k === n ? true : x)));
    setPaletteOpen(false);
  }, [test, total]);
  const choose = useCallback((i) => setAnswers((a) => a.map((v, k) => (k === current ? i : v))), [current]);
  const toggleMark = useCallback(() => setMarked((m) => m.map((v, k) => (k === current ? !v : v))), [current]);

  // Keyboard shortcuts: A–D / 1–4 choose, ← → navigate, M marks for review
  useEffect(() => {
    if (!test) return;
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select, [role="alertdialog"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const opts = test.questions[current].options.length;
      const idx = 'abcd'.indexOf(k) !== -1 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
      if (idx !== -1 && idx < opts) { e.preventDefault(); choose(idx); }
      else if (e.key === 'ArrowRight' && !e.target.closest('[role="radiogroup"]')) { e.preventDefault(); go(current + 1); }
      else if (e.key === 'ArrowLeft' && !e.target.closest('[role="radiogroup"]')) { e.preventDefault(); go(current - 1); }
      else if (k === 'm') { e.preventDefault(); toggleMark(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [test, current, choose, go, toggleMark]);

  useEffect(() => { questionRef.current?.focus({ preventScroll: true }); }, [current]);

  if (loading) return <PageSkeleton variant="split" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!test || remaining === null) return <PageSkeleton variant="split" />;

  const q = test.questions[current];
  const answered = answers.filter((a) => a !== -1).length;
  const markedCount = marked.filter(Boolean).length;
  const timeTone = remaining < 60 ? 'danger' : remaining < 300 ? 'warning' : '';

  async function confirmSubmit() {
    const left = total - answered;
    const ok = await confirm({
      title: 'Submit your test?',
      description: left
        ? `${left} question${left === 1 ? ' is' : 's are'} unanswered${markedCount ? ` and ${markedCount} marked for review` : ''}. Unanswered questions score 0. You cannot change answers after submitting.`
        : `All ${total} questions are answered${markedCount ? `, ${markedCount} still marked for review` : ''}. You cannot change answers after submitting.`,
      confirmLabel: 'Submit test', cancelLabel: 'Keep working', tone: left ? 'warning' : 'primary',
    });
    if (ok) submit(false);
  }

  function onRadioKey(e) {
    const opts = q.options.length;
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      const base = answers[current] === -1 ? (dir === 1 ? -1 : 0) : answers[current];
      const next = (base + dir + opts) % opts;
      choose(next);
      e.currentTarget.querySelectorAll('[role="radio"]')[next]?.focus();
    }
  }

  const selected = answers[current];
  const color = SUBJECT_COLORS[q.subject] || SUBJECT_COLORS.Mixed;

  const palette = (
    <>
      <div className="palette" role="list">
        {test.questions.map((_, i) => {
          const state = answers[i] !== -1 ? 'answered' : visited[i] ? 'visited' : '';
          return (
            <button key={i} type="button" role="listitem"
              className={`pal ${state} ${marked[i] ? 'marked' : ''} ${i === current ? 'current' : ''}`}
              onClick={() => go(i)} aria-current={i === current ? 'step' : undefined}
              aria-label={`Question ${i + 1}: ${answers[i] !== -1 ? 'answered' : 'not answered'}${marked[i] ? ', marked for review' : ''}`}>
              <span className="num">{i + 1}</span>
            </button>
          );
        })}
      </div>
      <ul className="palette-legend">
        <li><span className="pal-key answered" /> Answered <span className="num muted">{answered}</span></li>
        <li><span className="pal-key marked" /> Marked <span className="num muted">{markedCount}</span></li>
        <li><span className="pal-key visited" /> Skipped</li>
        <li><span className="pal-key" /> Not visited</li>
      </ul>
    </>
  );

  return (
    <div className="test-page">
      <div className="test-bar">
        <div className="test-bar-info">
          <div className="strong ellipsis">{test.title}</div>
          <div className="text-xs muted num">{answered}/{total} answered<span className="hide-sm"> · +{test.marking.correct} / {test.marking.incorrect} marking</span></div>
        </div>
        <div className={`timer ${timeTone}`} role="timer" aria-label={`Time remaining ${fmt(remaining)}`}>
          <IconClock /> <span className="num">{fmt(remaining)}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={confirmSubmit} disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />} {submitting ? 'Submitting' : 'Submit'}
        </button>
      </div>
      <ProgressBar value={(answered / total) * 100} size="sm" label="Questions answered" />
      <div className="sr-only" aria-live="assertive">{remaining === 60 ? 'One minute remaining' : remaining === 300 ? 'Five minutes remaining' : ''}</div>

      <div className="test-layout">
        <section className="card question-card" aria-labelledby="q-text">
          <div className="question-head">
            <div className="row">
              <span className="overline num nowrap">Question {current + 1}<span className="hide-sm"> of {total}</span><span className="only-sm">/{total}</span></span>
              {q.subject && <span className="subject-tag" style={{ '--subject': color }}><span className="dot" />{q.subject}</span>}
            </div>
            <button type="button" className={`btn btn-sm ${marked[current] ? 'btn-subtle mark-on' : 'btn-ghost'}`} onClick={toggleMark} aria-pressed={marked[current]}>
              <IconFlag /> {marked[current] ? 'Marked' : <><span className="hide-sm">Mark for review</span><span className="only-sm">Mark</span></>}
            </button>
          </div>
          <div className="question-body">
            <h2 id="q-text" className="q-text" tabIndex={-1} ref={questionRef}>{q.text}</h2>
            <div className="options" role="radiogroup" aria-labelledby="q-text" onKeyDown={onRadioKey}>
              {q.options.map((opt, i) => (
                <button key={i} type="button" role="radio" aria-checked={selected === i}
                  tabIndex={selected === i || (selected === -1 && i === 0) ? 0 : -1}
                  className={`option ${selected === i ? 'selected' : ''}`} onClick={() => choose(i)}>
                  <span className="option-key">{String.fromCharCode(65 + i)}</span>
                  <span className="option-text">{opt}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="question-foot">
            <button type="button" className="btn btn-secondary" disabled={current === 0} onClick={() => go(current - 1)}><IconChevronLeft /> <span className="hide-sm">Previous</span></button>
            <button type="button" className="btn btn-ghost" onClick={() => choose(-1)} disabled={selected === -1}>Clear</button>
            <span className="grow" />
            <span className="shortcut-hint text-xs muted hide-sm"><span className="kbd">A</span>–<span className="kbd">D</span> answer · <span className="kbd">←</span><span className="kbd">→</span> move · <span className="kbd">M</span> mark</span>
            {current < total - 1 ? (
              <button type="button" className={`btn ${selected !== -1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => go(current + 1)}><span className="hide-sm">{selected !== -1 ? 'Save & next' : 'Next'}</span><span className="only-sm">Next</span> <IconChevron /></button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={confirmSubmit} disabled={submitting}>Finish</button>
            )}
          </div>
        </section>

        <aside className="card palette-card hide-sm" aria-label="Question palette">
          <div className="card-header"><h2 className="card-title">Questions</h2><span className="text-xs muted num">{answered}/{total}</span></div>
          <div className="card-body">{palette}</div>
        </aside>
      </div>

      {/* Mobile: palette in a bottom sheet */}
      <div className="test-mobile-bar only-sm">
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous question"><IconChevronLeft /></button>
        <button type="button" className="btn btn-secondary grow" onClick={() => setPaletteOpen(true)} aria-haspopup="dialog"><IconDashboard /> <span className="num">{current + 1} / {total}</span></button>
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(current + 1)} disabled={current === total - 1} aria-label="Next question"><IconChevron /></button>
      </div>
      {paletteOpen && (
        <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setPaletteOpen(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setPaletteOpen(false); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-label="Question palette">
            <div className="card-header"><h2 className="card-title">Questions</h2><button type="button" className="icon-btn" onClick={() => setPaletteOpen(false)} aria-label="Close" autoFocus><IconClose /></button></div>
            <div className="card-body">{palette}</div>
          </div>
        </div>
      )}
    </div>
  );
}
