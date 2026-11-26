const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: {
    type: [String],
    validate: [(v) => v.length === 4, 'Each question needs exactly 4 options'],
  },
  answerIndex: { type: Number, min: 0, max: 3, required: true },
  explanation: String,
  subject: String,
  chapter: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
});

const mockTestSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  testType: { type: String, enum: ['full', 'topic'], default: 'full' },
  title: { type: String, required: true },
  exam: { type: String, required: true },
  subject: { type: String, default: 'Mixed' },
  durationMinutes: { type: Number, required: true },
  marking: { correct: { type: Number, default: 4 }, incorrect: { type: Number, default: -1 } },
  questions: [questionSchema],
  topic: {
    subject: String,
    chapter: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'] },
  },
});

module.exports = mongoose.model('MockTest', mockTestSchema);
