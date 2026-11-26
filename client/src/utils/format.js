export const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET'];
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const EXAM_SUBJECTS = {
  'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  NEET: ['Physics', 'Chemistry', 'Biology'],
};

// Mirrors --subject-* tokens in styles/tokens.css (hex kept here for SVG charts)
export const SUBJECT_COLORS = {
  Physics: '#3d63d6',
  Chemistry: '#0c8f80',
  Mathematics: '#b55a12',
  Biology: '#a8741a',
  Mixed: '#667085',
};

// Shared Recharts styling so every chart reads as one system
export const CHART = {
  grid: '#eef0f3',
  axis: { fontSize: 12, fill: '#667085' },
  primary: '#2c50c4',
  secondary: '#c2cff6',
  track: '#eef0f3',
  success: '#0f7a55',
  tooltip: {
    contentStyle: { borderRadius: 8, border: '1px solid #e6e9ed', boxShadow: '0 6px 16px -4px rgba(16,24,40,.12)', fontSize: 12, padding: '8px 10px' },
    labelStyle: { color: '#101828', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: '#344054', padding: 0 },
    cursor: { fill: 'rgba(44,80,196,.06)' },
  },
};

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const a = new Date(todayISO() + 'T00:00:00Z');
  const b = new Date(String(dateStr).slice(0, 10) + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

export function formatDate(dateStr, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateStr) return '—';
  const d = new Date(String(dateStr).length === 10 ? dateStr + 'T00:00:00' : dateStr);
  return d.toLocaleDateString('en-IN', opts);
}

export function formatMinutes(min) {
  const m = Math.round(min || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

// Today's date in India as YYYY-MM-DD (matches the backend's APP_TIMEZONE)
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function addDaysISO(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const TASK_TYPE_LABEL = {
  study: 'Study',
  revision: 'Revision',
  'practice-test': 'Practice test',
  'mock-test': 'Mock test',
};
