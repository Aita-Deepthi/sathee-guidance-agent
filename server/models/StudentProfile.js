const mongoose = require('mongoose');
const { EXAMS, LEVELS, CLASSES } = require('../utils/constants');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    classLevel: { type: Number, enum: CLASSES, required: true },
    exam: { type: String, enum: EXAMS, required: true },
    level: { type: String, enum: LEVELS, required: true },
    examDate: { type: String, default: null }, // 'YYYY-MM-DD', entered by the student
    hoursPerDay: { type: Number, min: 1, max: 16, default: 6 },
    subjects: [{ type: String }],
    weakChapters: [{ subject: String, chapter: String }],
    // Chapters the student has finished (manually or by completing all its tasks)
    completedChapters: [
      { subject: String, chapter: String, completedAt: { type: Date, default: Date.now } },
    ],
    // YouTube videos the student pinned to a chapter (embedded on Resources page)
    savedVideos: [
      { subject: String, chapter: String, videoId: String, title: String, addedAt: { type: Date, default: Date.now } },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', profileSchema);
