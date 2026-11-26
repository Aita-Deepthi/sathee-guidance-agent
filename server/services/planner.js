/*
 * Rule-based study planner.
 *
 * The timetable is produced by this deterministic algorithm (not by AI), so it
 * is predictable, explainable and works even when the AI API is unavailable.
 *
 * Steps:
 *  1. Count days from start date to the day before the exam.
 *  2. Reserve the last ~10% of days for final revision and full mock tests.
 *  3. Build a list of incomplete topics from the syllabus dataset.
 *  4. Estimate minutes per topic (adjusted for level and weak chapters).
 *  5. Order chapters: weak + high-priority first (Class 12) or in school
 *     order (Class 11), keeping a chapter's topics together.
 *  6. Fill each study day by rotating across subjects (subject interleaving),
 *     keeping ~20% of the day for revision.
 *  7. Every 7th day is a weekly revision + practice-test day; every 14th day
 *     is a full mock test day.
 *  8. If the syllabus doesn't fit, topic time is compressed proportionally.
 */
const { addDays, daysBetween } = require('../utils/date');
const { youtubeSearchUrl } = require('../data/resources');
const AppError = require('../utils/AppError');

const LEVEL_FACTOR = { Beginner: 1.3, Intermediate: 1.0, Advanced: 0.8 };
const PRIORITY_SCORE = { high: 2, medium: 1, low: 0 };
const QUESTIONS_PER_HOUR = { Beginner: 10, Intermediate: 15, Advanced: 20 };
const MOCK_MINUTES = { 'JEE Main': 180, 'JEE Advanced': 360, NEET: 200 };

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const topicKey = (subject, chapter, topic) => `${subject}|${chapter}|${topic}`;
const chapterKey = (subject, chapter) => `${subject}|${chapter}`;

