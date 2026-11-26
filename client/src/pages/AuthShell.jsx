import { Link } from 'react-router-dom';
import { IconLogo, IconCheck } from '../components/Icons';

const POINTS = [
  'Day-by-day plan from your exam date and hours',
  'Daily targets, honest streaks and analytics',
  'Timed mock tests with explanations',
  'AI assistant for doubts and strategy',
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth-main">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-logo row" aria-label="SATHEE Guidance Agent home">
            <IconLogo />
            <span className="brand-text"><span className="brand-name">SATHEE</span><span className="brand-sub">Guidance Agent</span></span>
          </Link>
          <h1>{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </div>
      <aside className="auth-side" aria-hidden="true">
        <div className="auth-side-inner">
          <div className="overline auth-overline">JEE Main · JEE Advanced · NEET</div>
          <h2>Prepare with a plan you can actually follow.</h2>
          <ul>{POINTS.map((p) => <li key={p}><IconCheck /> {p}</li>)}</ul>
          <p className="auth-note">An independent student project inspired by SATHEE. Not an official IIT Kanpur / MoE application.</p>
        </div>
      </aside>
    </div>
  );
}
