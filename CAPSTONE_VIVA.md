# SATHEE Guidance Agent — Viva Preparation

Short, simple answers you can explain confidently. Each answer points to the file that implements it, so you can open the code during the viva.

---

### 1. What is SATHEE Guidance Agent?
It is a full-stack web application that works as a **free personal study mentor** for Class 11–12 students preparing for **JEE Main, JEE Advanced and NEET**. It creates a day-by-day study plan, tracks daily progress, recommends lectures, conducts mock tests, shows analytics and answers doubts through an AI chatbot. It is an independent student project inspired by the official SATHEE portal of IIT Kanpur — it is **not** an official government application.

### 2. Why did we choose this project?
Coaching is expensive, so many talented students from poor families can't access it. Free material already exists (NCERT, SATHEE, YouTube), but students still miss **planning, discipline, tracking, testing and mentoring**. Our app gives those things for free. It also let us combine full-stack development, databases, algorithms and AI in one meaningful problem.

### 3. Why React.js?
- The UI is built from **reusable components** (e.g. `TaskItem`, `StatCard`, `ProgressRing`) used on many pages.
- React updates only the changed parts of the page, so ticking a task updates the dashboard instantly.
- Huge ecosystem: React Router for pages, Axios for API calls, Recharts for charts.
- We used **Vite** as the build tool because it starts in under a second and builds a small production bundle.

### 4. Why Node.js and Express.js?
- **One language (JavaScript) for frontend and backend**, so the team learns less and shares utility logic.
- Node.js is non-blocking, good for an API that mostly waits on the database and AI APIs.
- Express is minimal: `routes/index.js` maps a URL to a controller function — easy to read and explain.
- Express 5 automatically forwards errors from `async` functions to our error handler (`middleware/error.js`).

### 5. Why MongoDB?
- Our data is naturally **document-shaped**: a chat with an array of messages, a syllabus with chapters and topics, a profile with weak chapters.
- The schema can evolve without migrations (we added a `part` field to tasks easily).
- **MongoDB Atlas** has a free cloud tier, and **Mongoose** gives schemas, validation (`required`, `enum`, `min/max`) and relationships using `ref`.

### 6. What is the Gemini API?
Gemini is Google's large language model family. We call it from the backend using the **official `@google/genai` SDK** (`services/gemini.js`). The API key lives only in `server/.env` — the browser never sees it. The model name is configurable (`GEMINI_MODEL`) so we can switch if Google retires a model.

