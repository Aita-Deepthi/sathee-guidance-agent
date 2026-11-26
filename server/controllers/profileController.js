const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Syllabus = require('../models/Syllabus');
const AppError = require('../utils/AppError');
const { validateProfileFields, cleanSubjects, cleanChapterList } = require('../utils/validate');
const { EXAM_SUBJECTS } = require('../utils/constants');

async function getProfileOrFail(userId) {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) throw new AppError('Student profile not found', 404);
  return profile;
}

// GET /api/profile
async function getProfile(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  res.json({ name: req.user.name, email: req.user.email, profile });
}

// PUT /api/profile
async function updateProfile(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const fields = validateProfileFields(req.body, { partial: true });
  const examChanged = fields.exam && fields.exam !== profile.exam;
  Object.assign(profile, fields);

  if (examChanged) {
    profile.subjects = EXAM_SUBJECTS[profile.exam];
    // Chapters/weak lists belong to the old exam's subjects; keep only ones still valid
    profile.weakChapters = cleanChapterList(profile.weakChapters, profile.subjects);
  }
  if (req.body.subjects !== undefined) profile.subjects = cleanSubjects(req.body.subjects, profile.exam);
  if (req.body.weakChapters !== undefined) profile.weakChapters = cleanChapterList(req.body.weakChapters, profile.subjects);

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) throw new AppError('Name cannot be empty', 400);
    await User.updateOne({ _id: req.user._id }, { name });
    req.user.name = name;
  }
  await profile.save();
  res.json({ message: 'Profile updated', name: req.user.name, email: req.user.email, profile, examChanged });
}

// PUT /api/profile/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) throw new AppError('New password must be at least 6 characters', 400);
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword || ''))) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed' });
}

// POST /api/profile/chapters  { subject, chapter, completed: true|false }
async function setChapterCompletion(req, res) {
  const { subject, chapter, completed } = req.body;
  const profile = await getProfileOrFail(req.user._id);
  const entry = await Syllabus.findOne({ exam: profile.exam, subject }).lean();
  if (!entry || !entry.chapters.some((c) => c.name === chapter)) throw new AppError('Chapter not found in your syllabus', 404);

  profile.completedChapters = profile.completedChapters.filter((c) => !(c.subject === subject && c.chapter === chapter));
  if (completed) profile.completedChapters.push({ subject, chapter });
  await profile.save();
  res.json({ message: completed ? 'Chapter marked complete' : 'Chapter marked pending', completedChapters: profile.completedChapters });
}

// GET /api/syllabus?exam=JEE%20Main  (defaults to the student's exam)
async function getSyllabus(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const exam = req.query.exam || profile.exam;
  const data = await Syllabus.find({ exam }).lean();
  const order = EXAM_SUBJECTS[exam] || [];
  data.sort((a, b) => order.indexOf(a.subject) - order.indexOf(b.subject));
  res.json({ exam, subjects: data.map((s) => ({ subject: s.subject, chapters: s.chapters })) });
}

module.exports = { getProfile, updateProfile, changePassword, setChapterCompletion, getSyllabus, getProfileOrFail };
