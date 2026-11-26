const StudyPlan = require('../models/StudyPlan');
const DailyTask = require('../models/DailyTask');
const AppError = require('../utils/AppError');
const { getProfileOrFail } = require('./profileController');
const { buildSchedule, topicKey } = require('../services/planner');
const { getSyllabus, getDoneTopicKeys, recomputeDay } = require('../services/progressService');
const gemini = require('../services/gemini');
const { validateProfileFields, cleanSubjects, cleanChapterList } = require('../utils/validate');
const { todayStr, isValidDateStr, daysBetween, addDays } = require('../utils/date');

// Rule-based strategy text (used when Gemini is not available)
function ruleBasedStrategy(profile, summary) {
  const weeks = Math.round(summary.totalDays / 7);
  const lines = [
    `You have about ${weeks} weeks until ${profile.exam}. Your plan covers ${summary.topicsScheduled} topics over ${summary.studyDays} study days, with weekly revision and ${summary.mockTests} full mock tests.`,
    profile.level === 'Beginner'
      ? 'As a beginner, read NCERT carefully before solving questions, and do not skip the daily revision block.'
      : profile.level === 'Advanced'
        ? 'At an advanced level, push for timed problem-solving and analyse every mock test in detail.'
        : 'Balance concept study with daily practice, and increase question difficulty gradually.',
    profile.weakChapters.length
      ? `Weak chapters (${profile.weakChapters.map((w) => w.chapter).join(', ')}) are scheduled early and given extra time.`
      : 'Mark weak chapters in the planner so they get extra time and earlier slots.',
    summary.compressed
      ? `Time is tight, so topic durations were compressed${summary.topicsSkipped ? ` and ${summary.topicsSkipped} low-priority topics were left out — cover them if you get spare time` : ''}.`
      : 'Your schedule has enough time for the full syllabus — stay consistent every day.',
    'The last days before the exam are reserved for full mock tests and revision.',
  ];
  return lines.join('\n\n');
}

async function makeStrategy(profile, summary) {
  if (!gemini.isConfigured()) return { text: ruleBasedStrategy(profile, summary), source: 'rule-based' };
  try {
    const text = await gemini.generateReply({
      systemPrompt: 'You are a concise, encouraging study mentor for Indian JEE/NEET aspirants. Never invent official exam dates or syllabus changes.',
      message: `Write a short personalised preparation strategy (5 bullet points, under 150 words, plain text bullets using "•") for this student.
Exam: ${profile.exam}, Class ${profile.classLevel}, level ${profile.level}, ${profile.hoursPerDay} hours/day, ${summary.totalDays} days left.
Weak chapters: ${profile.weakChapters.map((w) => w.chapter).join(', ') || 'none'}.
The app's planner already scheduled ${summary.topicsScheduled} topics, weekly revision days and ${summary.mockTests} mock tests${summary.compressed ? '; time is tight so some low-priority topics were dropped' : ''}.`,
      timeoutMs: 20000,
    });
    return { text, source: 'ai' };
  } catch (err) {
    return { text: ruleBasedStrategy(profile, summary), source: 'rule-based' };
  }
}

// Shared by generate and rebalance
async function createPlan(userId, profile, { keepProgress }) {
  if (!profile.examDate) throw new AppError('Please set your exam date first', 400);
  const today = todayStr();

  // If the student already completed something today, keep today's tasks as they
  // are and start the new schedule tomorrow (so today's work isn't duplicated).
  const todaysTasks = await DailyTask.find({ user: userId, date: today }).lean();
  const keepToday = todaysTasks.some((t) => t.status === 'completed');
  const start = keepToday ? addDays(today, 1) : today;

  const syllabus = await getSyllabus(profile.exam, profile.subjects);
  const doneTopicKeys = keepProgress ? await getDoneTopicKeys(userId) : new Set();
  if (keepToday) {
    todaysTasks.filter((t) => t.type === 'study').forEach((t) => doneTopicKeys.add(topicKey(t.subject, t.chapter, t.topic)));
  }

  const { tasks, summary } = buildSchedule({
    exam: profile.exam,
    examDate: profile.examDate,
    startDate: start,
    hoursPerDay: profile.hoursPerDay,
    level: profile.level,
    classLevel: profile.classLevel,
    subjects: profile.subjects,
    syllabus,
    weakChapters: profile.weakChapters,
    completedChapters: profile.completedChapters,
    doneTopicKeys,
  });

  // Archive the old plan: delete its future pending tasks, keep history (completed + past)
  const old = await StudyPlan.find({ user: userId, status: 'active' });
  for (const p of old) {
    await DailyTask.deleteMany({ plan: p._id, status: 'pending', date: { $gte: start } });
    p.status = 'archived';
    await p.save();
  }

  const strategy = await makeStrategy(profile, summary);
  const plan = await StudyPlan.create({
    user: userId,
    exam: profile.exam,
    startDate: start,
    examDate: profile.examDate,
    hoursPerDay: profile.hoursPerDay,
    level: profile.level,
    subjects: profile.subjects,
    weakChapters: profile.weakChapters,
    summary,
    strategy,
  });
  if (keepToday && old.length) {
    // Today's kept tasks now belong to the new plan
    await DailyTask.updateMany({ user: userId, date: today }, { plan: plan._id });
  }
  await DailyTask.insertMany(tasks.map((t) => ({ ...t, user: userId, plan: plan._id })));
  await recomputeDay(userId, today);
  return plan;
}

