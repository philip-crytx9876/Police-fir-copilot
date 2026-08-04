/**
 * Feature 4 — Investigative Action Plan Draft
 * POST /api/actionplan/generate
 *   body: { case_id?: string, entities?: object, summary?: string, sections?: string[] }
 *   → returns a structured charge-sheet outline + next steps.
 */

import { Router } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatCompletion, extractJson } from '../services/groq-ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CASES = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'cases.json'), 'utf8')
);

const router = Router();

const SYSTEM_PROMPT = `You are a senior Philippine National Police (PNP) investigator drafting an investigative action plan & referral outline for an FIR/complaint.

You must always return strict JSON (no markdown, no commentary) with EXACTLY this shape:
{
  "case_header": {
    "fir_number": "string or null",
    "police_station": "string or null",
    "investigating_officer": "string or null",
    "date_registered": "string or null",
    "sections": ["string"]
  },
  "brief_facts": "3-5 sentence narrative of the alleged offence",
  "elements_to_prove": ["string — each is one element of the offence"],
  "witnesses_to_examine": [
    { "name": "string or 'Eyewitness 1'", "type": "eyewitness|expert|formal|informant", "purpose": "string" }
  ],
  "evidence_to_collect": [
    { "item": "string", "type": "cctv|digital|forensic|documentary|physical", "source_location": "string or null", "priority": "high|medium|low" }
  ],
  "suspects": [{ "description": "string", "status": "unknown|identified|detained|absconding" }],
  "next_steps": [
    { "step": "string — concrete action", "owner_role": "IO|Evidence Team|Cyber Cell|Beat Constable", "timeline": "string — e.g. 'within 24 hours'", "legal_reference": "string or null" }
  ],
  "charge_sheet_outline": [
    "Heading 1 — Particulars of the case",
    "Heading 2 — Acts of the accused",
    "Heading 3 — Evidence relied upon",
    "Heading 4 — Referral to the Office of the City/Provincial Prosecutor for inquest or preliminary investigation"
  ],
  "risk_flags": ["string — warnings for the IO"],
  "confidence": number between 0 and 1
}`;

router.post('/generate', async (req, res, next) => {
  try {
    const {
      case_id = null,
      entities = null,
      summary = '',
      sections = [],
    } = req.body || {};

    let contextSummary = summary;
    let contextSections = sections;
    let contextHeader = {};
    if (case_id) {
      const c = CASES.find((x) => x.case_id === case_id);
      if (c) {
        contextSummary = c.summary;
        contextSections = c.sections;
        contextHeader = {
          fir_number: c.case_id,
          police_station: c.station,
          investigating_officer: c.io,
          date_registered: c.registered_at,
        };
      }
    }

    const userPrompt = `INPUT CONTEXT:
${contextHeader ? `CASE HEADER: ${JSON.stringify(contextHeader)}` : ''}
SECTIONS: ${JSON.stringify(contextSections)}
SUMMARY: ${contextSummary}
EXTRACTED ENTITIES: ${JSON.stringify(entities || {})}

Draft a thorough but practical action plan. Be specific to Philippine policing context (Revised Penal Code articles, relevant special penal laws like RA 10175 or PD 1612, and the Revised Rules of Criminal Procedure). Return JSON only.`;

    const { content, model } = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { json: true, temperature: 0.2, maxTokens: 2200 }
    );

    const parsed = extractJson(content);
    if (!parsed) {
      return res.status(502).json({ ok: false, error: 'Model did not return valid JSON', raw: content });
    }

    res.json({ ok: true, model, plan: parsed });
  } catch (e) {
    next(e);
  }
});

router.get('/cases', (_req, res) => {
  res.json({ ok: true, cases: CASES.map((c) => ({ case_id: c.case_id, station: c.station, summary: c.summary })) });
});

export default router;
