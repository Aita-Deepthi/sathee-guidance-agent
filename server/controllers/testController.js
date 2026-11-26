const MockTest = require('../models/MockTest');
const TestResult = require('../models/TestResult');
const Syllabus = require('../models/Syllabus');
const AppError = require('../utils/AppError');
const { getProfileOrFail } = require('./profileController');
const { EXAMS, EXAM_SUBJECTS } = require('../utils/constants');

const MARKING_SCHEMES = {
  'JEE Main': { correct: 4, incorrect: -1 },
  'JEE Advanced': { correct: 3, incorrect: -1 },
  NEET: { correct: 4, incorrect: -1 },
};
const TOPIC_QUESTION_COUNTS = [1, 2, 5, 10, 20, 30];
const TOPIC_DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];

function assertTopicValue(value, allowed, label) {
  if (!allowed.includes(value)) throw new AppError(`Unsupported ${label}`, 400);
}

// GET /api/tests?exam=all  (defaults to the student's exam)
async function listTests(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const filter = req.query.exam === 'all' ? {} : { exam: req.query.exam || profile.exam };
  const tests = await MockTest.find({ ...filter, $or: [{ testType: 'full' }, { testType: { $exists: false } }] }).lean();
  const attempts = await TestResult.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$test', attempts: { $sum: 1 }, best: { $max: '$percentage' } } },
  ]);
  res.json({
    tests: tests.map((t) => {
      const a = attempts.find((x) => String(x._id) === String(t._id));
      return {
        _id: t._id, title: t.title, exam: t.exam, subject: t.subject, testType: t.testType || 'full',
        topic: t.topic || null,
        durationMinutes: t.durationMinutes, marking: t.marking,
        questionCount: t.questions.length,
        attempts: a ? a.attempts : 0, bestPercentage: a ? a.best : null,
      };
    }),
  });
}

// GET /api/tests/topics/options?exam=JEE%20Main&subject=Physics
async function topicOptions(req, res) {
  const exam = req.query.exam || 'JEE Main';
  assertTopicValue(exam, EXAMS, 'examination');
  const subjects = EXAM_SUBJECTS[exam];
  const subject = req.query.subject || subjects[0];
  assertTopicValue(subject, subjects, 'subject');
  const syllabus = await Syllabus.findOne({ exam, subject }).select('chapters.name').lean();
  if (!syllabus) throw new AppError('Syllabus not found for the selected subject', 404);
  const tests = await MockTest.find({ exam, $or: [{ testType: 'full' }, { testType: { $exists: false } }] }).select('questions').lean();
  const questionsByChapter = {};
  tests.flatMap((test) => test.questions).forEach((question) => {
    if (question.subject !== subject) return;
    questionsByChapter[question.chapter] = questionsByChapter[question.chapter] || new Map();
    if (!questionsByChapter[question.chapter].has(question.text)) {
      questionsByChapter[question.chapter].set(question.text, question.difficulty || 'Mixed');
    }
  });
  const getCounts = (chapter) => {
    const difficulties = { Easy: 0, Medium: 0, Hard: 0, Mixed: 0 };
    for (const difficulty of chapter.values()) {
      if (difficulty === 'Mixed') difficulties.Mixed++;
      else {
        difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
        difficulties.Mixed++;
      }
    }
    return difficulties;
  };
  const validCounts = (available) => TOPIC_QUESTION_COUNTS.filter((count) => count <= available);
  res.json({
    exams: EXAMS,
    subjects,
    exam,
    subject,
    chapters: syllabus.chapters.map((chapter) => {
      const chapterQuestions = questionsByChapter[chapter.name] || new Map();
      const availableQuestions = chapterQuestions.size;
      return {
        name: chapter.name,
        availableQuestions,
        difficultyCounts: getCounts(chapterQuestions),
        questionCounts: validCounts(availableQuestions),
      };
    }),
    questionCounts: TOPIC_QUESTION_COUNTS,
    difficulties: TOPIC_DIFFICULTIES,
  });
}

// POST /api/tests/topics { exam, subject, chapter, questionCount, difficulty }
async function createTopicTest(req, res) {
  const { exam, subject, chapter, difficulty = 'Mixed' } = req.body;
  const questionCount = Number(req.body.questionCount);
  assertTopicValue(exam, EXAMS, 'examination');
  assertTopicValue(subject, EXAM_SUBJECTS[exam], 'subject');
  assertTopicValue(difficulty, TOPIC_DIFFICULTIES, 'difficulty');
  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) {
    throw new AppError('Question count must be a whole number between 1 and 30', 400);
  }
  if (!chapter || typeof chapter !== 'string') throw new AppError('Chapter is required', 400);

  const syllabus = await Syllabus.findOne({ exam, subject, 'chapters.name': chapter }).select('_id').lean();
  if (!syllabus) throw new AppError('Chapter is not part of the selected syllabus', 400);
  const tests = await MockTest.find({ exam, $or: [{ testType: 'full' }, { testType: { $exists: false } }] }).select('questions').lean();
  const unique = new Map();
  tests.flatMap((test) => test.questions).forEach((question) => {
    if (question.subject === subject && question.chapter === chapter && !unique.has(question.text)) unique.set(question.text, question);
  });
  let candidates = [...unique.values()];
  if (difficulty !== 'Mixed') candidates = candidates.filter((question) => question.difficulty === difficulty);
  if (candidates.length < questionCount) {
    throw new AppError(`Only ${candidates.length} unique ${difficulty.toLowerCase()} question(s) are available for this chapter; add more questions before requesting ${questionCount}.`, 422);
  }
  candidates = candidates.sort(() => Math.random() - 0.5).slice(0, questionCount);
  const marking = MARKING_SCHEMES[exam];
  const test = await MockTest.create({
    owner: req.user._id,
    testType: 'topic',
    title: `${chapter} · ${subject} practice`,
    exam,
    subject,
    durationMinutes: Math.max(10, Math.ceil(questionCount * 1.5)),
    marking,
    topic: { subject, chapter, difficulty },
    questions: candidates.map((question) => {
      const plain = typeof question.toObject === 'function' ? question.toObject() : question;
      return { ...plain, difficulty: plain.difficulty || 'Mixed' };
    }),
  });
  res.status(201).json({ test: { _id: test._id, title: test.title, questionCount, durationMinutes: test.durationMinutes, marking, topic: test.topic } });
}

