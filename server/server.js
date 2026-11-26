/*
 * SATHEE Guidance Agent — Express API server
 * Start locally with:  npm run dev   (http://localhost:5000)
 */
require('./config/dns');
const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { seedReferenceData } = require('./data/seed');
const gemini = require('./services/gemini');
const groq = require('./services/groq');
const youtube = require('./services/youtube');

const app = express();
app.set('trust proxy', 1); // needed behind Render's proxy for rate limiting

// CORS: only the configured frontend URL(s) may call this API from a browser
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || env.CLIENT_URLS.includes(origin.replace(/\/$/, ''))) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ name: 'SATHEE Guidance Agent API', docs: '/api/health' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  await seedReferenceData(); // only seeds if the collections are empty
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
    console.log(`Gemini AI: ${gemini.isConfigured() ? `configured (${env.GEMINI_MODEL})` : 'NOT configured — rule-based fallback active'}`);
    console.log(`Groq AI: ${groq.isConfigured() ? `configured (${env.GROQ_MODEL})` : 'NOT configured — Gemini remains primary'}`);
    console.log(`YouTube API: ${youtube.isConfigured() ? 'configured' : 'NOT configured — curated links fallback active'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
