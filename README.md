# SATHEE Guidance Agent
### AI-Powered Personalised Entrance Examination Preparation Platform

> An independent student capstone project inspired by the educational goals of the official
> [SATHEE platform](https://sathee.iitk.ac.in/). **This is not an official IIT Kanpur or Ministry of Education application.**

SATHEE Guidance Agent is a full-stack web application that acts as a free personal study mentor for Class 11 and 12 students preparing for **JEE Main, JEE Advanced and NEET**. It builds a day-by-day study plan, tracks daily progress, recommends lectures, runs mock tests, shows analytics and answers doubts through an AI chatbot.

---

## 1. Problem statement

Coaching for JEE/NEET often costs lakhs of rupees, which economically disadvantaged students cannot afford. Free content exists (NCERT, SATHEE, YouTube lectures), but students still lack the things a coaching institute really provides: **a plan, daily discipline, progress tracking, testing and a mentor to ask questions.**

## 2. Objectives

1. Generate a personalised, realistic day-by-day study schedule from the official-style syllabus.
2. Provide an AI mentor that understands the student's exam, date, hours and level.
3. Track daily tasks, study time, questions solved, chapter completion and streaks.
4. Provide chapter-wise learning resources and timed mock tests.
5. Show honest analytics computed only from the student's real data.
6. Keep working (with fallbacks) even when free API quotas run out.

## 3. Proposed solution

| Module | What it does |
|---|---|
| Authentication | Register/login with JWT, bcrypt-hashed passwords, protected routes, persistent sessions |
| Dashboard | Welcome, exam countdown, daily target, today's tasks, syllabus %, subject progress, recent tests, weak areas, upcoming tasks |
| AI Study Assistant | Gemini-primary chat with Groq free-tier fallback and built-in guidance; extracts exam/date/class/hours/level from messages and can build the plan in one click; history saved in MongoDB |
| Smart Study Planner | Deterministic algorithm schedules every topic with objectives, duration, practice target, revision activity and lecture link; weekly revision, practice tests, full mocks and a final revision phase; re-plans around missed tasks |
| Daily Progress | Mark complete/pending, record actual time, questions, notes, chapter completion; daily/weekly/monthly %, total hours, streak |
| Learning Resources | Exam → subject → chapter; live YouTube Data API results (embedded) when a key is set; otherwise YouTube search links + official portals; students can pin any YouTube video to a chapter and watch it embedded |
| Mock Tests | Timed MCQ tests (4 options), question palette, auto-submit, scoring with negative marking, results and explanations |
| Performance Analytics | Recharts: subject progress, weekly hours, daily activity, mock trend, subject accuracy, chapter completion, strengths and weaknesses |

## 4. Technology stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 19 + Vite, React Router, Axios, Recharts, react-markdown, plain CSS | Component-based UI, fast dev server, simple routing, charts |
| Backend | Node.js + Express 5 | JavaScript on both sides, simple REST APIs |
| Database | MongoDB Atlas + Mongoose | Flexible documents (plans, tasks, chats), free cloud tier |
| Auth | JSON Web Tokens, bcryptjs | Stateless sessions; bcryptjs is the pure-JavaScript bcrypt (no native build issues on Windows) |
| AI | Google Gemini via the official `@google/genai` SDK with Groq free-tier fallback | Gemini remains primary; Groq is used for retryable Gemini failures; keys stay on the server only |
| Videos | YouTube Data API v3 (optional) | Real, embeddable lectures |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas | Free tiers, Git-based deploys |

## 5. System architecture

```
 Browser (React SPA on Vercel)
        │  HTTPS + JSON, "Authorization: Bearer <JWT>"
        ▼
 Express API (Render) ── auth middleware ── controllers ── services
        │                                        │            ├─ planner.js   (rule-based scheduler)
        │                                        │            ├─ gemini.js    (Gemini SDK, timeout, errors)
        │                                        │            ├─ groq.js      (Groq free-tier fallback)
        │                                        │            ├─ assistant.js (prompt, detail extraction, fallback)
        │                                        │            ├─ youtube.js   (YouTube API + cache)
        │                                        │            └─ progressService.js (stats, streaks)
        ▼                                        ▼
 MongoDB Atlas (Mongoose models)          Google Gemini API / Groq API / YouTube Data API (optional)
```

**Key design decision:** the timetable is produced by a deterministic algorithm using a structured syllabus dataset, *not* by the AI. AI is used for explanations, strategy text and conversation. So the plan is explainable, reproducible and still works when the AI quota is exhausted.

## 6. Database design (MongoDB collections)

| Model | Important fields | Relationship |
|---|---|---|
| `User` | name, email (unique), password (hashed, `select:false`) | 1 — 1 StudentProfile |
| `StudentProfile` | classLevel, exam, level, examDate, hoursPerDay, subjects, weakChapters, completedChapters, savedVideos | `user → User` |
| `Syllabus` | exam, subject, chapters[{name, classLevel, priority, estHours, topics[]}] | reference data (seeded) |
| `StudyPlan` | exam, startDate, examDate, hoursPerDay, level, status (active/archived), summary, strategy | `user → User` |
| `DailyTask` | date, type (study/revision/practice-test/mock-test), subject, chapter, topic, part, objectives, durationMinutes, practiceTarget, revisionActivity, video, status, actualMinutes, questionsDone, notes | `user → User`, `plan → StudyPlan` |
| `Progress` | date, plannedTasks, completedTasks, minutesStudied, questionsSolved, note | one per user per day (unique index) |
| `ChatHistory` | title, messages[{role, content, source}] | `user → User` |
| `MockTest` | title, exam, subject, durationMinutes, marking, questions[{text, options[4], answerIndex, explanation}] | reference data (seeded) |
| `TestResult` | score, maxScore, correct, incorrect, unanswered, percentage, answers, subjectBreakdown | `user → User`, `test → MockTest` |

Only the **syllabus** and **mock-test questions** are seeded. No fake student activity is ever created — every number in the dashboard and analytics comes from the student's own actions.

## 7. How the study planner works (`server/services/planner.js`)

1. Days available = exam date − today. Minimum 7 days.
2. The last ~10% of days (3–30) are reserved for final mock tests and revision.
3. Every incomplete topic is taken from the syllabus dataset (completed chapters and finished topics are skipped).
4. Minutes per topic = chapter hours ÷ topics × level factor (Beginner 1.3, Intermediate 1.0, Advanced 0.8) × 1.25 for weak chapters.
5. Chapters are ordered by importance (weak +3, high priority +2, medium +1). Class 11 students follow school order (Class 11 chapters first).
6. If the syllabus does not fit, durations are compressed (to at most 60%), and if still too long, the least important topics are left out and reported.
7. Long topics are split into parts of ≤ 90 minutes. Each study day takes ~80% new topics (rotating across subjects) and ~20% revision of the previous day.
8. Every 7th day is a weekly revision + practice-test day; every 2nd such day is a full mock-test day.
9. **Adjust for missed tasks**: rebuilds the remaining schedule from today, keeping completed work and rescheduling unfinished topics.

## 8. API documentation

All routes are prefixed with `/api`. 🔒 = needs `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | `{name, email, password, classLevel, exam, level}` → `{token, user}` |
| POST | `/auth/login` | `{email, password}` → `{token, user}` |
| GET 🔒 | `/auth/me` | Current user + profile |
| GET 🔒 | `/profile` | Profile |
| PUT 🔒 | `/profile` | Update name, class, exam, level, examDate, hoursPerDay, subjects, weakChapters |
| PUT 🔒 | `/profile/password` | `{currentPassword, newPassword}` |
| POST 🔒 | `/profile/chapters` | `{subject, chapter, completed}` mark chapter complete/pending |
| GET 🔒 | `/syllabus?exam=` | Subjects → chapters → topics |
| GET 🔒 | `/dashboard` | Dashboard summary |
| GET 🔒 | `/analytics` | All analytics data |
| GET 🔒 | `/chat/status` | Whether Gemini or Groq is configured |
| GET 🔒 | `/chat` | List conversations |
| POST 🔒 | `/chat/send` | `{conversationId?, message}` → AI (or fallback) reply + detected details |
| GET/DELETE 🔒 | `/chat/:id` | Get / delete a conversation |
| GET 🔒 | `/plan` | Active plan + counts (total, completed, missed, daysLeft) |
| GET 🔒 | `/plan/tasks?from=&to=` | Tasks grouped by day (max 62 days) |
| POST 🔒 | `/plan/generate` | `{exam, examDate, classLevel, level, hoursPerDay, subjects, completedChapters, weakChapters}` |
| POST 🔒 | `/plan/rebalance` | Re-plan around missed tasks |
| GET 🔒 | `/progress/day?date=` | Tasks + summary for a day |
| GET 🔒 | `/progress/summary` | Daily/weekly/monthly %, totals, streak, chapter status |
| PUT 🔒 | `/progress/note` | `{date, note}` |
| PATCH 🔒 | `/tasks/:id` | `{status, actualMinutes, questionsDone, notes}` |
| GET 🔒 | `/resources?exam=&subject=&chapter=` | Videos (API), pinned videos, search URL, portals |
| POST 🔒 | `/resources/saved` | `{subject, chapter, url, title}` pin a YouTube video |
| DELETE 🔒 | `/resources/saved/:id` | Remove pinned video |
| GET 🔒 | `/tests?exam=all` | Tests (with attempts and best score) |
| GET 🔒 | `/tests/:id` | Test questions **without answers** |
| POST 🔒 | `/tests/:id/submit` | `{answers[], timeTakenSeconds}` → result + review |
| GET 🔒 | `/tests/results/me` · `/tests/results/:id` | Result history / one result |

Errors always look like `{ "message": "..." }` with a proper HTTP status (400, 401, 404, 409, 429, 500).

## 9. Project structure

```
sathee-guidance-agent/
├── package.json            # root scripts (npm run dev starts both apps)
├── render.yaml             # Render blueprint for the backend
├── README.md · CAPSTONE_VIVA.md · .gitignore
├── server/
│   ├── server.js           # Express app, CORS, startup + auto-seed
│   ├── config/             # env.js, db.js
│   ├── middleware/         # auth.js (JWT), error.js
│   ├── models/             # 9 Mongoose models
│   ├── controllers/        # auth, profile, plan, progress, chat, resources, tests, analytics
│   ├── routes/index.js     # every API route in one file
│   ├── services/           # planner, gemini, assistant, youtube, progressService
│   ├── data/               # syllabus.js, questions.js, resources.js, seed.js
│   ├── utils/              # date helpers, validation, constants, AppError
│   └── .env.example
└── client/
    ├── index.html · vite.config.js · vercel.json · .env.example
    └── src/
        ├── main.jsx · App.jsx
        ├── components/     # Icons, TaskItem, ActivityBars, Progress widgets, Loader, States,
        │   │               # ProtectedRoute
        │   └── ui/         # Button, Field, Segmented, PageHeader, Skeleton
        ├── layouts/        # AppLayout (sidebar · tablet rail · mobile tab bar)
        ├── pages/          # Landing, Login, Register, Dashboard, Assistant, StudyPlan,
        │                   # Resources, DailyProgress, MockTests, TestAttempt, TestResult,
        │                   # Analytics, Profile, NotFound
        ├── context/        # AuthContext, ToastContext, ConfirmContext
        ├── hooks/          # useApi
        ├── services/       # api.js (Axios + JWT interceptor)
        ├── styles/         # tokens · base · components · layout · pages (see client/DESIGN_SYSTEM.md)
        └── utils/          # format.js
```

## 10. Local setup (VS Code)

### Required software
- **Node.js 22 or newer** — required by the installed `@google/genai` SDK — <https://nodejs.org>
- **VS Code** — <https://code.visualstudio.com>
- A free **MongoDB Atlas** account — <https://www.mongodb.com/atlas> (or a local MongoDB server)
- Optional: **Gemini API key** — <https://aistudio.google.com/apikey>
- Optional: **YouTube Data API v3 key** — Google Cloud Console

### Step 1 — MongoDB Atlas
1. Create a free **M0** cluster.
2. *Database Access* → add a database user (username + password).
3. *Network Access* → add your IP (for Render also add `0.0.0.0/0`).
4. *Connect → Drivers* → copy the connection string and add a database name, e.g.
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/sathee?retryWrites=true&w=majority`

### Step 2 — Environment files
```bash
# from the project folder
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Edit `server/.env`:
```
MONGODB_URI=<your Atlas string>
JWT_SECRET=<long random string>     # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=<optional>
GEMINI_MODEL=gemini-3.8-flash       # change if Google retires this model name
GROQ_API_KEY=<optional free-tier fallback>
GROQ_MODEL=openai/gpt-oss-20b
YOUTUBE_API_KEY=<optional>
```
The backend loads these values from `server/.env` even when it is started from
the repository root. Restart the backend after changing either value. Gemini
request failures are logged server-side with the Google HTTP status and
message; the API key is redacted from those logs.
`client/.env` already contains `VITE_API_URL=http://localhost:5000/api`.
Gemini is tried first. Groq is tried only for retryable Gemini failures
(quota, rate limiting, temporary provider errors, or timeouts); invalid
requests and authentication failures do not switch providers. If both fail,
the built-in SATHEE guidance fallback is used.

### Step 3 — Install and run
```bash
npm run install-all     # installs root, server and client packages
npm run dev             # starts backend (5000) and frontend (5173) together
```
Open **http://localhost:5173**. The syllabus and mock tests are seeded automatically the first time the server connects to an empty database (`npm run seed` re-seeds them).

Run separately if you prefer: `npm run server` and `npm run client` in two terminals.

Production build of the frontend: `npm run build` (output in `client/dist`), preview it with
`npm run preview --prefix client`. The UI design system is documented in `client/DESIGN_SYSTEM.md`.

### Troubleshooting
| Problem | Fix |
|---|---|
| `MONGODB_URI is not set` | Create `server/.env` from `.env.example` |
| `MongoServerSelectionError` / timeout | Add your IP in Atlas *Network Access*; check username/password; URL-encode special characters in the password |
| Frontend says "Cannot reach the server" | Make sure the backend is running on port 5000 and `VITE_API_URL` is correct; restart Vite after editing `.env` |
| CORS error in browser console | `CLIENT_URL` in `server/.env` must exactly match the frontend URL (no trailing slash) |
| Chat shows "AI tutor is unavailable" | Configure `GEMINI_API_KEY` and/or `GROQ_API_KEY`, restart the server; quota and temporary Gemini failures automatically try Groq before built-in guidance |
| Port already in use | Close the other process or change `PORT` (and `VITE_API_URL`) |
| Resources show only links | Expected without `YOUTUBE_API_KEY`; add a key for embedded results, or pin videos yourself |

## 11. Deployment

### Backend → Render
1. Push the project to GitHub (`.env` files are git-ignored — never commit them).
2. Render → **New → Web Service** → connect the repo (or **New → Blueprint** to use `render.yaml`).
3. Root directory `server`, build `npm install`, start `npm start`, health check `/api/health`.
4. Environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `YOUTUBE_API_KEY`, `APP_TIMEZONE=Asia/Kolkata`.
5. Note the URL, e.g. `https://sathee-guidance-agent-api.onrender.com`. (Free instances sleep after inactivity; the first request can take ~1 minute.)

### Frontend → Vercel
1. Vercel → **Add New Project** → import the repo.
2. Root directory `client`, framework **Vite**, build `npm run build`, output `dist`.
3. Environment variable `VITE_API_URL=https://<your-render-service>.onrender.com/api`.
4. Deploy. `client/vercel.json` rewrites all paths to `index.html` so page refreshes work.
5. Put the final Vercel URL into Render's `CLIENT_URL` and redeploy the backend (multiple URLs can be comma-separated).

## 12. Demonstration script (for faculty)
1. Landing page → **Get started** → register (e.g. Class 12, JEE Main, Beginner).
2. **My Study Plan**: set exam date, hours, mark one chapter *Done* and one *Weak* → Generate. Show overview, strategy and the week schedule; expand a task to show objectives, practice target, revision and lecture link.
3. **Daily Progress**: tick a task, record minutes/questions/notes, save a daily note; show weekly/monthly progress and chapter checklist.
4. **Dashboard**: numbers updated instantly (tasks done, studied time, streak, syllabus %).
5. **AI Study Assistant**: send *"I am preparing for JEE Main. My exam is on 15 March 2027. I am in Class 12 and I can study six hours per day. I am a beginner."* → detected details → **Apply & build plan**. Ask a concept question.
6. **Learning Resources**: choose subject/chapter, open the YouTube search / SATHEE / NCERT links, pin a video and play it embedded.
7. **Mock Tests**: start a test, show timer and palette, submit, show score, negative marking and explanations.
8. **Performance Analytics**: charts reflect the actions just performed.
9. Log out → log back in → progress is still there (stored in MongoDB).

## 13. Limitations
- The syllabus dataset is NCERT-aligned and hand-made; chapter priorities and hour estimates are indicative, not official weightage. Verify against the latest NTA / JEE Advanced bulletins.
- The question bank is small (7 tests, ~75 questions) and the JEE Advanced test uses single-correct MCQs only.
- Without a YouTube API key no specific videos are recommended — only search links, official portals and student-pinned videos (we never invent video links).
- Free tiers: Gemini and YouTube quotas are limited; Render free instances sleep when idle.
- The AI can still make mistakes in explanations; students should cross-check with NCERT.
- "Today" is calculated in Indian Standard Time (configurable with `APP_TIMEZONE`).
- No email verification or password-reset email.

## 14. Future enhancements
- Larger, topic-tagged question bank, numerical/multi-correct questions and adaptive tests.
- Diagnostic test on sign-up to set preparation level automatically.
- Use mock-test mistakes to automatically mark weak chapters and re-plan.
- Hindi/Telugu and other regional-language UI; voice input for the chatbot.
- Offline-first PWA with reminders/notifications for low-bandwidth students.
- Teacher/mentor dashboard to monitor a group of students.
- Email verification and password reset.
