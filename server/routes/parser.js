/**
 * Feature 1 — Multi-Lingual FIR / Complaint Parser (Philippines)
 * POST /api/parser/parse
 *   body: { text: string, language?: string, source?: 'text'|'pdf'|'voice' }
 *   → returns structured JSON of entities: suspects, victim, stolen items,
 *     locations, timestamps, RPC/RA sections, identifying marks.
 *
 * POST /api/parser/extract-pdf
 *   multipart/form-data: { file: <pdf> }
 *   → extracts raw text from an uploaded FIR/complaint PDF so it can be
 *     passed into /parse and then discussed with the Copilot chatbot.
 */

import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { chatCompletion, extractJson } from '../services/groq-ai.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const SYSTEM_PROMPT = `You are an expert Philippine police investigator who reads First Information Reports / police blotter complaints — often written in messy, narrative, multi-lingual, mixed-script prose (English, Filipino/Tagalog, Cebuano/Bisaya, Ilocano, or Taglish) — and extracts structured entities from them.

You must always return strict JSON with EXACTLY this shape (no commentary, no markdown):
{
  "language_detected": "string (e.g. 'English', 'Filipino', 'Taglish', 'Cebuano', 'Ilocano')",
  "fir_number": "string or null",
  "police_station": "string or null",
  "date_time_mentioned": "ISO8601 string or null",
  "victim": { "name": "string or null", "age": number|null, "gender": "M|F|O|null" },
  "suspects": [
    { "description": "string", "height": "string or null", "build": "string or null",
      "identifying_marks": ["string"], "estimated_age": "string or null", "alias": "string or null" }
  ],
  "stolen_items": [{ "item": "string", "qty": "string or null", "value_php": number|null, "serial_or_desc": "string or null" }],
  "weapons_mentioned": ["string"],
  "vehicles_mentioned": [{ "type": "string", "color": "string or null", "plate_partial": "string or null" }],
  "locations": ["string"],
  "phone_numbers": ["string"],
  "timestamps_mentioned": ["string"],
  "law_sections_suggested": ["string — e.g. 'Art. 294 RPC (Robbery)', 'RA 10175 (Cybercrime Prevention Act)'"],
  "narrative_summary": "2-3 sentence English summary",
  "confidence": number between 0 and 1
}

If the input is empty, return a valid object with empty arrays and null fields. Never invent facts that are not in the input.`;

router.post('/parse', async (req, res, next) => {
  try {
    const { text = '', language = 'auto', source = 'text' } = req.body || {};
    if (!text.trim()) {
      return res.status(400).json({ ok: false, error: 'text is required' });
    }

    const userPrompt = `SOURCE: ${source}
LANGUAGE_HINT: ${language}

--- BEGIN RAW FIR / COMPLAINT TEXT ---
${text}
--- END RAW FIR ---

Extract all entities into the JSON schema. Reply with JSON only.`;

    const { content, model } = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { json: true, temperature: 0.1, maxTokens: 1800 }
    );

    const parsed = extractJson(content);
    if (!parsed) {
      return res.status(502).json({
        ok: false,
        error: 'Model did not return valid JSON',
        raw: content,
      });
    }

    res.json({ ok: true, model, entities: parsed, source, raw_text: text });
  } catch (e) {
    next(e);
  }
});

/**
 * PDF upload — extracts raw text from an uploaded FIR/complaint PDF.
 * The client sends the extracted text straight into /parse so the same
 * Chatbot context (raw text + entities) is available for Q&A afterwards.
 */
router.post('/extract-pdf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded. Send multipart/form-data with field "file".' });
    }
    const isPdf = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname || '');
    if (!isPdf) {
      return res.status(400).json({ ok: false, error: 'Only PDF files are supported in this prototype.' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = (data.text || '').trim();

    if (!text) {
      return res.status(422).json({
        ok: false,
        error:
          'No extractable text found in this PDF. It may be a scanned image — OCR is not wired up in this prototype, so please paste the text manually.',
      });
    }

    res.json({
      ok: true,
      filename: req.file.originalname,
      pages: data.numpages,
      text,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Demo sample — useful for the UI "Try a sample" button.
 */
router.get('/sample', (_req, res) => {
  res.json({
    ok: true,
    samples: [
      {
        label: 'English — bag/laptop snatching',
        text:
          'On 9 May 2024 at about 2:20 PM outside a bank along General Araneta Ave, Cubao, Quezon City, two motorcycle-riding men snatched the sling bag of Ms. Liza Gonzales right after she withdrew cash. The pillion rider was about 5\'9", lanky build, with a dragon tattoo on his left forearm. The driver wore a black full-face helmet. They fled towards Gen. Roxas Ave, no plate visible. The bag contained a Lenovo IdeaPad laptop and around ₱15,000 in cash.',
      },
      {
        label: 'Taglish — phone snatching',
        text:
          'Kaninang 8am malapit sa Sushant... äh, sa may Cubao, may isang lalaki na bigla nalang chinineck yung iPhone 12 ko. Suot niya black jacket, medyo pandak (~5\'4"), tumakbo papuntang sakayan ng habal-habal. Partial plate lang nakita ko: NCR 8C.... IMEI ng phone ko 35... yun.',
      },
      {
        label: 'Filipino (Tagalog)',
        text:
          'Noong ika-15 ng Hulyo 2023, mga alas-7:50 ng umaga sa palengke ng Bacoor, may lalaking bigla nalang kinuha ang kwintas na ginto ni Gng. Josefina Ramos. Ang suspek ay mataba, at lumpo sa kaliwang paa. Tumakbo siya papunta sa isang eskinita malapit sa palengke.',
      },
    ],
  });
});

export default router;
