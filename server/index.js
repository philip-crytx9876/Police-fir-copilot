import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import parserRouter from './routes/parser.js';
import matcherRouter from './routes/matcher.js';
import graphRouter from './routes/graph.js';
import actionPlanRouter from './routes/actionplan.js';
import chatRouter from './routes/chat.js';
import snowflakeRouter from './routes/snowflake.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'police-fir-copilot',
    ai: {
      provider: 'groq',
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      endpoint: process.env.GROQ_ENDPOINT,
      keyPresent: Boolean(process.env.GROQ_API_KEY),
    },
    features: [
      'multi-lingual-fir-parser',
      'repeat-offender-matcher',
      'case-timeline-graph',
      'investigative-action-plan',
      'qa-chatbot',
      'snowflake-demo-warehouse',
    ],
    time: new Date().toISOString(),
  });
});

app.use('/api/parser', parserRouter);
app.use('/api/matcher', matcherRouter);
app.use('/api/graph', graphRouter);
app.use('/api/actionplan', actionPlanRouter);
app.use('/api/chat', chatRouter);
app.use('/api/snowflake', snowflakeRouter);

app.use((err, _req, res, _next) => {
  console.error('[server] error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
    detail: err.detail || null,
  });
});

// On Vercel the app is imported by /api/index.js and served as a serverless
// function — Vercel manages the listening socket, so app.listen() must be
// skipped there. Locally (`npm run dev` / `npm start`) it runs as usual.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n┌────────────────────────────────────────────────────────┐`);
    console.log(`│  🚓  Police FIR Copilot — API running on :${PORT}        │`);
    console.log(`│  🤖  AI provider : Groq (${(process.env.GROQ_MODEL || 'openai/gpt-oss-120b').slice(0, 28).padEnd(28)})│`);
    console.log(`│  🔑  Key set     : ${process.env.GROQ_API_KEY ? 'YES' : 'NO  (add GROQ_API_KEY to .env)'}                              │`);
    console.log(`└────────────────────────────────────────────────────────┘\n`);
  });
}

export default app;
