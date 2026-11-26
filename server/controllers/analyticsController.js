const mongoose = require('mongoose');
const DailyTask = require('../models/DailyTask');
const Progress = require('../models/Progress');
const TestResult = require('../models/TestResult');
const MockTest = require('../models/MockTest');
const StudyPlan = require('../models/StudyPlan');
const { getProfileOrFail } = require('./profileController');
const { computeSyllabusStats, computeStreak } = require('../services/progressService');
const { todayStr, addDays, weekStart, daysBetween } = require('../utils/date');

// Accuracy per subject and the chapters where the student makes the most mistakes
async function testInsights(userId) {
  const results = await TestResult.find({ user: userId }).sort({ createdAt: 1 }).lean();
  const subj = {};
  const wrongByChapter = {};
  const testIds = [...new Set(results.map((r) => String(r.test)))];
  const tests = await MockTest.find({ _id: { $in: testIds.map((id) => new mongoose.Types.ObjectId(id)) } }).lean();
  const testMap = Object.fromEntries(tests.map((t) => [String(t._id), t]));

  for (const r of results) {
    for (const b of r.subjectBreakdown || []) {
      subj[b.subject] = subj[b.subject] || { subject: b.subject, correct: 0, total: 0 };
      subj[b.subject].correct += b.correct;
      subj[b.subject].total += b.total;
    }
    const t = testMap[String(r.test)];
    if (t) {
      t.questions.forEach((q, i) => {
        if (r.answers[i] !== -1 && r.answers[i] !== q.answerIndex) {
          const k = `${q.subject}|${q.chapter}`;
          wrongByChapter[k] = wrongByChapter[k] || { subject: q.subject, chapter: q.chapter, wrong: 0 };
          wrongByChapter[k].wrong++;
        }
      });
    }
  }
  const subjectAccuracy = Object.values(subj).map((s) => ({ ...s, accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0 }));
  const weakFromTests = Object.values(wrongByChapter).sort((a, b) => b.wrong - a.wrong).slice(0, 6);
  const chapterAccuracy = {};
  results.forEach((result) => (result.chapterBreakdown || []).forEach((chapter) => {
    const key = `${chapter.subject}|${chapter.chapter}`;
    chapterAccuracy[key] = chapterAccuracy[key] || { subject: chapter.subject, chapter: chapter.chapter, correct: 0, total: 0 };
    chapterAccuracy[key].correct += chapter.correct;
    chapterAccuracy[key].total += chapter.total;
  }));
  return {
    results,
    subjectAccuracy,
    weakFromTests,
    chapterAccuracy: Object.values(chapterAccuracy).map((chapter) => ({
      ...chapter,
      accuracy: chapter.total ? Math.round((chapter.correct / chapter.total) * 100) : 0,
    })),
  };
}

