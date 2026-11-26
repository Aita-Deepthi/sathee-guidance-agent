// Central place for reading environment variables with sensible defaults.
// Use the server-local file explicitly so starting from the repository root
// still loads server/.env. Process environment variables remain authoritative.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed frontend origins (e.g. your Vercel URL)
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Kolkata',
};

if (!env.JWT_SECRET) {
  if (env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  env.JWT_SECRET = 'dev-only-secret-change-me';
  console.warn('WARNING: JWT_SECRET not set — using an insecure development secret.');
}

module.exports = env;
