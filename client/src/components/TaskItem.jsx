import { useId, useState } from 'react';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SUBJECT_COLORS, TASK_TYPE_LABEL, formatMinutes } from '../utils/format';
import { IconCheck, IconExternal, IconChevron, IconClock, IconTarget } from './Icons';

/*
 * One study task: completion checkbox, metadata, and an expandable panel with
 * objectives, lecture link and a form to log actual time, questions and notes.
 * Calls onChange(updatedTask, response) after a successful save.
 */
export default function TaskItem({ task, onChange, editable = true, compact = false }) {
  const toast = useToast();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [form, setForm] = useState({
    actualMinutes: task.actualMinutes || '',
    questionsDone: task.questionsDone || '',
    notes: task.notes || '',
  });
  const [errors, setErrors] = useState({});
  const done = task.status === 'completed';
  const color = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Mixed;

  async function save(patch, successText, setBusy = setSaving) {
    setBusy(true);
    try {
      const res = await api.patch(`/tasks/${task._id}`, patch);
      onChange && onChange(res.data.task, res.data);
      if (res.data.chapterCompleted) toast.success(`Chapter completed: ${task.chapter}`);
      else if (successText) toast.success(successText);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const toggle = () => save({ status: done ? 'pending' : 'completed' }, done ? 'Marked as pending' : 'Task completed');

  const saveDetails = (e) => {
    e.preventDefault();
    const next = {};
    const mins = form.actualMinutes === '' ? 0 : Number(form.actualMinutes);
    const qs = form.questionsDone === '' ? 0 : Number(form.questionsDone);
    if (!Number.isFinite(mins) || mins < 0 || mins > 960) next.actualMinutes = 'Enter 0–960 minutes';
    if (!Number.isFinite(qs) || qs < 0 || qs > 1000) next.questionsDone = 'Enter 0–1000 questions';
    setErrors(next);
    if (Object.keys(next).length) return;
    save({ actualMinutes: mins, questionsDone: qs, notes: form.notes }, 'Progress saved', setSavingDetails);
  };

  const meta = [
    task.chapter && { key: 'ch', text: task.chapter, cls: 'task-meta-chapter' },
    { key: 'dur', text: formatMinutes(task.durationMinutes) },
    task.practiceTarget ? { key: 'q', text: `${task.practiceTarget} Qs`, cls: 'nowrap' } : null,
  ].filter(Boolean);

  return (
    <div className={`task ${done ? 'is-done' : ''} ${open ? 'is-open' : ''}`} style={{ '--subject': color }}>
      <div className="task-row">
        {editable ? (
          <button type="button" className={`task-check ${done ? 'checked' : ''}`} onClick={toggle} disabled={saving}
            aria-pressed={done} aria-label={`${done ? 'Mark as not done' : 'Mark as done'}: ${task.topic}`}>
            {saving ? <span className="spinner spinner-sm" aria-hidden="true" /> : <IconCheck />}
          </button>
        ) : (
          <span className={`task-check static ${done ? 'checked' : ''}`} aria-label={done ? 'Completed' : 'Pending'} role="img"><IconCheck /></span>
        )}

        <div className="task-main">
          <div className="task-title">
            {task.topic}{task.part ? <span className="task-part"> · {task.part}</span> : null}
          </div>
          <div className="task-meta">
            <span className="subject-tag"><span className="dot" />{task.subject}</span>
            {meta.map((m) => <span key={m.key} className={`task-meta-item ${m.cls || ''}`}>{m.text}</span>)}
          </div>
        </div>

        {task.type && task.type !== 'study' && (
          <span className={`badge task-type type-${task.type} hide-sm`}>{TASK_TYPE_LABEL[task.type]}</span>
        )}
        {!compact && (
          <button type="button" className="icon-btn task-expand" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}
            aria-label={open ? 'Hide task details' : 'Show task details'}>
            <IconChevron />
          </button>
        )}
      </div>

      {open && !compact && (
        <div className="task-panel" id={panelId}>
          {(task.chapter || (task.type && task.type !== 'study')) && (
            <div className="row wrap only-sm">
              {task.type && task.type !== 'study' && <span className={`badge task-type type-${task.type}`}>{TASK_TYPE_LABEL[task.type]}</span>}
              {task.chapter && <span className="text-sm muted">{task.chapter}</span>}
            </div>
          )}
          {task.objectives?.length > 0 && (
            <div>
              <div className="overline">Learning objectives</div>
              <ul className="objectives">{task.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
          {task.revisionActivity && (
            <div><div className="overline">Revision</div><p className="text-sm secondary mt-1">{task.revisionActivity}</p></div>
          )}
          {task.video?.url && (
            <a className="link text-sm" href={task.video.url} target="_blank" rel="noreferrer">
              <IconExternal /> {task.video.kind === 'search' ? 'Search lectures on YouTube' : task.video.title}
            </a>
          )}
          {editable && (
            <form className="task-form" onSubmit={saveDetails} noValidate>
              <label className="field">
                <span className="field-label">Time spent</span>
                <span className="input-unit">
                  <IconClock aria-hidden="true" />
                  <input type="number" inputMode="numeric" min="0" max="960" value={form.actualMinutes} aria-invalid={errors.actualMinutes ? 'true' : undefined}
                    onChange={(e) => setForm({ ...form, actualMinutes: e.target.value })} placeholder={String(task.durationMinutes)} />
                  <span className="unit">min</span>
                </span>
                {errors.actualMinutes && <span className="field-error">{errors.actualMinutes}</span>}
              </label>
              <label className="field">
                <span className="field-label">Questions solved</span>
                <span className="input-unit">
                  <IconTarget aria-hidden="true" />
                  <input type="number" inputMode="numeric" min="0" max="1000" value={form.questionsDone} aria-invalid={errors.questionsDone ? 'true' : undefined}
                    onChange={(e) => setForm({ ...form, questionsDone: e.target.value })} placeholder={String(task.practiceTarget || 0)} />
                </span>
                {errors.questionsDone && <span className="field-error">{errors.questionsDone}</span>}
              </label>
              <label className="field full">
                <span className="field-label">Notes <span className="optional">(optional)</span></span>
                <textarea rows="2" maxLength={2000} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Key takeaways, doubts to clear…" />
              </label>
              <div className="full row between">
                <span className="field-hint">Logged time counts toward today's study total once the task is done.</span>
                <button type="submit" className="btn btn-secondary btn-sm" disabled={savingDetails}>
                  {savingDetails && <span className="spinner" aria-hidden="true" />} {savingDetails ? 'Saving' : 'Save log'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
