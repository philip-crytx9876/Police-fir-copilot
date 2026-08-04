/**
 * Feature 3 — Case Timeline & Relationship Graph Generator
 * GET  /api/graph/cases       → all cases with events
 * POST /api/graph/build       → build nodes + edges for a set of case IDs
 *      body: { case_ids: ["FIR/2023/0411", ...] }
 *
 * Node types: case, person (suspect, victim, IO, witness), phone, location
 * Edge types: involved_in, happened_at, has_phone, knows, called, stole
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

router.get('/cases', (_req, res) => {
  res.json({
    ok: true,
    cases: CASES.map((c) => ({
      case_id: c.case_id,
      station: c.station,
      sections: c.sections,
      summary: c.summary,
      registered_at: c.registered_at,
      events: c.events,
    })),
    total: CASES.length,
  });
});

router.post('/build', async (req, res, next) => {
  try {
    const { case_ids = [] } = req.body || {};
    if (!Array.isArray(case_ids) || case_ids.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: 'case_ids must be a non-empty array' });
    }

    const selected = CASES.filter((c) => case_ids.includes(c.case_id));
    if (selected.length === 0) {
      return res.status(404).json({ ok: false, error: 'no matching cases' });
    }

    // ---- TIMELINE (deterministic) ----
    const timeline = selected
      .flatMap((c) =>
        c.events.map((e) => ({
          case_id: c.case_id,
          ts: e.ts,
          label: e.label,
          station: c.station,
        }))
      )
      .sort((a, b) => new Date(a.ts) - new Date(b.ts));

    // ---- NODES & EDGES (deterministic base) ----
    const nodesMap = new Map();
    const edges = [];

    const addNode = (id, type, label, meta = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, type, label, ...meta });
      }
    };
    const addEdge = (source, target, type, label = '') => {
      edges.push({ id: `${source}->${target}:${type}:${edges.length}`, source, target, type, label });
    };

    for (const c of selected) {
      addNode(c.case_id, 'case', c.case_id, {
        station: c.station,
        summary: c.summary,
      });
      addNode(`STATION::${c.station}`, 'location', c.station);
      addEdge(c.case_id, `STATION::${c.station}`, 'registered_at');

      if (c.victim && c.victim !== '—') {
        addNode(`PERSON::${c.victim}`, 'person', c.victim, { role: 'victim' });
        addEdge(`PERSON::${c.victim}`, c.case_id, 'victim_of');
      }
      if (c.io) {
        addNode(`PERSON::${c.io}`, 'person', c.io, { role: 'investigating_officer' });
        addEdge(`PERSON::${c.io}`, c.case_id, 'investigates');
      }
      for (const s of c.suspects_mentioned || []) {
        const id = `SUSPECT::${c.case_id}::${s}`;
        addNode(id, 'person', s, { role: 'suspect', case_id: c.case_id });
        addEdge(id, c.case_id, 'suspect_in');
      }
      for (const p of c.phone_numbers_mentioned || []) {
        addNode(`PHONE::${p}`, 'phone', p);
        addEdge(c.case_id, `PHONE::${p}`, 'mentions_phone');
      }
      for (const it of c.stolen_items || []) {
        addNode(`ITEM::${c.case_id}::${it}`, 'item', it, { case_id: c.case_id });
        addEdge(c.case_id, `ITEM::${c.case_id}::${it}`, 'stolen_item');
      }
    }

    // ---- AI: infer cross-case relationships ----
    let inferred = { relationships: [] };
    try {
      const { content } = await chatCompletion(
        [
          {
            role: 'system',
            content:
              'You are an investigator. Given several FIR summaries, identify likely cross-case relationships (shared suspect by MO/description, shared phone, repeated victim pattern, etc.). Return strict JSON: { "relationships": [ { "from": "case_id or person label", "to": "case_id or person label", "type": "shared_suspect|shared_phone|similar_mo|repeat_victim|shared_location", "evidence": "1 short sentence" } ] }',
          },
          {
            role: 'user',
            content: `CASES:\n${JSON.stringify(selected, null, 2)}`,
          },
        ],
        { json: true, temperature: 0.1, maxTokens: 700 }
      );
      inferred = extractJson(content) || inferred;
    } catch (_) {
      // ignore — we already have base graph
    }

    // merge inferred relationships as edges
    for (const r of inferred.relationships || []) {
      // map labels back to node ids
      const fromId = nodesMap.has(r.from)
        ? r.from
        : [...nodesMap.values()].find((n) => n.label === r.from)?.id;
      const toId = nodesMap.has(r.to)
        ? r.to
        : [...nodesMap.values()].find((n) => n.label === r.to)?.id;
      if (fromId && toId) {
        addEdge(fromId, toId, r.type || 'related', r.evidence || '');
      }
    }

    res.json({
      ok: true,
      timeline,
      graph: {
        nodes: [...nodesMap.values()],
        edges,
      },
      inferred_relationships: inferred.relationships || [],
      case_count: selected.length,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
