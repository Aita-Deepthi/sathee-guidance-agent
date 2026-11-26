// One document per student per day: an aggregate of what was actually done.
// Recomputed from DailyTask whenever a task changes, so it is always consistent.
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    plannedTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    minutesStudied: { type: Number, default: 0 },
    questionsSolved: { type: Number, default: 0 },
    note: { type: String, default: '', maxlength: 2000 }, // daily journal note
  },
  { timestamps: true }
);
progressSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
