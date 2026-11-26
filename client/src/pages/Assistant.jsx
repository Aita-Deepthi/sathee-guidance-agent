import { Component, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import api, { errorMessage } from '../services/api';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { IconSend, IconPlus, IconTrash, IconSparkle, IconAlert, IconCalendar, IconChat, IconClose, IconArrowRight, IconAlertCircle } from '../components/Icons';
import { ListSkeleton } from '../components/ui/Skeleton';
import { formatDate } from '../utils/format';

const SUGGESTIONS = {
  default: [
    'Make a preparation strategy for me based on my profile',
    'How should I balance school studies and entrance preparation?',
    'How do I revise effectively so I do not forget chapters?',
    'I get nervous in mock tests. How can I improve?',
  ],
  'JEE Main': ['Explain Kirchhoff\'s laws with a simple example', 'What is hybridisation? Explain sp, sp2 and sp3', 'How do I find the maximum value of a sin x + b cos x?'],
  'JEE Advanced': ['Explain rolling motion without slipping step by step', 'How should I approach multi-concept problems?', 'Explain the Nernst equation with an example'],
  NEET: ['Explain the Calvin cycle in simple steps', 'Difference between mitosis and meiosis', 'How do I memorise the Animal Kingdom chapter?'],
};
const PROFILE_EXAMPLE = 'I am preparing for JEE Main. My exam is on 15 March 2027. I am in Class 12 and I can study six hours per day. I am a beginner.';

class MathRenderBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <span>{this.props.content}</span>;
    return this.props.children;
  }
}

function AssistantMarkdown({ content }) {
  return (
    <MathRenderBoundary content={content}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </MathRenderBoundary>
  );
}

