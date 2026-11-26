// Small validation helpers used by the controllers (no extra library needed).
const AppError = require('./AppError');
const { EXAMS, LEVELS, CLASSES, EXAM_SUBJECTS } = require('./constants');
const { isValidDateStr, todayStr } = require('./date');

function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new AppError(`${field} is required`, 400);
  }
}

function validateEmail(value) {
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please enter a valid email address', 400);
  }
  return email;
}

function validatePassword(value, field = 'Password') {
  const password = String(value);
  const missing = [];
  if (password.length < 8) missing.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) missing.push('one uppercase letter');
  if (!/[a-z]/.test(password)) missing.push('one lowercase letter');
  if (!/\d/.test(password)) missing.push('one numeric digit');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('one special character');
  if (missing.length) throw new AppError(`${field} must contain ${missing.join(', ')}`, 400);
}

function oneOf(value, list, field) {
  if (!list.includes(value)) throw new AppError(`${field} must be one of: ${list.join(', ')}`, 400);
}

function validateProfileFields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.classLevel !== undefined) {
    const c = Number(body.classLevel);
    oneOf(c, CLASSES, 'Class');
    out.classLevel = c;
  }
  if (!partial || body.exam !== undefined) {
    oneOf(body.exam, EXAMS, 'Examination');
    out.exam = body.exam;
  }
  if (!partial || body.level !== undefined) {
    oneOf(body.level, LEVELS, 'Preparation level');
    out.level = body.level;
  }
  if (body.examDate !== undefined && body.examDate !== null && body.examDate !== '') {
    if (!isValidDateStr(body.examDate)) throw new AppError('Exam date must be a valid date (YYYY-MM-DD)', 400);
    if (body.examDate <= todayStr()) throw new AppError('Exam date must be in the future', 400);
    out.examDate = body.examDate;
  } else if (body.examDate === '' || body.examDate === null) {
    out.examDate = null;
  }
  if (body.hoursPerDay !== undefined) {
    const h = Number(body.hoursPerDay);
    if (!(h >= 1 && h <= 16)) throw new AppError('Study hours per day must be between 1 and 16', 400);
    out.hoursPerDay = h;
  }
  return out;
}

// Keep only subjects valid for the exam (defaults to all exam subjects)
function cleanSubjects(subjects, exam) {
  const allowed = EXAM_SUBJECTS[exam];
  if (!Array.isArray(subjects) || subjects.length === 0) return [...allowed];
  const valid = allowed.filter((s) => subjects.includes(s));
  if (valid.length === 0) throw new AppError(`Choose at least one subject from: ${allowed.join(', ')}`, 400);
  return valid;
}

function cleanChapterList(list, subjects) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && typeof c.subject === 'string' && typeof c.chapter === 'string' && subjects.includes(c.subject))
    .map((c) => ({ subject: c.subject, chapter: c.chapter.slice(0, 200) }));
}

module.exports = { required, validateEmail, validatePassword, oneOf, validateProfileFields, cleanSubjects, cleanChapterList };