// GET /api/analytics
async function getAnalytics(req, res) {
  const userId = req.user._id;
  const profile = await getProfileOrFail(userId);
  const today = todayStr();

  const [syllabus, streak, insights, progressDocs, taskTotals] = await Promise.all([
    computeSyllabusStats(userId, profile),
    computeStreak(userId),
    testInsights(userId),
    Progress.find({ user: userId, date: { $gte: addDays(weekStart(today), -49), $lte: today } }).lean(),
    DailyTask.aggregate([
      { $match: { user: userId, date: { $lte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Weekly study hours for the last 8 weeks
  const weeklyHours = [];
  for (let w = 7; w >= 0; w--) {
    const start = addDays(weekStart(today), -7 * w);
    const end = addDays(start, 6);
    const mins = progressDocs.filter((d) => d.date >= start && d.date <= end).reduce((n, d) => n + d.minutesStudied, 0);
    weeklyHours.push({ week: start.slice(5), hours: Math.round(mins / 6) / 10 });
  }
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const date = addDays(today, -i);
    const d = progressDocs.find((x) => x.date === date);
    daily.push({ date: date.slice(5), hours: d ? Math.round(d.minutesStudied / 6) / 10 : 0, completed: d ? d.completedTasks : 0, planned: d ? d.plannedTasks : 0 });
  }

  const done = (taskTotals.find((t) => t._id === 'completed') || {}).count || 0;
  const pending = (taskTotals.find((t) => t._id === 'pending') || {}).count || 0;
  const mock = insights.results.map((r) => ({
    date: r.createdAt.toISOString().slice(0, 10), title: r.testTitle, percentage: r.percentage, score: r.score, maxScore: r.maxScore,
  }));
  const avgMock = mock.length ? Math.round(mock.reduce((n, m) => n + m.percentage, 0) / mock.length) : null;

  // Strong / weak areas (from progress + test accuracy)
  const strong = [], weak = [];
  for (const s of syllabus.bySubject) {
    const acc = insights.subjectAccuracy.find((a) => a.subject === s.subject);
    if (acc && acc.total >= 3) {
      if (acc.accuracy >= 70) strong.push({ name: s.subject, reason: `${acc.accuracy}% accuracy in mock tests` });
      else if (acc.accuracy < 50) weak.push({ name: s.subject, reason: `${acc.accuracy}% accuracy in mock tests` });
    }
  }
  insights.weakFromTests.slice(0, 4).forEach((c) => weak.push({ name: `${c.chapter} (${c.subject})`, reason: `${c.wrong} wrong answer(s) in tests` }));
  profile.weakChapters.forEach((c) => {
    if (!weak.some((w) => w.name.startsWith(c.chapter))) weak.push({ name: `${c.chapter} (${c.subject})`, reason: 'marked weak by you' });
  });
  syllabus.bySubject.forEach((s) => s.chapters.filter((c) => c.completed).slice(0, 3)
    .forEach((c) => strong.push({ name: `${c.name} (${s.subject})`, reason: 'chapter completed' })));

  res.json({
    overall: {
      syllabusPercent: syllabus.percent,
      taskCompletionPercent: done + pending ? Math.round((done / (done + pending)) * 100) : 0,
      tasksCompleted: done,
      tasksPendingToDate: pending,
      averageMockPercent: avgMock,
      testsTaken: mock.length,
      totalHours: Math.round(progressDocs.reduce((n, d) => n + d.minutesStudied, 0) / 6) / 10,
      streak,
    },
    subjectProgress: syllabus.bySubject.map(({ chapters, ...s }) => s),
    chapterCompletion: syllabus.bySubject.map((s) => ({
      subject: s.subject,
      chapters: s.chapters.map((c) => ({ name: c.name, percent: Math.round((c.topicsDone / c.topics) * 100), completed: c.completed })),
    })),
    weeklyHours,
    daily,
    mockPerformance: mock,
    subjectAccuracy: insights.subjectAccuracy,
    strengths: strong.slice(0, 6),
    weaknesses: weak.slice(0, 6),
    chapterAccuracy: insights.chapterAccuracy,
  });
}

// GET /api/dashboard
async function getDashboard(req, res) {
  const userId = req.user._id;
  const profile = await getProfileOrFail(userId);
  const today = todayStr();

  const [syllabus, streak, todayTasks, upcoming, plan, recentTests, insights] = await Promise.all([
    computeSyllabusStats(userId, profile),
    computeStreak(userId),
    DailyTask.find({ user: userId, date: today }).sort({ createdAt: 1 }).lean(),
    DailyTask.find({ user: userId, status: 'pending', date: { $gt: today, $lte: addDays(today, 3) } }).sort({ date: 1, createdAt: 1 }).limit(8).lean(),
    StudyPlan.findOne({ user: userId, status: 'active' }).lean(),
    TestResult.find({ user: userId }).select('testTitle percentage score maxScore createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    testInsights(userId),
  ]);
  const missed = plan ? await DailyTask.countDocuments({ plan: plan._id, status: 'pending', date: { $lt: today } }) : 0;

  const weakTopics = [
    ...profile.weakChapters.map((c) => ({ subject: c.subject, chapter: c.chapter, source: 'self' })),
    ...insights.weakFromTests.map((c) => ({ subject: c.subject, chapter: c.chapter, source: 'tests' })),
  ].filter((v, i, arr) => arr.findIndex((x) => x.chapter === v.chapter) === i).slice(0, 6);

  res.json({
    name: req.user.name,
    profile: {
      exam: profile.exam, classLevel: profile.classLevel, level: profile.level,
      examDate: profile.examDate, hoursPerDay: profile.hoursPerDay,
    },
    daysLeft: profile.examDate ? daysBetween(today, profile.examDate) : null,
    today: {
      date: today,
      total: todayTasks.length,
      completed: todayTasks.filter((t) => t.status === 'completed').length,
      targetMinutes: todayTasks.reduce((n, t) => n + t.durationMinutes, 0),
      minutesStudied: todayTasks.filter((t) => t.status === 'completed').reduce((n, t) => n + (t.actualMinutes || 0), 0),
      tasks: todayTasks,
    },
    syllabus: {
      percent: syllabus.percent,
      bySubject: syllabus.bySubject.map(({ chapters, ...s }) => s),
    },
    streak,
    recentTests,
    weakTopics,
    upcoming,
    hasPlan: Boolean(plan),
    missedTasks: missed,
  });
}

module.exports = { getAnalytics, getDashboard };