// POST /api/plan/generate
// Body: { exam, examDate, classLevel, level, hoursPerDay, subjects, completedChapters, weakChapters }
async function generatePlan(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const body = req.body || {};

  const fields = validateProfileFields(body, { partial: true });
  if (body.examDate !== undefined && !isValidDateStr(body.examDate)) throw new AppError('Exam date is required', 400);
  Object.assign(profile, fields);
  if (fields.exam) profile.subjects = cleanSubjects(body.subjects, profile.exam);
  else if (body.subjects !== undefined) profile.subjects = cleanSubjects(body.subjects, profile.exam);
  if (body.weakChapters !== undefined) profile.weakChapters = cleanChapterList(body.weakChapters, profile.subjects);
  if (body.completedChapters !== undefined) {
    profile.completedChapters = cleanChapterList(body.completedChapters, profile.subjects);
  }
  await profile.save();

  const plan = await createPlan(req.user._id, profile, { keepProgress: true });
  res.status(201).json({ message: 'Study plan generated', plan });
}

// POST /api/plan/rebalance — reschedules missed and remaining topics from today
async function rebalancePlan(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const active = await StudyPlan.findOne({ user: req.user._id, status: 'active' });
  if (!active) throw new AppError('No active plan to adjust. Generate a plan first.', 404);
  const plan = await createPlan(req.user._id, profile, { keepProgress: true });
  res.json({ message: 'Plan adjusted around your progress and missed tasks', plan });
}

// GET /api/plan — the active plan with counts
async function getPlan(req, res) {
  const plan = await StudyPlan.findOne({ user: req.user._id, status: 'active' }).lean();
  if (!plan) return res.json({ plan: null });
  const today = todayStr();
  const [total, completed, missed] = await Promise.all([
    DailyTask.countDocuments({ plan: plan._id }),
    DailyTask.countDocuments({ plan: plan._id, status: 'completed' }),
    DailyTask.countDocuments({ plan: plan._id, status: 'pending', date: { $lt: today } }),
  ]);
  res.json({
    plan,
    stats: { total, completed, missed, daysLeft: daysBetween(today, plan.examDate) },
  });
}

// GET /api/plan/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD  (max 62 days per request)
async function getPlanTasks(req, res) {
  const plan = await StudyPlan.findOne({ user: req.user._id, status: 'active' }).lean();
  if (!plan) return res.json({ days: [] });
  const from = isValidDateStr(req.query.from) ? req.query.from : todayStr();
  let to = isValidDateStr(req.query.to) ? req.query.to : null;
  if (!to || daysBetween(from, to) > 62 || daysBetween(from, to) < 0) {
    const d = new Date(from + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 13);
    to = d.toISOString().slice(0, 10);
  }
  const tasks = await DailyTask.find({ user: req.user._id, plan: plan._id, date: { $gte: from, $lte: to } })
    .sort({ date: 1, createdAt: 1 }).lean();
  const days = [];
  for (const t of tasks) {
    let day = days[days.length - 1];
    if (!day || day.date !== t.date) { day = { date: t.date, tasks: [] }; days.push(day); }
    day.tasks.push(t);
  }
  res.json({ from, to, days, planStart: plan.startDate, examDate: plan.examDate });
}

module.exports = { generatePlan, rebalancePlan, getPlan, getPlanTasks, ruleBasedStrategy };
