/**
 * Feature 2 — Repeat Offender SQL Matcher
 * POST /api/matcher/search
 *   body: { query: string, entities?: object, minScore?: number }
 *   → returns matching offenders, ranked by score.
 *
 * Strategy:
 *   1. Lightweight rule-based matching (height, marks, MO keywords, area).
 *   2. AI re-ranking using Groq to give an explanation per match.
 */

import { Router } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatCompletion, extractJson } from '../services/groq-ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OFFENDERS = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'offenders.json'), 'utf8')
);

const router = Router();

function scoreOffender(o, q) {
  const text = (q || '').toLowerCase();
  let score = 0;
  const reasons = [];

  // height (cm vs inches heuristic)
  const inchMatch = text.match(/(\d)\s*['’]\s*(\d{1,2})/);
  if (inchMatch) {
    const inches = parseInt(inchMatch[1]) * 12 + parseInt(inchMatch[2]);
    const cm = Math.round(inches * 2.54);
    const diff = Math.abs((o.height_cm || 0) - cm);
    if (diff <= 2) {
      score += 30;
      reasons.push(`height ~${o.height_cm} cm matches "${inchMatch[0]}"`);
    } else if (diff <= 5) {
      score += 15;
      reasons.push(`height ${o.height_cm} cm close to "${inchMatch[0]}"`);
    }
  }

  // identifying marks
  for (const m of o.identifying_marks || []) {
    const key = m.toLowerCase();
    if (key !== 'none distinctive' && (text.includes(key) || text.split(/\s+/).some((w) => w.length > 4 && key.includes(w)))) {
      score += 25;
      reasons.push(`mark: "${m}"`);
    }
  }

  // tattoo explicitly
  if (text.includes('tattoo')) {
    for (const m of o.identifying_marks || []) {
      if (m.toLowerCase().includes('tattoo')) {
        score += 15;
        reasons.push(`tattoo: "${m}"`);
      }
    }
  }

  // operating area
  for (const a of o.operating_areas || []) {
    if (text.includes(a.toLowerCase())) {
      score += 20;
      reasons.push(`area: ${a}`);
    }
  }

  // MO keyword overlap
  const moText = (o.modus_operandi || []).join(' ').toLowerCase();
  for (const kw of ['snatch', 'motorcycle', 'habal-habal', 'lookout', 'look-out', 'morning', 'evening', 'necklace', 'chain', 'gold', 'phone', 'bag', 'laptop', 'bank', 'atm']) {
    if (text.includes(kw) && moText.includes(kw)) {
      score += 5;
      reasons.push(`MO: "${kw}"`);
    }
  }

  // status
  if (o.status === 'active') {
    score += 5;
    reasons.push('currently active');
  }

  return { score, reasons: [...new Set(reasons)] };
}

router.post('/search', async (req, res, next) => {
  try {
    const { query = '', entities = null, minScore = 20 } = req.body || {};
    if (!query.trim()) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const enrichedQuery = entities
      ? `${query}\nExtracted entities: ${JSON.stringify(entities)}`
      : query;

    const scored = OFFENDERS.map((o) => {
      const { score, reasons } = scoreOffender(o, enrichedQuery);
      return { offender: o, score, reasons };
    })
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // ask the model to give a short investigative rationale per top match
    let rationale = [];
    if (scored.length > 0) {
      try {
        const { content } = await chatCompletion(
          [
            {
              role: 'system',
              content:
                'You are a Philippine police investigator. Given a query and a list of matching offenders, return strict JSON: { "rationale": [{ "id": "OFF-...", "why": "1-sentence plain-English reason" }, ...] }. Be concise and factual.',
            },
            {
              role: 'user',
              content: `QUERY: ${enrichedQuery}\n\nMATCHES:\n${scored.map((s) => `- ${s.offender.id} ${s.offender.name} (score ${s.score}) reasons: ${s.reasons.join('; ')}`).join('\n')}\n\nReturn JSON only.`,
            },
          ],
          { json: true, temperature: 0.1, maxTokens: 600 }
        );
        const parsed = extractJson(content);
        if (parsed?.rationale) rationale = parsed.rationale;
      } catch (e) {
        rationale = [];
      }
    }

    const enriched = scored.map((s) => {
      const r = rationale.find((x) => x.id === s.offender.id);
      return { ...s, why: r?.why || s.reasons.join(' • ') };
    });

    res.json({
      ok: true,
      query,
      matches: enriched,
      total_in_db: OFFENDERS.length,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/all', (_req, res) => {
  res.json({ ok: true, offenders: OFFENDERS, total: OFFENDERS.length });
});

export default router;
