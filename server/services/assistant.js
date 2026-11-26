/*
 * AI Study Assistant logic.
 *  - extractDetails(): rule-based parsing of exam, date, class, hours, level
 *    from a student's message (works with or without AI).
 *  - buildSystemPrompt(): gives Gemini the student's real context.
 *  - fallbackReply(): a helpful rule-based answer when Gemini is unavailable.
 */
const { todayStr, daysBetween, isValidDateStr } = require('../utils/date');

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

function pad(n) { return String(n).padStart(2, '0'); }
function monthIndex(word) {
  const w = word.toLowerCase();
  return MONTHS.findIndex((m) => m.startsWith(w.slice(0, 3)));
}

function extractDate(text) {
  let m;
  // 15 March 2027 / 15th Mar, 2027
  if ((m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/i))) {
    const mi = monthIndex(m[2]);
    return `${m[3]}-${pad(mi + 1)}-${pad(m[1])}`;
  }
  // March 15, 2027
  if ((m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i))) {
    const mi = monthIndex(m[1]);
    return `${m[3]}-${pad(mi + 1)}-${pad(m[2])}`;
  }
  // 2027-03-15
  if ((m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  // 15/03/2027 or 15-03-2027 (Indian day-first format)
  if ((m = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/))) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return null;
}

function extractDetails(message) {
  const text = String(message || '');
  const found = {};

  if (/jee\s*adv/i.test(text)) found.exam = 'JEE Advanced';
  else if (/jee(\s*mains?)?\b/i.test(text)) found.exam = 'JEE Main';
  else if (/\bneet\b/i.test(text)) found.exam = 'NEET';

  const date = extractDate(text);
  if (date && isValidDateStr(date)) found.examDate = date;

  const cls = text.match(/\b(?:class|std\.?|standard|grade)\s*(11|12)\b|\b(11|12)(?:th)?\s*(?:class|std|standard|grade)\b/i);
  if (cls) found.classLevel = Number(cls[1] || cls[2]);

  const hrs = text.match(/\b(\d{1,2}(?:\.\d)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:hours?|hrs?)\b/i);
  if (hrs) {
    const v = WORD_NUM[hrs[1].toLowerCase()] || Number(hrs[1]);
    if (v >= 1 && v <= 16) found.hoursPerDay = v;
  }

  // Remove "JEE Advanced" before looking for the level word "advanced"
  const noExam = text.replace(/jee\s*advanced/gi, '');
  if (/\bbeginner|just start|starting from scratch|from zero\b/i.test(noExam)) found.level = 'Beginner';
  else if (/\bintermediate\b/i.test(noExam)) found.level = 'Intermediate';
  else if (/\badvanced\b/i.test(noExam)) found.level = 'Advanced';

  return found;
}

function buildSystemPrompt(ctx) {
  const { name, profile, daysLeft, stats, todayTasks, syllabusOutline } = ctx;
  const weak = profile.weakChapters.map((w) => `${w.chapter} (${w.subject})`).join(', ') || 'none recorded';
  const today = todayTasks.length
    ? todayTasks.map((t) => `- [${t.status}] ${t.type}: ${t.subject} — ${t.chapter}${t.topic ? ' / ' + t.topic : ''} (${t.durationMinutes} min)`).join('\n')
    : 'No tasks scheduled today (the student may not have generated a study plan yet).';

  return `You are "SATHEE Guidance Agent", a friendly, encouraging AI study mentor for Indian Class 11-12 students preparing for JEE Main, JEE Advanced and NEET. Many students cannot afford coaching, so explain simply, step by step, and be warm and motivating.

STUDENT CONTEXT (from the app's database — trust this):
- Name: ${name}
- Class: ${profile.classLevel}
- Target exam: ${profile.exam}
- Exam date: ${profile.examDate ? `${profile.examDate} (${daysLeft} days left)` : 'NOT SET — ask the student for it'}
- Study hours per day: ${profile.hoursPerDay || 'unknown — ask'}
- Preparation level: ${profile.level}
- Subjects: ${profile.subjects.join(', ')}
- Weak chapters: ${weak}
- Syllabus completed in the app: ${stats.percent}% (${stats.doneTopics}/${stats.totalTopics} topics)
- Today is ${todayStr()}. Today's tasks:
${today}

SYLLABUS CHAPTERS USED BY THE APP:
${syllabusOutline}

RULES:
1. Answer Physics, Chemistry, Mathematics and Biology doubts clearly, with simple language, short steps, and a small example or formula where useful. Use plain text math (e.g. v = u + at).
2. When the student describes their exam, date, class, hours or level, acknowledge the details and give a personalised strategy (phases, subject balance, chapters to start with, revision and mock-test routine). If daily study hours are missing, ASK for them.
3. The exact day-by-day timetable is produced by the app's planner on the "My Study Plan" page — tell students to generate/regenerate it there instead of writing a full calendar yourself.
4. Never invent official exam dates, cut-offs, or syllabus changes. If asked, say the student should check the official NTA / JEE Advanced websites, and that they can set their exam date in Profile.
5. Do not invent specific video URLs. You may suggest the Learning Resources page, NCERT textbooks and the official SATHEE portal (https://sathee.iitk.ac.in/).
6. Recommend revision (spaced repetition, error log) and practice (mock tests) regularly. Be encouraging but honest.
7. Reply in the same language the student uses (English, Hindi, Telugu, etc.). Keep answers focused — usually under 300 words unless a detailed explanation is needed. Use short paragraphs or bullet points.
8. Politely decline topics unrelated to studies, careers or student wellbeing. If a student seems very stressed or mentions self-harm, respond with care and encourage them to talk to a trusted adult or call Tele-MANAS at 14416 (India).`;
}