### 7. How does the AI chatbot work?
(`controllers/chatController.js`, `services/assistant.js`)
1. The student sends a message → `POST /api/chat/send`.
2. The backend builds a **system prompt** with the student's real data from MongoDB: exam, class, level, exam date and days left, study hours, weak chapters, syllabus %, today's tasks and the chapter list. It also contains rules: explain simply, never invent exam dates or video links, ask for study hours if missing, reply in the student's language.
3. The last 20 messages are sent as history so the conversation has memory.
4. A rule-based **extractor** (regular expressions) also reads the exam, date, class, hours and level from the message. The UI shows them with an **"Apply to my profile & build plan"** button.
5. The question and answer are saved in the `ChatHistory` collection.
6. **Fallback:** if there's no key, the quota is over, or there's a timeout (30 s), we catch the error and reply with a clear message plus rule-based help (today's tasks, strategy tips, detected details). The app never crashes because of AI.

### 8. How does the study planner work?
(`services/planner.js`) — **The timetable is created by our algorithm, not by AI**, so it is predictable and works offline from AI.
1. Count days from today to the exam (minimum 7).
2. Reserve the last ~10% of days for final mock tests and revision.
3. Load the syllabus from MongoDB and remove completed chapters/topics.
4. Estimate time per topic: chapter hours ÷ topics × level factor (Beginner 1.3×, Advanced 0.8×) × 1.25 for weak chapters.
5. Sort chapters by priority: weak chapters and high-priority chapters first (Class 11 students follow school order).
6. If time is too short, compress durations; if still too long, drop the least important topics and tell the student.
7. Split long topics into parts (≤ 90 min) and fill each day **round-robin across subjects**, keeping ~20% of the day for revising yesterday's topics.
8. Every 7th day: weekly revision + practice test; every 14th day: full mock test.
9. Each task stores date, subject, chapter, topic, objectives, duration, practice-question target, revision activity and a lecture link.
10. **Adjust for missed tasks** re-runs the algorithm from today, skipping everything already completed.

AI is only used to write a short personalised **strategy** paragraph; if AI fails, a rule-based strategy is written instead.

### 9. How is student progress stored?
- Each task is a `DailyTask` document with `status`, `actualMinutes`, `questionsDone`, `notes`, `completedAt`.
- When a task changes (`PATCH /api/tasks/:id`), `recomputeDay()` recalculates that day's **`Progress`** document (planned, completed, minutes, questions) from the tasks, so the numbers are always consistent.
- When all topics of a chapter are completed, the chapter is automatically added to `completedChapters` in `StudentProfile` (students can also tick chapters manually).
- Streak = number of consecutive days with study activity.
- Because everything is in MongoDB, progress remains after logout/login and on other devices.

### 10. How does YouTube integration work?
(`services/youtube.js`, `controllers/resourceController.js`)
- If `YOUTUBE_API_KEY` is set, we call the **YouTube Data API v3 search** endpoint for "*chapter subject exam lecture*", only embeddable, safe-search videos, and cache results for 6 hours to save quota. Videos are shown in embedded players.
- Without a key (or if the quota is over), we show a **YouTube search link** for the chapter plus official free portals (SATHEE, NCERT).
- Students can **pin any YouTube link** to a chapter; we extract the 11-character video ID and embed it.
- We **never hard-code or invent video URLs**, because we cannot guarantee a made-up ID exists.

### 11. How does the frontend communicate with the backend?
- The React app uses **Axios** (`client/src/services/api.js`) to send HTTP requests with JSON to the Express **REST API** (`/api/...`).
- An Axios **interceptor** adds `Authorization: Bearer <token>` to every request; another one logs the user out on a 401 response.
- The API base URL comes from `VITE_API_URL`, so the same code works locally and in production.
- The backend's **CORS** settings only allow the configured frontend URL(s).

### 12. What is JWT authentication?
JWT (JSON Web Token) is a signed token that proves who the user is.
1. On login, the server checks the password with **bcrypt** (passwords are stored only as salted hashes).
2. It creates a token containing the user ID, signed with `JWT_SECRET`, valid for 7 days.
3. The frontend stores it in `localStorage` and sends it with each request.
4. `middleware/auth.js` verifies the signature and loads the user; invalid or expired tokens get **401**.
5. On page refresh, `AuthContext` calls `/api/auth/me` to restore the session (persistent login).
Because the token is self-contained, the server doesn't need to store sessions.

### 13. How is the application deployed?
- **Database:** MongoDB Atlas free cluster.
- **Backend:** Render web service (`server` folder, `npm start`), with environment variables set in the Render dashboard (`render.yaml` describes them).
- **Frontend:** Vercel (`client` folder, Vite build → `dist`), with `VITE_API_URL` pointing to the Render API. `vercel.json` makes page refreshes work for client-side routes.
- Secrets are only in environment variables; `.env` files are in `.gitignore` and never pushed to GitHub.

### 14. What are the limitations?
- Syllabus priorities and hours are indicative, not official weightage; the dataset must be checked against NTA bulletins.
- Small question bank (≈ 75 questions in 7 tests), single-correct MCQs only.
- Free API quotas (Gemini, YouTube) and Render's free instance sleeping.
- AI explanations can contain mistakes — students should verify with NCERT.
- No email verification / password reset.

### 15. What are the future enhancements?
- Bigger question bank with numerical and multi-correct questions; adaptive tests.
- Diagnostic test at sign-up to set the level automatically.
- Automatically mark weak chapters from test mistakes and re-plan.
- Regional languages (Hindi, Telugu) and voice input.
- Offline-capable mobile PWA with study reminders.
- Mentor/teacher dashboard for groups of students.

---

### Quick extra questions examiners often ask
- **Why not let AI make the whole timetable?** AI output can be inconsistent, can invent syllabus content and stops working when the quota ends. A deterministic algorithm is explainable and testable; AI is used where it is strongest — explanation and conversation.
- **How do you prevent seeing test answers?** `GET /api/tests/:id` removes `answerIndex` before sending questions; answers are checked only on the server at submission.
- **How is the password secured?** bcrypt hashing with salt (10 rounds) in a Mongoose `pre('save')` hook; the hash field has `select: false` so it is never returned.
- **What happens when the exam date changes?** The student updates it in Profile or the planner and regenerates; completed work is kept and only future pending tasks are replaced.
- **How do you handle time zones?** Dates are stored as `YYYY-MM-DD` strings computed in Asia/Kolkata (`utils/date.js`), so "today" is correct even though Render's server runs in UTC.
