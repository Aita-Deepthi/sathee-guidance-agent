const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
    testType: { type: String, enum: ['full', 'topic'], default: 'full' },
    testTitle: String,
    exam: String,
    subject: String,
    chapter: String,
    difficulty: String,
    score: Number,
    maxScore: Number,
    correct: Number,
    incorrect: Number,
    unanswered: Number,
    total: Number,
    percentage: Number, // accuracy-based score percentage (score / maxScore)
    timeTakenSeconds: Number,
    answers: [Number], // chosen option index per question, -1 = unanswered
    subjectBreakdown: [{ subject: String, correct: Number, total: Number }],
    chapterBreakdown: [{ subject: String, chapter: String, correct: Number, total: Number, accuracy: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestResult', testResultSchema);