function fallbackReply(ctx, message, reason) {
  const { profile, daysLeft, todayTasks, stats } = ctx;
  const details = extractDetails(message);
  const lower = message.toLowerCase();
  const lines = [`⚠️ The AI tutor is unavailable right now (${reason}). Here is guidance from the app's built-in rules:`, ''];

  if (Object.keys(details).length) {
    lines.push('I picked up these details from your message:', '');
    if (details.exam) lines.push(`- Exam: ${details.exam}`);
    if (details.examDate) lines.push(`- Exam date: ${details.examDate} (${daysBetween(todayStr(), details.examDate)} days from today)`);
    if (details.classLevel) lines.push(`- Class: ${details.classLevel}`);
    if (details.hoursPerDay) lines.push(`- Study hours per day: ${details.hoursPerDay}`);
    if (details.level) lines.push(`- Level: ${details.level}`);
    if (!details.hoursPerDay && !profile.hoursPerDay) lines.push('', 'How many hours can you study each day? Tell me so the plan fits your routine.');
    lines.push('', 'Use the "Apply to my profile & build plan" button below to save these and generate your day-by-day schedule.');
    return lines.join('\n');
  }

  if (/today|task|schedule|plan|timetable/.test(lower)) {
    if (todayTasks.length) {
      lines.push(`Your tasks for today (${todayTasks.filter((t) => t.status === 'completed').length}/${todayTasks.length} done):`, '');
      todayTasks.forEach((t) => lines.push(`- ${t.subject} — ${t.chapter}${t.topic ? ': ' + t.topic : ''} (${t.durationMinutes} min) ${t.status === 'completed' ? '✅' : ''}`));
      lines.push('', 'Mark tasks complete on the Daily Progress page so your dashboard updates.');
    } else {
      lines.push('You do not have tasks for today yet. Open "My Study Plan" and click Generate Plan — the planner will build a full day-by-day schedule from the syllabus.');
    }
    return lines.join('\n');
  }

  if (/weak|improve|score|marks|strategy|tips|how to prepare/.test(lower)) {
    lines.push(
      `General strategy for ${profile.exam} (${profile.level}):`, '',
      '- Study NCERT thoroughly first, then move to practice questions.',
      '- Spend extra time on weak chapters and revise them every few days.',
      '- Keep an error log — re-solve every question you got wrong.',
      '- Take one timed practice test every week and a full mock every two weeks.',
      daysLeft != null ? `- You have ${daysLeft} days left and have covered ${stats.percent}% of the syllabus in the app.` : '- Set your exam date in Profile so the planner can count days.',
    );
    return lines.join('\n');
  }

  lines.push(
    'For concept explanations, please try again in a little while once the AI service is back.',
    'Meanwhile you can:', '',
    '- Check today\'s tasks on the Daily Progress page',
    '- Watch lectures on the Learning Resources page',
    '- Read the NCERT chapter for this topic',
    '- Practice on the Mock Tests page',
  );
  return lines.join('\n');
}

module.exports = { extractDetails, buildSystemPrompt, fallbackReply };
