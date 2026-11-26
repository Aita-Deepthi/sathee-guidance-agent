import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconHome, IconChat, IconCalendar, IconPlay, IconListChecks, IconTest, IconChart,
  IconUser, IconLogout, IconMore, IconLogo, IconChevronsUpDown, IconClose,
} from '../components/Icons';
import { todayISO, formatDate } from '../utils/format';

// Navigation is grouped by the student's workflow: today → learn → assess
const NAV_GROUPS = [
  { label: 'Today', items: [
    { to: '/dashboard', label: 'Dashboard', icon: IconHome },
    { to: '/progress', label: 'Daily progress', icon: IconListChecks },
  ] },
  { label: 'Learn', items: [
    { to: '/plan', label: 'Study plan', icon: IconCalendar },
    { to: '/assistant', label: 'AI assistant', icon: IconChat },
    { to: '/resources', label: 'Resources', icon: IconPlay },
  ] },
  { label: 'Assess', items: [
    { to: '/tests', label: 'Mock tests', icon: IconTest },
    { to: '/analytics', label: 'Analytics', icon: IconChart },
  ] },
];
const ALL = NAV_GROUPS.flatMap((g) => g.items);
// Mobile bottom bar: the four most frequent destinations + More
const TAB_ITEMS = ['/dashboard', '/plan', '/assistant', '/tests'].map((to) => ALL.find((n) => n.to === to));
const TAB_LABEL = { '/dashboard': 'Home', '/plan': 'Plan', '/assistant': 'Assistant', '/tests': 'Tests' };
const MORE_ITEMS = ['/progress', '/resources', '/analytics'].map((to) => ALL.find((n) => n.to === to));

function pageTitle(pathname) {
  if (/^\/tests\/.+/.test(pathname)) return 'Mock test';
  if (pathname.startsWith('/results/')) return 'Test result';
  if (pathname.startsWith('/profile')) return 'Profile';
  return ALL.find((n) => pathname.startsWith(n.to))?.label || 'SATHEE';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const a = new Date(todayISO() + 'T00:00:00Z');
  const b = new Date(String(dateStr).slice(0, 10) + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => { setMenuOpen(false); setMoreOpen(false); setMobileMenuOpen(false); }, [location.pathname]);
  // Move focus to the page on route change so keyboard and screen-reader users land on new content
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.name || '?').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const exam = user?.profile?.exam;
  const daysLeft = daysUntil(user?.profile?.examDate);
  const inTest = /^\/tests\/.+/.test(location.pathname);
  const isMoreActive = MORE_ITEMS.some((n) => location.pathname.startsWith(n.to)) || location.pathname.startsWith('/profile');

  return (
    <div className={`app ${inTest ? 'app-focus' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ---------- Sidebar (desktop) / rail (tablet) ---------- */}
      <aside className="sidebar" aria-label="Primary">
        <Link to="/dashboard" className="sidebar-brand" aria-label="SATHEE Guidance Agent — dashboard">
          <IconLogo />
          <span className="brand-text"><span className="brand-name">SATHEE</span><span className="brand-sub">Guidance Agent</span></span>
        </Link>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="nav-group">
              <div className="nav-group-label">{g.label}</div>
              {g.items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="nav-item" data-tip={label}>
                  <Icon /><span className="nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {exam && (
            <Link to="/profile" className="exam-card" data-tip={daysLeft !== null ? `${daysLeft} days to ${exam}` : exam}>
              <div className="exam-card-top"><span className="overline">Target exam</span></div>
              <div className="exam-card-name">{exam}</div>
              <div className="exam-card-meta num">
                {daysLeft !== null && daysLeft >= 0 ? <><strong>{daysLeft}</strong> days · {formatDate(user.profile.examDate, { day: 'numeric', month: 'short', year: 'numeric' })}</> : 'Exam date not set'}
              </div>
              <span className="exam-card-mini num" aria-hidden="true">{daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d` : '—'}</span>
            </Link>
          )}
          <div className="menu-wrap">
            <button type="button" className="user-button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} data-tip="Account">
              <span className="avatar">{initials}</span>
              <span className="user-text"><span className="user-name ellipsis">{user?.name}</span><span className="user-email ellipsis">{user?.email}</span></span>
              <IconChevronsUpDown className="user-chev" width={16} height={16} />
            </button>
            {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} onLogout={handleLogout} className="up" />}
          </div>
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="app-main">
        <header className="topbar">
          <Link to="/dashboard" className="topbar-logo only-sm" aria-label="Dashboard"><IconLogo size={26} /></Link>
          <div className="topbar-title">{pageTitle(location.pathname)}</div>
          <div className="topbar-right">
            {exam && (
              <span className="badge badge-neutral hide-sm num">
                {exam}{daysLeft !== null && daysLeft >= 0 ? ` · ${daysLeft} days left` : ''}
              </span>
            )}
            <div className="menu-wrap only-sm">
              <button type="button" className="icon-btn" onClick={() => setMobileMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={mobileMenuOpen} aria-label="Account menu">
                <span className="avatar" style={{ width: 28, height: 28 }}>{initials}</span>
              </button>
              {mobileMenuOpen && <AccountMenu onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} user={user} />}
            </div>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1} className="content">
          <Outlet />
        </main>
      </div>

      {/* ---------- Bottom tab bar (mobile) ---------- */}
      <nav className="tabbar" aria-label="Primary">
        {TAB_ITEMS.map(({ to, icon: Icon }) => (
          <NavLink key={to} to={to} className="tab-item">
            <Icon /><span>{TAB_LABEL[to]}</span>
          </NavLink>
        ))}
        <button type="button" className={`tab-item ${isMoreActive ? 'active' : ''}`} onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}>
          <IconMore /><span>More</span>
        </button>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} onLogout={handleLogout} user={user} initials={initials} />}
    </div>
  );
}

function AccountMenu({ onClose, onLogout, className = '', user }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.parentElement.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('[role="menuitem"]')?.focus();
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function onKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...ref.current.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  return (
    <div ref={ref} className={`menu ${className}`} role="menu" onKeyDown={onKeyDown}>
      {user && (
        <div className="menu-header"><div className="strong ellipsis">{user.name}</div><div className="muted text-xs ellipsis">{user.email}</div></div>
      )}
      <Link to="/profile" className="menu-item" role="menuitem"><IconUser /> Profile &amp; exam settings</Link>
      <div className="menu-sep" role="separator" />
      <button type="button" className="menu-item danger" role="menuitem" onClick={onLogout}><IconLogout /> Log out</button>
    </div>
  );
}

function MoreSheet({ onClose, onLogout, user, initials }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('a, button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label="More navigation">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <span className="avatar lg">{initials}</span>
          <div className="grow"><div className="strong ellipsis">{user?.name}</div><div className="muted text-sm ellipsis">{user?.profile?.exam} · Class {user?.profile?.classLevel}</div></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><IconClose /></button>
        </div>
        <nav className="sheet-nav">
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="sheet-item"><Icon /> {label}</NavLink>
          ))}
          <NavLink to="/profile" className="sheet-item"><IconUser /> Profile &amp; exam settings</NavLink>
          <div className="menu-sep" />
          <button type="button" className="sheet-item danger" onClick={onLogout}><IconLogout /> Log out</button>
        </nav>
      </div>
    </div>
  );
}
