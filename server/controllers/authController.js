const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');
const { required, validateEmail, validatePassword, validateProfileFields } = require('../utils/validate');
const { EXAM_SUBJECTS } = require('../utils/constants');

function signToken(user) {
  return jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function publicUser(user, profile) {
  return { id: user._id, name: user.name, email: user.email, profile };
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;
  required(name, 'Full name');
  required(email, 'Email');
  required(password, 'Password');
  const normalizedEmail = validateEmail(email);
  validatePassword(password);
  const profileFields = validateProfileFields(req.body);

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError('This email is already registered. Please log in.', 409);

  const user = await User.create({ name, email: normalizedEmail, password });
  let profile;
  try {
    profile = await StudentProfile.create({
      user: user._id,
      ...profileFields,
      subjects: EXAM_SUBJECTS[profileFields.exam],
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // keep data consistent
    throw err;
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user, profile) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  required(email, 'Email');
  required(password, 'Password');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }
  const profile = await StudentProfile.findOne({ user: user._id });
  res.json({ token: signToken(user), user: publicUser(user, profile) });
}

// GET /api/auth/me
async function me(req, res) {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  res.json({ user: publicUser(req.user, profile) });
}

module.exports = { register, login, me };