// GET /api/tests/:id — questions WITHOUT answers
async function getTest(req, res) {
  const test = await MockTest.findOne({ _id: req.params.id, $or: [{ owner: null }, { owner: { $exists: false } }, { owner: req.user._id }] }).lean();
  if (!test) throw new AppError('Test not found', 404);
  res.json({
    test: {
      _id: test._id, title: test.title, exam: test.exam, subject: test.subject, testType: test.testType || 'full',
      topic: test.topic || null,
      durationMinutes: test.durationMinutes, marking: test.marking,
      questions: test.questions.map((q) => ({ _id: q._id, text: q.text, options: q.options, subject: q.subject })),
    },
  });
}

// POST /api/tests/:id/submit  { answers: [index | -1], timeTakenSeconds }
async function submitTest(req, res) {
  const test = await MockTest.findOne({ _id: req.params.id, $or: [{ owner: null }, { owner: { $exists: false } }, { owner: req.user._id }] }).lean();
  if (!test) throw new AppError('Test not found', 404);
  const raw = Array.isArray(req.body.answers) ? req.body.answers : [];
  const answers = test.questions.map((_, i) => {
    const a = Number(raw[i]);
    return Number.isInteger(a) && a >= 0 && a <= 3 ? a : -1;
  });

  let correct = 0, incorrect = 0;
  const bySubject = {};
  const byChapter = {};
  const review = test.questions.map((q, i) => {
    const s = (bySubject[q.subject] = bySubject[q.subject] || { subject: q.subject, correct: 0, total: 0 });
    const chapter = (byChapter[`${q.subject}|${q.chapter}`] = byChapter[`${q.subject}|${q.chapter}`] || { subject: q.subject, chapter: q.chapter, correct: 0, total: 0 });
    s.total++;
    chapter.total++;
    const isCorrect = answers[i] === q.answerIndex;
    if (answers[i] === -1) { /* unanswered */     } else if (isCorrect) { correct++; s.correct++; chapter.correct++; } else incorrect++;
    return { text: q.text, options: q.options, chosen: answers[i], answerIndex: q.answerIndex, correct: isCorrect, explanation: q.explanation, subject: q.subject, chapter: q.chapter };
  });

  const total = test.questions.length;
  const maxScore = total * test.marking.correct;
  const score = correct * test.marking.correct + incorrect * test.marking.incorrect;
  const result = await TestResult.create({
    user: req.user._id,
    test: test._id,
    testType: test.testType || 'full',
    testTitle: test.title,
    exam: test.exam,
    subject: test.subject,
    chapter: test.topic?.chapter,
    difficulty: test.topic?.difficulty,
    score, maxScore, correct, incorrect,
    unanswered: total - correct - incorrect,
    total,
    percentage: Math.max(0, Math.round((score / maxScore) * 1000) / 10),
    timeTakenSeconds: Math.max(0, Math.min(Number(req.body.timeTakenSeconds) || 0, test.durationMinutes * 60 + 60)),
    answers,
    subjectBreakdown: Object.values(bySubject),
    chapterBreakdown: Object.values(byChapter).map((entry) => ({ ...entry, accuracy: entry.total ? Math.round((entry.correct / entry.total) * 100) : 0 })),
  });
  res.status(201).json({ result, review });
}

// GET /api/tests/results/me
async function myResults(req, res) {
  const results = await TestResult.find({ user: req.user._id }).select('-answers').sort({ createdAt: -1 }).limit(50).lean();
  res.json({ results });
}

// GET /api/tests/results/:id — a past result with full review
async function getResult(req, res) {
  const result = await TestResult.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!result) throw new AppError('Result not found', 404);
  const test = await MockTest.findById(result.test).lean();
  const review = test
    ? test.questions.map((q, i) => ({ text: q.text, options: q.options, chosen: result.answers[i], answerIndex: q.answerIndex, correct: result.answers[i] === q.answerIndex, explanation: q.explanation, subject: q.subject }))
    : [];
  res.json({ result, review });
}

module.exports = { listTests, topicOptions, createTopicTest, getTest, submitTest, myResults, getResult };
