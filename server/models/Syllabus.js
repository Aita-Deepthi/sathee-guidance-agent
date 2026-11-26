const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    classLevel: { type: Number, enum: [11, 12] },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    estHours: { type: Number, required: true }, // base study hours for an intermediate student
    topics: [{ type: String }],
  },
  { _id: false }
);

const syllabusSchema = new mongoose.Schema({
  exam: { type: String, required: true },
  subject: { type: String, required: true },
  chapters: [chapterSchema],
});
syllabusSchema.index({ exam: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
