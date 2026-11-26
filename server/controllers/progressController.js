const DailyTask = require('../models/DailyTask');
const Progress = require('../models/Progress');
const AppError = require('../utils/AppError');
const { getProfileOrFail } = require('./profileController');
const { recomputeDay, autoCompleteChapter, computeSyllabusStats, computeStreak } = require('../services/progressService');
const { todayStr, addDays, isValidDateStr } = require('../utils/date');

// GET /api/progress/day?date=YYYY-MM-DD (defaults to today)
async function getDay(req, res) {
  const date = isValidDateStr(req.query.date) ? req.query.date : todayStr();
  const tasks = await DailyTask.find({ user: req.user._id, date }).sort({ createdAt: 1 }).lean();
  const progress = await Progress.findOne({ user: req.user._id, date }).lean();
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const targetMinutes = tasks.reduce((n, t) => n + t.durationMinutes, 0);
  res.json({
    date,
    tasks,
    note: progress ? progress.note : '',
    summary: {
      total: tasks.length,
      completed,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      targetMinutes,
      minutesStudied: progress ? progress.minutesStudied : 0,
      targetQuestions: tasks.reduce((n, t) => n + (t.practiceTarget || 0), 0),
      questionsSolved: progress ? progress.questionsSolved : 0,
    },
  });
}

// PATCH /api/tasks/:id  { status, actualMinutes, questionsDone, notes }
async function updateTask(req, res) {
  const task = await DailyTask.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new AppError('Task not found', 404);
  const { status, actualMinutes, questionsDone, notes } = req.body;

  if (actualMinutes !== undefined) {
    const m = Number(actualMinutes);
    if (!(m >= 0 && m <= 960)) throw new AppError('Study time must be between 0 and 960 minutes', 400);
    task.actualMinutes = Math.round(m);
  }
  if (questionsDone !== undefined) {
    const q = Number(questionsDone);
    if (!(q >= 0 && q <= 1000)) throw new AppError('Questions must be between 0 and 1000', 400);
    task.questionsDone = Math.round(q);
  }
  if (notes !== undefined) task.notes = String(notes).slice(0, 2000);

  let chapterCompleted = false;
  if (status !== undefined) {
    if (!['pending', 'completed'].includes(status)) throw new AppError('Status must be pending or completed', 400);
    if (status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
      // If no study time was recorded, assume the planned duration
      if (!task.actualMinutes) task.actualMinutes = task.durationMinutes;
    }
    if (status === 'pending') task.completedAt = undefined;
    task.status = status;
  }
  await task.save();

  const progress = await recomputeDay(req.user._id, task.date);
  if (task.type === 'study' && task.status === 'completed') {
    const profile = await getProfileOrFail(req.user._id);
    chapterCompleted = await autoCompleteChapter(req.user._id, profile, task.subject, task.chapter);
  }
  res.json({ task, progress, chapterCompleted });
}

// PUT /api/progress/note  { date, note }
async function saveNote(req, res) {
  const date = isValidDateStr(req.body.date) ? req.body.date : todayStr();
  const note = String(req.body.note || '').slice(0, 2000);
  const doc = await Progress.findOneAndUpdate({ user: req.user._id, date }, { $set: { note } }, { upsert: true, new: true });
  res.json({ message: 'Note saved', progress: doc });
}

function sumRange(docs, from, to) {
  const inRange = docs.filter((d) => d.date >= from && d.date <= to);
  const planned = inRange.reduce((n, d) => n + d.plannedTasks, 0);
  const completed = inRange.reduce((n, d) => n + d.completedTasks, 0);
  return {
    plannedTasks: planned,
    completedTasks: completed,
    percent: planned ? Math.round((completed / planned) * 100) : 0,
    minutes: inRange.reduce((n, d) => n + d.minutesStudied, 0),
    questions: inRange.reduce((n, d) => n + d.questionsSolved, 0),
    activeDays: inRange.filter((d) => d.completedTasks > 0).length,
  };
}

// GET /api/progress/summary
async function getSummary(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const today = todayStr();
  const docs = await Progress.find({ user: req.user._id, date: { $gte: addDays(today, -60), $lte: today } }).lean();
  const all = await Progress.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: null, minutes: { $sum: '$minutesStudied' }, questions: { $sum: '$questionsSolved' }, tasks: { $sum: '$completedTasks' } } },
  ]);
  const [syllabus, streak] = await Promise.all([computeSyllabusStats(req.user._id, profile), computeStreak(req.user._id)]);

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const date = addDays(today, -i);
    const d = docs.find((x) => x.date === date);
    last14.push({ date, minutes: d ? d.minutesStudied : 0, completed: d ? d.completedTasks : 0, planned: d ? d.plannedTasks : 0 });
  }

  res.json({
    today: sumRange(docs, today, today),
    week: sumRange(docs, addDays(today, -6), today),
    month: sumRange(docs, addDays(today, -29), today),
    totals: {
      hours: Math.round(((all[0] && all[0].minutes) || 0) / 6) / 10,
      questions: (all[0] && all[0].questions) || 0,
      tasksCompleted: (all[0] && all[0].tasks) || 0,
    },
    streak,
    syllabus: {
      percent: syllabus.percent,
      doneTopics: syllabus.doneTopics,
      totalTopics: syllabus.totalTopics,
      bySubject: syllabus.bySubject,
    },
    last14,
  });
}

module.exports = { getDay, updateTask, saveNote, getSummary };