function buildSchedule(input) {
  const {
    exam, examDate, startDate, hoursPerDay, level, classLevel,
    subjects, syllabus, weakChapters = [], completedChapters = [], doneTopicKeys = new Set(),
  } = input;

  const totalDays = daysBetween(startDate, examDate); // tasks run startDate .. examDate-1
  if (totalDays < 7) {
    throw new AppError('Your exam is less than 7 days away. Focus on revision and mock tests — a full plan needs at least 7 days.', 400);
  }

  const dailyMinutes = Math.round(hoursPerDay * 60);
  const finalDays = totalDays < 21 ? 2 : Math.min(30, Math.max(3, Math.round(totalDays * 0.1)));
  const learningDays = totalDays - finalDays;
  const levelFactor = LEVEL_FACTOR[level] || 1;

  const weakSet = new Set(weakChapters.map((w) => chapterKey(w.subject, w.chapter)));
  const doneChapterSet = new Set(completedChapters.map((c) => chapterKey(c.subject, c.chapter)));

  // ---- 3/4/5: build ordered topic queues per subject ----
  const queues = {};
  let totalNeeded = 0;
  for (const subject of subjects) {
    const entry = syllabus.find((s) => s.subject === subject);
    if (!entry) continue;
    const chapters = entry.chapters
      .filter((ch) => !doneChapterSet.has(chapterKey(subject, ch.name)))
      .map((ch, idx) => {
        const weak = weakSet.has(chapterKey(subject, ch.name));
        return { ...ch, weak, idx, score: (weak ? 3 : 0) + PRIORITY_SCORE[ch.priority] };
      });

    chapters.sort((a, b) => {
      if (classLevel === 11 && a.classLevel !== b.classLevel) return a.classLevel - b.classLevel;
      return b.score - a.score || a.idx - b.idx;
    });

    queues[subject] = [];
    for (const ch of chapters) {
      const perTopic = (ch.estHours * 60 * levelFactor * (ch.weak ? 1.25 : 1)) / ch.topics.length;
      for (const topic of ch.topics) {
        if (doneTopicKeys.has(topicKey(subject, ch.name, topic))) continue;
        queues[subject].push({ subject, chapter: ch.name, topic, minutes: perTopic, weak: ch.weak, score: ch.score });
        totalNeeded += perTopic;
      }
    }
  }

  // ---- decide day types ----
  const dayTypes = [];
  let reviewCount = 0;
  for (let i = 0; i < learningDays; i++) {
    if ((i + 1) % 7 === 0) {
      reviewCount++;
      dayTypes.push(reviewCount % 2 === 0 ? 'mock' : 'review');
    } else dayTypes.push('study');
  }
  const studyDays = dayTypes.filter((t) => t === 'study').length;
  const newTopicBudget = Math.round(dailyMinutes * 0.8);
  const capacity = studyDays * newTopicBudget;

  // ---- 8: fit the syllabus into the available time ----
  // First compress topic time (down to 60% at most). If it still doesn't fit,
  // keep the most important topics (weak + high priority) and report the rest.
  let compressed = false;
  let topicsSkipped = 0;
  if (totalNeeded > capacity && totalNeeded > 0) {
    compressed = true;
    const factor = Math.max(0.6, capacity / totalNeeded);
    Object.values(queues).forEach((q) => q.forEach((u) => (u.minutes *= factor)));
    let used = 0;
    const keep = new Set();
    Object.values(queues).flat()
      .map((u, order) => ({ u, order }))
      .sort((a, b) => b.u.score - a.u.score || a.order - b.order)
      .forEach(({ u }) => {
        if (used + u.minutes <= capacity) { keep.add(u); used += u.minutes; }
      });
    for (const s of Object.keys(queues)) {
      const before = queues[s].length;
      queues[s] = queues[s].filter((u) => keep.has(u));
      topicsSkipped += before - queues[s].length;
    }
  }
  const topicsScheduled = Object.values(queues).reduce((n, q) => n + q.length, 0);

  // Split long topics into parts of at most ~90 minutes so days pack evenly
  const maxChunk = Math.min(90, Math.max(30, Math.round(newTopicBudget / 2)));
  for (const s of Object.keys(queues)) {
    queues[s] = queues[s].flatMap((u) => {
      const parts = Math.max(1, Math.ceil(u.minutes / maxChunk));
      const m = Math.max(20, round5(u.minutes / parts));
      if (parts === 1) return [{ ...u, minutes: m }];
      return Array.from({ length: parts }, (_, k) => ({ ...u, minutes: m, part: `Part ${k + 1} of ${parts}` }));
    });
  }

  // ---- helpers to create tasks ----
  const tasks = [];
  const qph = QUESTIONS_PER_HOUR[level] || 15;
  const studyTask = (date, u) => ({
    date, type: 'study', subject: u.subject, chapter: u.chapter, topic: u.topic, part: u.part || '',
    durationMinutes: u.minutes,
    practiceTarget: Math.max(5, Math.round((u.minutes / 60) * qph)),
    objectives: [
      `Understand the core concepts of "${u.topic}"`,
      `Read the NCERT section and solved examples on ${u.topic}`,
      `Solve practice questions on ${u.topic} and note your mistakes`,
    ],
    revisionActivity: `Write a short summary with key formulas/facts of "${u.topic}"${u.weak ? ' (weak chapter — revisit tomorrow)' : ''}`,
    video: { title: `Find lectures: ${u.chapter} — ${u.topic}`, url: youtubeSearchUrl(exam, u.subject, `${u.chapter} ${u.topic}`), kind: 'search' },
  });
  const revisionTask = (date, subject, chapters, minutes, label) => ({
    date, type: 'revision', subject, chapter: chapters.join(', ').slice(0, 300), topic: label,
    durationMinutes: round5(minutes),
    practiceTarget: Math.max(5, Math.round((minutes / 60) * qph * 0.6)),
    objectives: ['Recall key concepts without looking at notes', 'Re-solve questions you got wrong earlier'],
    revisionActivity: 'Active recall + review of your error log',
  });
  const practiceTest = (date, minutes, subjectsCovered) => ({
    date, type: 'practice-test', subject: 'Mixed', chapter: subjectsCovered.join(', '), topic: 'Weekly practice test',
    durationMinutes: round5(minutes), practiceTarget: 30,
    objectives: ['Attempt a timed test on this week\'s chapters', 'Analyse every mistake'],
    revisionActivity: 'Add wrong answers to your error log',
  });
  const mockTest = (date, label) => ({
    date, type: 'mock-test', subject: 'Mixed', chapter: 'Full syllabus covered so far', topic: label,
    durationMinutes: Math.min(dailyMinutes, MOCK_MINUTES[exam] || 180),
    practiceTarget: 0,
    objectives: ['Attempt a full-length mock test in exam conditions (use the Mock Tests page or SATHEE portal)', 'Analyse accuracy and time per subject'],
    revisionActivity: 'Revise the topics behind every wrong answer',
  });

  // ---- 6/7: walk through learning days ----
  const subjectList = Object.keys(queues);
  let rr = 0;
  let weekChapters = {}; // subject -> Set(chapters) studied this week
  let yesterdayTopics = [];
  const allChaptersStudied = []; // for later revision cycles
  let revisionCycle = 0;

  for (let i = 0; i < learningDays; i++) {
    const date = addDays(startDate, i);
    const type = dayTypes[i];

    if (type === 'review' || type === 'mock') {
      const subs = Object.keys(weekChapters);
      if (type === 'mock') {
        tasks.push(mockTest(date, 'Full-length mock test'));
        const left = dailyMinutes - tasks[tasks.length - 1].durationMinutes;
        if (left >= 30) tasks.push(revisionTask(date, 'Mixed', ['Mock test analysis'], left, 'Mock test analysis and error-log revision'));
      } else {
        const testMin = Math.min(90, Math.round(dailyMinutes * 0.35));
        const revMin = (dailyMinutes - testMin) / Math.max(1, subs.length);
        for (const s of subs) tasks.push(revisionTask(date, s, [...weekChapters[s]], revMin, `Weekly revision — ${s}`));
        tasks.push(practiceTest(date, subs.length ? testMin : dailyMinutes, subs.length ? subs : subjectList));
      }
      weekChapters = {};
      continue;
    }

    // Study day
    let remaining = newTopicBudget;
    const todays = [];
    let guard = 0;
    while (remaining > 15 && guard < 50) {
      guard++;
      const active = subjectList.filter((s) => queues[s].length > 0);
      if (active.length === 0) break;
      const subject = active[rr % active.length];
      rr++;
      const unit = queues[subject][0];
      if (unit.minutes <= remaining + 15 || todays.length === 0) {
        queues[subject].shift();
        todays.push(unit);
        remaining -= unit.minutes;
      } else if (active.every((s) => queues[s][0].minutes > remaining + 15)) {
        break;
      }
    }

    if (todays.length > 0) {
      todays.forEach((u) => {
        tasks.push(studyTask(date, u));
        (weekChapters[u.subject] = weekChapters[u.subject] || new Set()).add(u.chapter);
        if (!allChaptersStudied.find((c) => c.subject === u.subject && c.chapter === u.chapter)) {
          allChaptersStudied.push({ subject: u.subject, chapter: u.chapter, weak: u.weak });
        }
      });
      // Revision of yesterday's work (spaced repetition), or of today's if first day
      const revTarget = yesterdayTopics.length ? yesterdayTopics : todays;
      const revMin = Math.max(20, dailyMinutes - (newTopicBudget - remaining));
      const revSubjects = [...new Set(revTarget.map((u) => u.subject))];
      const bySubject = revSubjects.length === 1 ? revSubjects[0] : 'Mixed';
      tasks.push(revisionTask(date, bySubject, [...new Set(revTarget.map((u) => u.chapter))], revMin,
        yesterdayTopics.length ? 'Revise yesterday\'s topics' : 'Revise today\'s topics before sleeping'));
      yesterdayTopics = todays;
    } else {
      // Syllabus finished early → revision cycles (weak chapters first)
      const pool = [...allChaptersStudied].sort((a, b) => Number(b.weak) - Number(a.weak));
      if (pool.length === 0) break;
      const perDay = Math.min(3, pool.length);
      for (let k = 0; k < perDay; k++) {
        const c = pool[(revisionCycle + k) % pool.length];
        tasks.push(revisionTask(date, c.subject, [c.chapter], dailyMinutes * 0.7 / perDay, `Revision cycle — ${c.chapter}`));
      }
      revisionCycle += perDay;
      tasks.push(practiceTest(date, dailyMinutes * 0.3, [...new Set(pool.map((p) => p.subject))]));
    }
  }

  // Leftover topics (only possible after rounding) go onto the last study days
  const leftovers = Object.values(queues).flat();
  if (leftovers.length) {
    const studyDates = [...new Set(tasks.filter((t) => t.type === 'study').map((t) => t.date))];
    leftovers.forEach((u, k) => {
      const date = studyDates[studyDates.length - 1 - (k % Math.max(1, studyDates.length))] || startDate;
      tasks.push(studyTask(date, u));
    });
  }

  // ---- 2: final revision period ----
  const weakFirst = [...allChaptersStudied].sort((a, b) => Number(b.weak) - Number(a.weak));
  for (let j = 0; j < finalDays; j++) {
    const date = addDays(startDate, learningDays + j);
    const isLast = j === finalDays - 1;
    if (isLast) {
      tasks.push(revisionTask(date, 'Mixed', ['Formula sheets & short notes'], Math.min(dailyMinutes, 180),
        'Light revision — formula sheets, rest well, check admit card & exam centre'));
    } else if (j % 2 === 0) {
      tasks.push(mockTest(date, `Final mock test ${j / 2 + 1}`));
      const left = dailyMinutes - tasks[tasks.length - 1].durationMinutes;
      if (left >= 30) tasks.push(revisionTask(date, 'Mixed', ['Mock test analysis'], left, 'Mock analysis and weak-topic fixes'));
    } else {
      const per = Math.min(3, Math.max(1, weakFirst.length));
      for (let k = 0; k < per; k++) {
        const c = weakFirst[(j + k) % Math.max(1, weakFirst.length)];
        if (!c) break;
        tasks.push(revisionTask(date, c.subject, [c.chapter], dailyMinutes / per, `Final revision — ${c.chapter}`));
      }
    }
  }

  return {
    tasks,
    summary: {
      totalDays,
      studyDays,
      finalRevisionDays: finalDays,
      totalTasks: tasks.length,
      topicsScheduled,
      compressed,
      topicsSkipped,
      mockTests: tasks.filter((t) => t.type === 'mock-test').length,
    },
  };
}

module.exports = { buildSchedule, topicKey, chapterKey };
