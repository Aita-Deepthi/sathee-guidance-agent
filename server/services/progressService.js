/*
 * Helpers that turn raw DailyTask documents into progress numbers.
 * Everything here is computed from real student data in MongoDB.
 */
const DailyTask = require('../models/DailyTask');
const Progress = require('../models/Progress');
const Syllabus = require('../models/Syllabus');
const { topicKey, chapterKey } = require('./planner');
const { todayStr, addDays } = require('../utils/date');

// Recalculate the Progress document for one day from that day's tasks
async function recomputeDay(userId, date) {
  const tasks = await DailyTask.find({ user: userId, date });
  const completed = tasks.filter((t) => t.status === 'completed');
  const update = {
    plannedTasks: tasks.length,
    completedTasks: completed.length,
    minutesStudied: completed.reduce((n, t) => n + (t.actualMinutes || 0), 0),
    questionsSolved: tasks.reduce((n, t) => n + (t.questionsDone || 0), 0),
  };
  return Progress.findOneAndUpdate({ user: userId, date }, { $set: update }, { upsert: true, new: true });
}

async function getSyllabus(exam, subjects) {
  const filter = { exam };
  if (subjects && subjects.length) filter.subject = { $in: subjects };
  return Syllabus.find(filter).lean();
}

// Set of "subject|chapter|topic" keys the student has finished
async function getDoneTopicKeys(userId) {
  const done = await DailyTask.find({ user: userId, type: 'study', status: 'completed' })
    .select('subject chapter topic part').lean();
  // A topic split into parts counts as done only when every part is completed
  const partsDone = {};
  done.forEach((t) => {
    const k = topicKey(t.subject, t.chapter, t.topic);
    partsDone[k] = partsDone[k] || new Set();
    partsDone[k].add(t.part || 'single');
  });
  const keys = new Set();
  for (const [k, parts] of Object.entries(partsDone)) {
    const sample = [...parts][0];
    const m = sample.match(/of (\d+)$/);
    const needed = m ? Number(m[1]) : 1;
    if (parts.size >= needed) keys.add(k);
  }
  return keys;
}

// After a study task completes, mark the chapter complete if all its topics are done
async function autoCompleteChapter(userId, profile, subject, chapter) {
  if (profile.completedChapters.some((c) => c.subject === subject && c.chapter === chapter)) return false;
  const entry = await Syllabus.findOne({ exam: profile.exam, subject }).lean();
  const ch = entry && entry.chapters.find((c) => c.name === chapter);
  if (!ch) return false;
  const doneKeys = await getDoneTopicKeys(userId);
  if (ch.topics.every((t) => doneKeys.has(topicKey(subject, chapter, t)))) {
    profile.completedChapters.push({ subject, chapter });
    await profile.save();
    return true;
  }
  return false;
}

// Syllabus completion overall and per subject
async function computeSyllabusStats(userId, profile) {
  const syllabus = await getSyllabus(profile.exam, profile.subjects);
  const doneKeys = await getDoneTopicKeys(userId);
  const doneChapters = new Set(profile.completedChapters.map((c) => chapterKey(c.subject, c.chapter)));

  const bySubject = syllabus.map((s) => {
    let totalTopics = 0, doneTopics = 0, completedChapters = 0;
    const chapters = s.chapters.map((ch) => {
      const chapterDone = doneChapters.has(chapterKey(s.subject, ch.name));
      const topicsDone = chapterDone ? ch.topics.length
        : ch.topics.filter((t) => doneKeys.has(topicKey(s.subject, ch.name, t))).length;
      totalTopics += ch.topics.length;
      doneTopics += topicsDone;
      if (chapterDone) completedChapters++;
      return { name: ch.name, classLevel: ch.classLevel, priority: ch.priority, topics: ch.topics.length, topicsDone, completed: chapterDone };
    });
    return {
      subject: s.subject,
      totalTopics, doneTopics,
      percent: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0,
      totalChapters: s.chapters.length,
      completedChapters,
      chapters,
    };
  });
  // Keep the subject order the student chose
  bySubject.sort((a, b) => profile.subjects.indexOf(a.subject) - profile.subjects.indexOf(b.subject));

  const total = bySubject.reduce((n, s) => n + s.totalTopics, 0);
  const done = bySubject.reduce((n, s) => n + s.doneTopics, 0);
  return { totalTopics: total, doneTopics: done, percent: total ? Math.round((done / total) * 100) : 0, bySubject };
}

// Consecutive days (ending today, or yesterday if today has nothing yet) with study activity
async function computeStreak(userId) {
  const days = await Progress.find({ user: userId, $or: [{ completedTasks: { $gt: 0 } }, { minutesStudied: { $gt: 0 } }] })
    .select('date').sort({ date: -1 }).limit(400).lean();
  const active = new Set(days.map((d) => d.date));
  let cursor = todayStr();
  if (!active.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return { current: streak, activeDays: active.size };
}

module.exports = { recomputeDay, getSyllabus, getDoneTopicKeys, autoCompleteChapter, computeSyllabusStats, computeStreak };
