/*
 * Thin wrapper around the official Google Gen AI SDK (@google/genai).
 * The API key is read only on the server — it never reaches the browser.
 */
const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');

const DEFAULT_TIMEOUT_MS = 90000;
const FALLBACK_MODEL = 'gemini-3.6-flash';
let client = null;
function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
      httpOptions: { retryOptions: { attempts: 1 } },
    });
  }
  return client;
}

function isConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}

// Turns SDK errors into short, student-friendly reasons
function describeError(err) {
  const msg = String(err && (err.message || err)).toLowerCase();
  const status = getErrorStatus(err);
  if (status === 429 || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('429')) {
    return 'the free Gemini quota has been used up for now';
  }
  if (status === 401 || status === 403 || msg.includes('api key') || msg.includes('permission')) {
    return 'the Gemini API key is invalid or not permitted';
  }
  if (status === 500 || status === 502 || status === 503 || status === 504 || msg.includes('unavailable')) {
    return 'the configured Gemini model is temporarily busy';
  }
  if (msg.includes('timeout')) return 'the AI service took too long to respond';
  if (msg.includes('not found') || status === 404) return `the configured model "${env.GEMINI_MODEL}" is not available`;
  return 'the AI service could not be reached';
}

function getErrorStatus(err) {
  const status = err && (err.status || err.statusCode || err.code);
  const numericStatus = Number(status);
  return Number.isInteger(numericStatus) ? numericStatus : null;
}

function isRetryableError(err) {
  const status = getErrorStatus(err);
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504
    || err?.name === 'AbortError' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}

function getErrorMessage(err) {
  const message = String(err && (err.message || err) || 'Unknown Gemini error');
  return env.GEMINI_API_KEY ? message.split(env.GEMINI_API_KEY).join('[REDACTED]') : message;
}

function logApiError(err, details = {}) {
  const status = getErrorStatus(err);
  const logDetails = {
    status,
    statusText: err && err.statusText ? String(err.statusText) : undefined,
    message: getErrorMessage(err),
    name: err && err.name ? String(err.name) : undefined,
    model: env.GEMINI_MODEL,
    ...details,
  };
  console.error('[Gemini] generateContent failed:', logDetails);
}

/**
 * @param {string} systemPrompt  instructions + student context
 * @param {Array<{role:'user'|'assistant', content:string}>} history  earlier messages
 * @param {string} message  the new user message
 * @returns {Promise<string>} the model's reply text
 */
async function generateReply({ systemPrompt, history = [], message, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const ai = getClient();
  if (!ai) {
    const e = new Error('GEMINI_API_KEY is not configured on the server');
    e.reason = 'the AI key is not configured on the server';
    throw e;
  }
  const contents = [
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  async function generateWithModel(model) {
    return ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
        maxOutputTokens: 2048,
        abortSignal: controller.signal,
      },
    });
  }

  try {
    let response;
    try {
      response = await generateWithModel(env.GEMINI_MODEL);
    } catch (err) {
      if (getErrorStatus(err) !== 503 || env.GEMINI_MODEL === FALLBACK_MODEL) throw err;
      console.warn(`[Gemini] ${env.GEMINI_MODEL} is temporarily unavailable; retrying with ${FALLBACK_MODEL}`);
      response = await generateWithModel(FALLBACK_MODEL);
    }
    const text = response.text;
    if (!text || !text.trim()) throw new Error('Empty response from model');
    console.log('[Gemini] generateContent succeeded:', {
      durationMs: Date.now() - startedAt,
      model: response.modelVersion || env.GEMINI_MODEL,
      historyMessages: history.length,
      promptCharacters: systemPrompt.length + message.length + history.reduce((total, item) => total + item.content.length, 0),
    });
    return text.trim();
  } catch (err) {
    if (controller.signal.aborted && !err.reason) {
      err.reason = 'the AI service took too long to respond';
    }
    logApiError(err, { durationMs: Date.now() - startedAt });
    err.reason = err.reason || describeError(err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateReply, isConfigured, isRetryableError };
