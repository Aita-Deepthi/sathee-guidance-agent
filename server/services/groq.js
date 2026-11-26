// Groq's OpenAI-compatible API. The API key is read only on the server.
const env = require('../config/env');

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 30000;

function isConfigured() {
  return Boolean(env.GROQ_API_KEY);
}

function getErrorStatus(err) {
  const status = err && (err.status || err.statusCode);
  const numericStatus = Number(status);
  return Number.isInteger(numericStatus) ? numericStatus : null;
}

function describeError(err) {
  const status = getErrorStatus(err);
  const message = String(err && (err.message || err) || '').toLowerCase();
  if (status === 429 || message.includes('rate limit') || message.includes('quota')) {
    return 'the free Groq quota has been used up for now';
  }
  if (status === 401 || status === 403) return 'the Groq API key is invalid or not permitted';
  if (status === 404 || message.includes('model_not_found')) return `the configured Groq model "${env.GROQ_MODEL}" is not available`;
  if (status === 500 || status === 502 || status === 503 || status === 504 || message.includes('timeout')) {
    return 'the Groq service is temporarily unavailable';
  }
  return 'the Groq service could not be reached';
}

function isRetryableError(err) {
  const status = getErrorStatus(err);
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504
    || err?.name === 'AbortError' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}

async function generateReply({ systemPrompt, history = [], message, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!isConfigured()) {
    const err = new Error('GROQ_API_KEY is not configured on the server');
    err.reason = 'the Groq key is not configured on the server';
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(body.error?.message || `Groq request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const text = body.choices?.[0]?.message?.content;
    if (!text || !text.trim()) throw new Error('Empty response from Groq');
    console.log('[Groq] chat completion succeeded:', {
      durationMs: Date.now() - startedAt,
      model: env.GROQ_MODEL,
      historyMessages: history.length,
      promptCharacters: systemPrompt.length + message.length + history.reduce((total, item) => total + item.content.length, 0),
    });
    return text.trim();
  } catch (err) {
    if (controller.signal.aborted) err.reason = 'the Groq service took too long to respond';
    err.reason = err.reason || describeError(err);
    console.error('[Groq] chat completion failed:', {
      status: getErrorStatus(err),
      name: err.name,
      reason: err.reason,
      model: env.GROQ_MODEL,
    });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateReply, isConfigured, isRetryableError };
