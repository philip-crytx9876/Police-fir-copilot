/**
 * Q&A Chatbot — uses Groq (default: openai/gpt-oss-120b)
 * POST /api/chat
 *   body: { message: string, history?: [{role, content}], context?: object }
 */

import { Router } from 'express';
import { chatCompletion } from '../services/groq-ai.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OFFENDERS = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'offenders.json'), 'utf8')
);
const CASES = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'cases.json'), 'utf8')
);

const router = Router();

const SYSTEM_PROMPT = `You are FIR-Copilot, an investigative assistant for Philippine National Police (PNP) officers. You help with:
- Explaining Revised Penal Code (RPC) articles, special penal laws (e.g. RA 10175 Cybercrime Prevention Act, PD 1612 Anti-Fencing Law), and the Revised Rules of Criminal Procedure in plain English
- Drafting search, seizure, and inquest-referral paperwork outlines
- Suggesting investigative leads and evidence preservation steps
- Cross-referencing known offenders and case patterns from the in-house DB

If the officer has just uploaded or parsed an FIR/complaint (see CURRENT CASE CONTEXT below when present), ground your answer in the specifics of that document — the victim, suspects, stolen items, location and any suggested law sections — before giving general advice. When asked for "the solution" or "next steps" on an uploaded FIR, give a concrete, numbered action plan (e.g. what evidence to secure, who to interview, what to check against the known-offender DB, and which RPC/RA sections likely apply), not just a legal explainer.

You have read-only access to the following in-house data; you may use it when answering.

=== OFFENDERS (anonymized excerpts) ===
${OFFENDERS.map(
  (o) =>
    `- ${o.id} ${o.name} (${o.alias.join('/')}): height ${o.height_cm}cm, marks: ${o.identifying_marks.join(
      ', '
    )}, areas: ${o.operating_areas.join(', ')}, status: ${o.status}, risk ${o.risk_score}/100, prior cases: ${o.previous_offences.length}`
).join('\n')}

=== CASES ===
${CASES.map(
  (c) =>
    `- ${c.case_id} @ ${c.station}: ${c.summary} (IO: ${c.io}, sections: ${c.sections.join(', ')})`
).join('\n')}

Be concise, professional, and safety-first. Never invent facts. If you do not know, say so and suggest the next investigative step. When asked about legal procedure, cite the relevant RPC article or RA section.`;

router.post('/', async (req, res, next) => {
  try {
    const { message = '', history = [], context = null } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({ ok: false, error: 'message is required' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(context
        ? [
            {
              role: 'system',
              content: `CURRENT CASE CONTEXT (from the uploaded/parsed FIR — use these specifics in your answer):\n${JSON.stringify(context, null, 2).slice(0, 4000)}`,
            },
          ]
        : []),
      ...history
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .slice(-10)
        .map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const { content, model } = await chatCompletion(messages, {
      temperature: 0.4,
      maxTokens: 1200,
    });

    res.json({ ok: true, model, reply: content });
  } catch (e) {
    next(e);
  }
});

export default router;
