// Verifies the JWT sent in the "Authorization: Bearer <token>" header
// and attaches the logged-in user to req.user.
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in. Please log in to continue.' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { protect };
