import { useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { EmptyState, ErrorState } from '../components/States';
import { Skeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import Field from '../components/ui/Field';
import { IconExternal, IconPlay, IconTrash, IconBook, IconInfo, IconPin, IconSearch } from '../components/Icons';
import { EXAMS, SUBJECT_COLORS } from '../utils/format';

// YouTube API titles contain HTML entities (e.g. &#39;); decode them safely as text
function decodeEntities(text) {
  return new DOMParser().parseFromString(text || '', 'text/html').documentElement.textContent;
}
// Light client-side check; the server does the authoritative parsing
const YT_RE = /(youtube\.com|youtu\.be)\//i;

function VideoEmbed({ videoId, title }) {
  return (
    <div className="video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="video-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => <div key={i} className="video-card"><Skeleton height={150} radius={0} /><div className="video-meta stack-2"><Skeleton width="85%" /><Skeleton width="40%" height={10} /></div></div>)}
    </div>
  );
}

export default function Resources() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [exam, setExam] = useState(user.profile.exam);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [pin, setPin] = useState({ url: '', title: '' });
  const [pinError, setPinError] = useState('');
  const [pinning, setPinning] = useState(false);
  const { data: syl, loading: sylLoading, error: sylError, reload: reloadSyl } = useApi(`/syllabus?exam=${encodeURIComponent(exam)}`);

  const subjects = syl?.subjects || [];
  const chapters = subjects.find((s) => s.subject === subject)?.chapters || [];

  useEffect(() => {
    if (subjects.length && !subjects.some((s) => s.subject === subject)) {
      setSubject(subjects[0].subject);
      setChapter(subjects[0].chapters[0]?.name || '');
    }
  }, [subjects, subject]);

  useEffect(() => {
    if (!subject || !chapter) return;
    let active = true;
    setLoading(true);
    setLoadError('');
    api.get('/resources', { params: { exam, subject, chapter } })
      .then((r) => { if (active) setRes(r.data); })
      .catch((err) => { if (active) setLoadError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [exam, subject, chapter, retry]);

  function chooseSubject(name) {
    setSubject(name);
    setChapter(subjects.find((s) => s.subject === name)?.chapters[0]?.name || '');
  }

  async function savePin(e) {
    e.preventDefault();
    if (!pin.url.trim()) return setPinError('Paste a YouTube link');
    if (!YT_RE.test(pin.url.trim())) return setPinError('That does not look like a YouTube video link');
    setPinError('');
    setPinning(true);
    try {
      const r = await api.post('/resources/saved', { subject, chapter, url: pin.url.trim(), title: pin.title.trim() });
      setRes((x) => ({ ...x, savedVideos: r.data.savedVideos }));
      setPin({ url: '', title: '' });
      toast.success('Video pinned to this chapter');
    } catch (err) {
      setPinError(errorMessage(err));
    } finally {
      setPinning(false);
    }
  }

  async function removePin(v) {
    const ok = await confirm({
      title: 'Remove pinned video?',
      description: `“${v.title || 'This video'}” will be removed from ${chapter}. You can pin it again later.`,
      confirmLabel: 'Remove video', tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/resources/saved/${v._id}`);
      setRes((x) => ({ ...x, savedVideos: x.savedVideos.filter((s) => s._id !== v._id) }));
      toast.success('Video removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const busy = loading || !res;

  return (
    <div className="stack">
      <PageHeader title="Learning resources" description="Choose a chapter to find lectures, your pinned videos and official free study material." />

      <section className="card filter-bar" aria-label="Filters">
        <Field label="Exam" className="filter-exam">
          <select value={exam} onChange={(e) => { setExam(e.target.value); setSubject(''); setRes(null); }}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <div className="field filter-subject">
          <span className="field-label">Subject</span>
          {sylLoading && !subjects.length ? <Skeleton height={34} width={260} radius={8} /> : (
            <div className="segmented" role="group" aria-label="Subject">
              {subjects.map((s) => (
                <button type="button" key={s.subject} aria-pressed={subject === s.subject} onClick={() => chooseSubject(s.subject)}>
                  <span className="dot" style={{ '--subject': SUBJECT_COLORS[s.subject], marginRight: 6 }} />{s.subject}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Chapter" className="filter-chapter">
          <select value={chapter} disabled={sylLoading || !chapters.length} onChange={(e) => setChapter(e.target.value)}>
            {chapters.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
        </Field>
      </section>

      {sylError && <ErrorState message={sylError} onRetry={reloadSyl} />}
      {loadError && <ErrorState message={loadError} onRetry={() => setRetry((n) => n + 1)} />}

      {!loadError && (
        <div className="split">
          <div className="stack">
            {res?.notice && !busy && <div className="alert alert-info"><IconInfo /><div className="alert-body">{res.notice}</div></div>}

            {(busy || res.videos.length > 0) && (
              <section className="card">
                <div className="card-header">
                  <div><h2 className="card-title"><IconPlay /> Video lectures</h2><div className="card-subtitle">From the YouTube Data API — check the channel before relying on a video</div></div>
                </div>
                <div className="card-body">
                  {busy ? <VideoGridSkeleton /> : (
                    <div className="video-grid">
                      {res.videos.map((v) => (
                        <div key={v.videoId} className="video-card">
                          <VideoEmbed videoId={v.videoId} title={decodeEntities(v.title)} />
                          <div className="video-meta">
                            <div className="video-title">{decodeEntities(v.title)}</div>
                            <div className="video-channel">{v.channel}</div>
                            <div className="video-actions"><a className="link text-sm" href={v.url} target="_blank" rel="noreferrer"><IconExternal /> Open on YouTube</a></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="card">
              <div className="card-header">
                <div><h2 className="card-title"><IconPin /> Pinned videos</h2><div className="card-subtitle">{chapter || 'Select a chapter'}</div></div>
                {!busy && res.savedVideos.length > 0 && <span className="badge badge-neutral num">{res.savedVideos.length}</span>}
              </div>
              <div className="card-body stack-4">
                {busy ? <VideoGridSkeleton /> : res.savedVideos.length === 0 ? (
                  <EmptyState compact icon={<IconPin />} title="No pinned videos for this chapter" text="Found a good lecture? Paste its YouTube link below to keep it here." />
                ) : (
                  <div className="video-grid">
                    {res.savedVideos.map((v) => (
                      <div key={v._id} className="video-card">
                        <VideoEmbed videoId={v.videoId} title={v.title} />
                        <div className="video-meta">
                          <div className="video-title">{v.title}</div>
                          <div className="video-actions">
                            <a className="link text-sm" href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer"><IconExternal /> Open on YouTube</a>
                            <button type="button" className="icon-btn danger" onClick={() => removePin(v)} aria-label={`Remove ${v.title}`}><IconTrash /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form className="pin-form" onSubmit={savePin} noValidate>
                  <Field label="YouTube link" error={pinError} className="pin-url">
                    <input type="url" inputMode="url" placeholder="youtube.com/watch?v=… or youtu.be/…" value={pin.url}
                      onChange={(e) => { setPin({ ...pin, url: e.target.value }); setPinError(''); }} disabled={busy} />
                  </Field>
                  <Field label="Title" optional className="pin-title">
                    <input placeholder="e.g. One-shot revision" value={pin.title} maxLength={140} onChange={(e) => setPin({ ...pin, title: e.target.value })} disabled={busy} />
                  </Field>
                  <button type="submit" className="btn btn-primary pin-submit" disabled={pinning || busy}>
                    {pinning ? <span className="spinner" aria-hidden="true" /> : <IconPin />} {pinning ? 'Pinning' : 'Pin video'}
                  </button>
                </form>
              </div>
            </section>
          </div>

          <aside className="stack">
            <section className="card">
              <div className="card-header"><h2 className="card-title">Study material</h2></div>
              {busy ? <div className="card-body stack-3"><Skeleton height={44} radius={8} /><Skeleton height={44} radius={8} /><Skeleton height={44} radius={8} /></div> : (
                <ul className="list">
                  <li>
                    <a className="list-item" href={res.searchUrl} target="_blank" rel="noreferrer">
                      <span className="list-icon"><IconSearch /></span>
                      <div className="li-main"><div className="li-title">Search “{chapter}” lectures</div><div className="li-sub">YouTube search for {res.exam} {res.subject}</div></div>
                      <IconExternal width={16} height={16} className="muted" />
                    </a>
                  </li>
                  {res.portals.map((p) => (
                    <li key={p.url}>
                      <a className="list-item" href={p.url} target="_blank" rel="noreferrer">
                        <span className="list-icon"><IconBook /></span>
                        <div className="li-main"><div className="li-title">{p.title}</div><div className="li-sub wrap-text">{p.description}</div></div>
                        <IconExternal width={16} height={16} className="muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