export default function Assistant() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { data: convData, loading: listLoading, reload: reloadList } = useApi('/chat');
  const { data: status } = useApi('/chat/status');
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [detected, setDetected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-grow the composer up to a max height
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setHistoryOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [historyOpen]);

  async function openConversation(id) {
    setHistoryOpen(false);
    if (id === activeId) return;
    setActiveId(id);
    setDetected(null);
    setLoadingConv(true);
    try {
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.conversation.messages);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoadingConv(false);
    }
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setDetected(null);
    setInput('');
    setHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function deleteConversation(c) {
    const ok = await confirm({
      title: 'Delete this conversation?',
      description: `“${c.title}” and all its messages will be permanently removed.`,
      confirmLabel: 'Delete conversation', tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/chat/${c._id}`);
      if (c._id === activeId) newConversation();
      reloadList();
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    setMessages((m) => [...m, { _id: 'tmp-' + Date.now(), role: 'user', content: message }]);
    setSending(true);
    try {
      const res = await api.post('/chat/send', { conversationId: activeId, message });
      setMessages((m) => [...m, res.data.message]);
      setDetected(res.data.detected);
      if (!activeId) {
        setActiveId(res.data.conversationId);
        reloadList();
      }
    } catch (err) {
      setMessages((m) => [...m, { _id: 'err-' + Date.now(), role: 'assistant', content: errorMessage(err), source: 'error' }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // Save the details found in the chat to the profile and build the plan
  async function applyDetected() {
    if (!detected.examDate && !user.profile.examDate) {
      toast.error('Tell the assistant your exam date first, e.g. "My exam is on 15 March 2027".');
      return;
    }
    const ok = await confirm({
      title: 'Update profile and build plan?',
      description: 'These details will be saved to your profile and a study plan generated. Future pending tasks in an existing plan are replaced; completed work is kept.',
      confirmLabel: 'Update and build plan', tone: 'warning',
    });
    if (!ok) return;
    setApplying(true);
    try {
      await api.post('/plan/generate', { ...detected });
      await refreshUser();
      toast.success('Profile updated and study plan generated');
      navigate('/plan');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setApplying(false);
    }
  }

  const suggestions = [...(SUGGESTIONS[user.profile.exam] || []), ...SUGGESTIONS.default].slice(0, 4);
  const conversations = convData?.conversations || [];
  const activeTitle = conversations.find((c) => c._id === activeId)?.title;
  const detectedText = detected && [detected.exam, detected.examDate && `exam on ${formatDate(detected.examDate)}`, detected.classLevel && `Class ${detected.classLevel}`,
    detected.hoursPerDay && `${detected.hoursPerDay} h/day`, detected.level].filter(Boolean).join(' · ');

  return (
    <div className="chat-page">
      {historyOpen && <div className="chat-scrim" onClick={() => setHistoryOpen(false)} aria-hidden="true" />}
      <aside className={`chat-sidebar ${historyOpen ? 'open' : ''}`} aria-label="Conversation history">
        <div className="chat-sidebar-head">
          <button type="button" className="btn btn-secondary btn-block" onClick={newConversation}><IconPlus /> New conversation</button>
          <button type="button" className="icon-btn only-sm" onClick={() => setHistoryOpen(false)} aria-label="Close history"><IconClose /></button>
        </div>
        <div className="overline chat-sidebar-label">Recent</div>
        <div className="chat-history">
          {listLoading && !convData ? <div style={{ padding: '4px 8px' }}><ListSkeleton rows={4} /></div> : conversations.length === 0 ? (
            <p className="muted text-sm" style={{ padding: '4px 10px' }}>Your conversations will appear here.</p>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c._id} className={c._id === activeId ? 'active' : ''}>
                  <button type="button" className="chat-history-item" onClick={() => openConversation(c._id)} aria-current={c._id === activeId ? 'true' : undefined}>
                    <span className="ellipsis">{c.title}</span>
                    <span className="text-xs muted num">{formatDate(c.updatedAt, { day: 'numeric', month: 'short' })}</span>
                  </button>
                  <button type="button" className="icon-btn danger chat-delete" onClick={() => deleteConversation(c)} aria-label={`Delete conversation: ${c.title}`}><IconTrash /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="chat-main" aria-label="Chat">
        <div className="chat-head">
          <button type="button" className="btn btn-ghost btn-sm only-sm" onClick={() => setHistoryOpen(true)} aria-label="Open conversation history"><IconChat /> History</button>
          <div className="chat-head-title ellipsis">{activeTitle || 'New conversation'}</div>
          <span className={`badge ${status?.aiConfigured === false ? 'badge-warning' : 'badge-neutral'}`}>
            <span className="status-dot" data-on={status?.aiConfigured !== false} />{status?.aiConfigured === false ? 'Limited mode' : 'AI mentor'}
          </span>
          <button type="button" className="icon-btn only-sm" onClick={newConversation} aria-label="New conversation"><IconPlus /></button>
        </div>

        {status && !status.aiConfigured && (
          <div className="chat-notice"><IconAlert /> No AI provider key is configured on the server, so answers come from built-in rule-based guidance.</div>
        )}

        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-thread" aria-live="polite" aria-busy={sending}>
            {loadingConv ? (
              <div className="stack-4" style={{ paddingTop: 24 }}><ListSkeleton rows={3} /></div>
            ) : messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon"><IconSparkle /></div>
                <h2>How can I help, {user.name.split(' ')[0]}?</h2>
                <p>Ask a doubt in Physics, Chemistry or {user.profile.exam === 'NEET' ? 'Biology' : 'Mathematics'}, or describe your exam, date, class, daily hours and level to build a plan.</p>
                <div className="suggestions">
                  {suggestions.map((s) => (
                    <button type="button" key={s} className="suggestion" onClick={() => send(s)}><span>{s}</span><IconArrowRight /></button>
                  ))}
                  <button type="button" className="suggestion suggestion-accent" onClick={() => send(PROFILE_EXAMPLE)}>
                    <span><span className="strong">Try:</span> “I am preparing for JEE Main. My exam is on 15 March 2027…”</span><IconArrowRight />
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                m.role === 'user' ? (
                  <div key={m._id} className="msg msg-user"><div className="msg-bubble">{m.content}</div></div>
                ) : (
                  <div key={m._id} className={`msg msg-assistant ${m.source === 'error' ? 'is-error' : ''}`}>
                    <div className="msg-avatar" aria-hidden="true">{m.source === 'error' ? <IconAlertCircle /> : <IconSparkle />}</div>
                    <div className="msg-content">
                      {m.source === 'fallback' && <span className="badge badge-warning msg-tag">Built-in guidance</span>}
                      {m.source === 'error' ? <p>{m.content}</p> : <div className="prose"><AssistantMarkdown content={m.content} /></div>}
                    </div>
                  </div>
                )
              ))
            )}
            {sending && (
              <div className="msg msg-assistant">
                <div className="msg-avatar" aria-hidden="true"><IconSparkle /></div>
                <div className="msg-content"><div className="typing" aria-label="Assistant is typing"><span /><span /><span /></div></div>
              </div>
            )}
          </div>
        </div>

        <div className="chat-composer-wrap">
          {detected && detectedText && (
            <div className="detected">
              <IconCalendar />
              <div className="grow text-sm"><span className="strong">Details found:</span> {detectedText}</div>
              <button type="button" className="btn btn-primary btn-sm" onClick={applyDetected} disabled={applying}>
                {applying && <span className="spinner" aria-hidden="true" />} {applying ? 'Building plan' : 'Apply & build plan'}
              </button>
              <button type="button" className="icon-btn" onClick={() => setDetected(null)} aria-label="Dismiss"><IconClose /></button>
            </div>
          )}
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea id="chat-input" ref={inputRef} rows={1} value={input} maxLength={4000} placeholder="Ask a doubt or describe your preparation…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
            <button type="submit" className="btn btn-primary btn-icon composer-send" disabled={sending || !input.trim()} aria-label="Send message"><IconSend /></button>
          </form>
          <div className="composer-hint text-xs muted hide-sm"><span className="kbd">Enter</span> to send · <span className="kbd">Shift</span> + <span className="kbd">Enter</span> for a new line · AI can make mistakes — verify important facts.</div>
        </div>
      </section>
    </div>
  );
}
