const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    type: { type: String, enum: ['study', 'revision', 'practice-test', 'mock-test'], default: 'study' },
    subject: { type: String, required: true },
    chapter: { type: String, default: '' },
    topic: { type: String, default: '' },
    part: { type: String, default: '' }, // e.g. 'Part 1 of 2' when a topic spans days
    objectives: [String],
    durationMinutes: { type: Number, required: true },
    practiceTarget: { type: Number, default: 0 },
    revisionActivity: { type: String, default: '' },
    video: { title: String, url: String, kind: { type: String, enum: ['search', 'video'] } },
    // Progress fields filled in by the student
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    actualMinutes: { type: Number, default: 0, min: 0 },
    questionsDone: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '', maxlength: 2000 },
    completedAt: Date,
  },
  { timestamps: true }
);
dailyTaskSchema.index({ user: 1, date: 1 });
dailyTaskSchema.index({ plan: 1, status: 1 });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
