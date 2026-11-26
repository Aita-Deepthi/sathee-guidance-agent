// Date helpers. Dates for tasks/progress are stored as 'YYYY-MM-DD' strings
// in the app's timezone (default Asia/Kolkata) so "today" means the
// student's today, even when the server runs in UTC (e.g. on Render).
const env = require('../config/env');

function todayStr() {
  return toDateStr(new Date());
}

function toDateStr(date) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: env.APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Add days to a 'YYYY-MM-DD' string (pure calendar math in UTC, no TZ drift)
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromStr, toStr) {
  const a = new Date(fromStr + 'T00:00:00Z');
  const b = new Date(toStr + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

function isValidDateStr(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

// Monday-based week start for a date string
function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(dateStr, -day);
}

module.exports = { todayStr, toDateStr, addDays, daysBetween, isValidDateStr, weekStart };
