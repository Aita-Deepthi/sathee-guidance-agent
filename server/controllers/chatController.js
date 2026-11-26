const ChatHistory = require('../models/ChatHistory');
const DailyTask = require('../models/DailyTask');
const AppError = require('../utils/AppError');
const { getProfileOrFail } = require('./profileController');
const gemini = require('../services/gemini');
const groq = require('../services/groq');
const { extractDetails, buildSystemPrompt, fallbackReply } = require('../services/assistant');
const { computeSyllabusStats, getSyllabus } = require('../services/progressService');
const { todayStr, daysBetween } = require('../utils/date');

const HISTORY_LIMIT = 20; // messages sent back to the model as context

async function generateAiReply(input, providers = { gemini, groq }) {
  if (providers.gemini.isConfigured()) {
    try {
      return { reply: await providers.gemini.generateReply(input), source: 'gemini' };
    } catch (err) {
      if (!providers.gemini.isRetryableError(err)) throw err;
      return { reply: await providers.groq.generateReply(input), source: 'groq' };
    }
  }
  return { reply: await providers.groq.generateReply(input), source: 'groq' };
}

async function buildContext(req) {
  const profile = await getProfileOrFail(req.user._id);
  const [stats, todayTasks, syllabus] = await Promise.all([
    computeSyllabusStats(req.user._id, profile),
    DailyTask.find({ user: req.user._id, date: todayStr() }).lean(),
    getSyllabus(profile.exam, profile.subjects),
  ]);
  const syllabusOutline = syllabus.map((s) => `${s.subject}: ${s.chapters.map((c) => c.name).join('; ')}`).join('\n');
  return {
    name: req.user.name,
    profile,
    stats,
    todayTasks,
    syllabusOutline,
    daysLeft: profile.examDate ? daysBetween(todayStr(), profile.examDate) : null,
  };
}

// GET /api/chat/status
async function status(req, res) {
  res.json({
    aiConfigured: gemini.isConfigured() || groq.isConfigured(),
    providers: { gemini: gemini.isConfigured(), groq: groq.isConfigured() },
  });
}

// GET /api/chat — list conversations (newest first)
async function listConversations(req, res) {
  const chats = await ChatHistory.find({ user: req.user._id })
    .select('title updatedAt createdAt').sort({ updatedAt: -1 }).limit(50).lean();
  res.json({ conversations: chats });
}

// GET /api/chat/:id
async function getConversation(req, res) {
  const chat = await ChatHistory.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!chat) throw new AppError('Conversation not found', 404);
  res.json({ conversation: chat });
}

// DELETE /api/chat/:id
async function deleteConversation(req, res) {
  const r = await ChatHistory.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!r.deletedCount) throw new AppError('Conversation not found', 404);
  res.json({ message: 'Conversation deleted' });
}

// POST /api/chat/send  { conversationId?, message }
async function sendMessage(req, res) {
  const requestStartedAt = Date.now();
  const message = String(req.body.message || '').trim();
  if (!message) throw new AppError('Message cannot be empty', 400);
  if (message.length > 4000) throw new AppError('Message is too long (max 4000 characters)', 400);

  let chat;
  if (req.body.conversationId) {
    chat = await ChatHistory.findOne({ _id: req.body.conversationId, user: req.user._id });
    if (!chat) throw new AppError('Conversation not found', 404);
  } else {
    chat = new ChatHistory({ user: req.user._id, title: message.slice(0, 60), messages: [] });
  }

  const ctx = await buildContext(req);
  const history = chat.messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));
  const detected = extractDetails(message);
  const systemPrompt = buildSystemPrompt(ctx);

  let reply, source, aiError = null;
  try {
    ({ reply, source } = await generateAiReply({ systemPrompt, history, message }));
  } catch (err) {
    aiError = err.reason || 'the AI service is unavailable';
    reply = fallbackReply(ctx, message, aiError);
    source = 'fallback';
  }

  chat.messages.push({ role: 'user', content: message, source: 'user' });
  chat.messages.push({ role: 'assistant', content: reply, source });
  await chat.save();
  console.log('[Chat] request completed:', {
    durationMs: Date.now() - requestStartedAt,
    source,
    historyMessages: history.length,
    promptCharacters: systemPrompt.length + message.length + history.reduce((total, item) => total + item.content.length, 0),
  });

  res.json({
    conversationId: chat._id,
    title: chat.title,
    message: chat.messages[chat.messages.length - 1],
    detected: Object.keys(detected).length ? detected : null,
    aiError,
  });
}

module.exports = { status, listConversations, getConversation, deleteConversation, sendMessage, generateAiReply };
