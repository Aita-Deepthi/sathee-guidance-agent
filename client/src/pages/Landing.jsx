import { Link } from 'react-router-dom';
import {
  IconLogo, IconChat, IconCalendar, IconListChecks, IconPlay, IconTest, IconChart, IconArrowRight,
  IconCheck, IconLayers, IconLock, IconRefresh,
} from '../components/Icons';

const FEATURES = [
  { icon: IconCalendar, title: 'Study planner', text: 'A day-by-day schedule built from the syllabus, your exam date, daily hours and weak chapters — with weekly revision and mock-test days.' },
  { icon: IconListChecks, title: 'Daily progress', text: 'Tick off tasks, log real study time and questions solved, and keep an honest streak.' },
  { icon: IconChat, title: 'AI study assistant', text: 'Ask doubts in Physics, Chemistry, Mathematics and Biology, or get a preparation strategy for your profile.' },
  { icon: IconPlay, title: 'Learning resources', text: 'Chapter-wise lectures and official free portals such as SATHEE and NCERT, plus videos you pin yourself.' },
  { icon: IconTest, title: 'Mock tests', text: 'Timed full-length and topic-wise MCQ tests with negative marking, instant scoring and explanations.' },
  { icon: IconChart, title: 'Analytics', text: 'Subject progress, weekly hours, test trends, strengths and areas that need attention.' },
];

const STEPS = [
  { n: '01', title: 'Set your target', text: 'Choose your exam, date, class and how many hours you can study each day.' },
  { n: '02', title: 'Follow the daily plan', text: 'Each day lists exactly which topics to study, revise or test — with objectives and lecture links.' },
  { n: '03', title: 'Test and adjust', text: 'Mock tests reveal weak chapters; missed days are rescheduled in one click.' },
];

const PRINCIPLES = [
  { icon: IconLayers, title: 'Explainable schedule', text: 'The timetable comes from a deterministic planner over a structured syllabus — not from AI guesses — so it is reproducible.' },
  { icon: IconLock, title: 'Only your real data', text: 'No sample activity is ever created. Every number you see comes from tasks you completed and tests you took.' },
  { icon: IconRefresh, title: 'Keeps working', text: 'If AI quotas run out, planning, tracking and tests continue, and the assistant falls back to built-in guidance.' },
];

const PREVIEW = [
  ['Physics', "Kirchhoff's laws", '90 min', 'var(--subject-physics)', true],
  ['Chemistry', 'Mole concept', '55 min', 'var(--subject-chemistry)', true],
  ['Mathematics', 'Trigonometric identities', '80 min', 'var(--subject-mathematics)', false],
  ['Mixed', "Revise yesterday's topics", '45 min', 'var(--subject-mixed)', false],
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-inner row between">
          <Link to="/" className="row" aria-label="SATHEE Guidance Agent home">
            <IconLogo />
            <span className="brand-text"><span className="brand-name">SATHEE</span><span className="brand-sub">Guidance Agent</span></span>
          </Link>
          <nav className="row" aria-label="Account">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/register" className="btn btn-primary">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-inner hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="badge badge-neutral">Free</span> For Class 11 &amp; 12 · JEE Main · JEE Advanced · NEET</div>
              <h1>A structured study mentor for entrance exam preparation.</h1>
              <p className="hero-lead">
                SATHEE Guidance Agent turns your exam date and daily hours into a day-by-day plan, tracks what you
                complete, tests you regularly and answers doubts — so you can prepare seriously without expensive coaching.
              </p>
              <div className="row wrap hero-ctas">
                <Link to="/register" className="btn btn-primary btn-lg">Create my study plan <IconArrowRight /></Link>
                <Link to="/login" className="btn btn-secondary btn-lg">Log in</Link>
              </div>
              <ul className="hero-points">
                <li><IconCheck /> Plan generated in under a minute</li>
                <li><IconCheck /> No fees, no ads</li>
              </ul>
            </div>

            <figure className="hero-preview" aria-label="Illustrative preview of the daily plan">
              <div className="preview-window">
                <div className="preview-bar"><span /><span /><span /><div className="preview-url">Today's plan</div></div>
                <div className="preview-body">
                  <div className="row between">
                    <div><div className="overline">Thursday</div><div className="strong">Today's plan</div></div>
                    <span className="badge badge-neutral num">2 of 4 done</span>
                  </div>
                  <div className="progress sm mt-3"><div className="progress-fill" style={{ width: '50%' }} /></div>
                  <div className="preview-tasks">
                    {PREVIEW.map(([s, t, m, c, done]) => (
                      <div className={`preview-task ${done ? 'done' : ''}`} key={t} style={{ '--subject': c }}>
                        <span className={`task-check static ${done ? 'checked' : ''}`}><IconCheck /></span>
                        <div className="grow"><div className="preview-task-title">{t}</div><div className="subject-tag"><span className="dot" />{s}</div></div>
                        <span className="text-xs muted num">{m}</span>
                      </div>
                    ))}
                  </div>
                  <div className="preview-foot">
                    <div><div className="text-xs muted">Syllabus covered</div><div className="strong num">34%</div></div>
                    <div><div className="text-xs muted">Exam in</div><div className="strong num">112 days</div></div>
                    <div><div className="text-xs muted">Streak</div><div className="strong num">9 days</div></div>
                  </div>
                </div>
              </div>
              <figcaption className="text-xs muted">Illustrative preview — your dashboard shows only your own data.</figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="how-title">
          <div className="landing-inner">
            <div className="section-head">
              <div className="overline">How it works</div>
              <h2 id="how-title">From exam date to a daily routine</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s) => (
                <li key={s.n} className="step"><span className="step-n num">{s.n}</span><h3>{s.title}</h3><p>{s.text}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-section alt" aria-labelledby="features-title">
          <div className="landing-inner">
            <div className="section-head">
              <div className="overline">What's included</div>
              <h2 id="features-title">Everything a preparation routine needs, in one place</h2>
            </div>
            <div className="feature-grid">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div className="feature" key={title}>
                  <div className="feature-icon"><Icon /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="principles-title">
          <div className="landing-inner">
            <div className="section-head">
              <div className="overline">Design principles</div>
              <h2 id="principles-title">Built to be trusted</h2>
            </div>
            <div className="principles">
              {PRINCIPLES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="principle"><Icon /><div><h3>{title}</h3><p>{text}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-inner cta-inner">
            <div>
              <h2>Start with today's plan.</h2>
              <p>Create an account, enter your exam date and get a schedule you can follow tonight.</p>
            </div>
            <Link to="/register" className="btn btn-primary btn-lg">Get started free <IconArrowRight /></Link>
          </div>
        </section>
      </main>

      <footer className="landing-foot">
        <div className="landing-inner">
          SATHEE Guidance Agent is an independent student capstone project inspired by the educational goals of the official{' '}
          <a href="https://sathee.iitk.ac.in/" target="_blank" rel="noreferrer" className="link">SATHEE platform</a>. It is not an official IIT Kanpur or Ministry of Education application.
        </div>
      </footer>
    </div>
  );
}
