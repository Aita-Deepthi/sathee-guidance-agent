const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exam: { type: String, required: true },
    startDate: { type: String, required: true },
    examDate: { type: String, required: true },
    hoursPerDay: { type: Number, required: true },
    level: { type: String, required: true },
    subjects: [String],
    weakChapters: [{ subject: String, chapter: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    summary: {
      totalDays: Number,
      studyDays: Number,
      finalRevisionDays: Number,
      totalTasks: Number,
      topicsScheduled: Number,
      compressed: Boolean, // true when the syllabus had to be squeezed to fit
      topicsSkipped: Number, // low-priority topics left out when time is too short
      mockTests: Number,
    },
    strategy: { text: String, source: { type: String, enum: ['ai', 'rule-based'] } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
