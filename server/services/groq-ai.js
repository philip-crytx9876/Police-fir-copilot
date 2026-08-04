/**
 * Groq provider — DEFAULT AI service for the Copilot.
 * Docs: https://console.groq.com/docs
 *
 * Uses openai/gpt-oss-120b (default) but you can swap to any other model
 * that ships on GroqCloud (llama, qwen, gpt-oss variants, etc.) by
 * changing GROQ_MODEL in the .env file. Groq's chat completions endpoint
 * is OpenAI-compatible.
 */

const ENDPOINT =
  process.env.GROQ_ENDPOINT ||
  'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function ensureToken() {
  const token = process.env.GROQ_API_KEY;
  if (!token || token === 'gsk_replace_with_your_groq_api_key') {
    const err = new Error(
      'GROQ_API_KEY is missing. Add it to your .env file. ' +
        'Get a free key at https://console.groq.com/keys.'
    );
    err.status = 401;
    throw err;
  }
  return token;
}

/**
 * Low-level chat completion call.
 * @param {Array<{role:'system'|'user'|'assistant', content:string}>} messages
 * @param {object} [opts]
 * @param {string} [opts.model]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {boolean} [opts.json]  request JSON-only output
 */
export async function chatCompletion(messages, opts = {}) {
  const token = ensureToken();
  const model = opts.model || DEFAULT_MODEL;
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? 0.2,
    top_p: 0.9,
    max_tokens: opts.maxTokens ?? 1500,
    stream: false,
  };
  if (opts.json) {
    body.response_format = { type: 'json_object' };
  }

  // 30s hard timeout so a missing/invalid key or network issue never hangs the UI
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      const err = new Error('Groq request timed out after 30s');
      err.status = 504;
      throw err;
    }
    throw e;
  }
  clearTimeout(timer);

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `Groq API error ${res.status}: ${text.slice(0, 300)}`
    );
    err.status = res.status;
    err.detail = text;
    throw err;
  }

  const data = await res.json();
  return {
    model: data.model,
    content: data?.choices?.[0]?.message?.content ?? '',
    usage: data.usage || null,
    raw: data,
  };
}

/**
 * Robustly extract JSON from an LLM response.  Handles fenced blocks
 * (```json …```), stray prose around the object, and minor mistakes.
 */
export function extractJson(text) {
  if (!text) return null;
  // strip markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_) {
      /* fallthrough */
    }
  }
  // try the whole text
  try {
    return JSON.parse(text.trim());
  } catch (_) {
    /* fallthrough */
  }
  // try the first {...} block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch (_) {
      return null;
    }
  }
  return null;
}

export const META = {
  provider: 'groq',
  defaultModel: DEFAULT_MODEL,
  endpoint: ENDPOINT,
};
