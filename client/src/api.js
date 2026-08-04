const BASE = import.meta.env.VITE_API_BASE || '/api';

async function http(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, error: text }; }
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

async function httpMultipart(path, formData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, error: text }; }
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

export const api = {
  health:        ()                       => http('/health'),
  parse:         (text, language = 'auto', source = 'text') =>
                   http('/parser/parse', { method: 'POST', body: { text, language, source } }),
  samples:       ()                       => http('/parser/sample'),
  extractPdf:    (file)                   => {
                   const fd = new FormData();
                   fd.append('file', file);
                   return httpMultipart('/parser/extract-pdf', fd);
                 },
  match:         (query, entities = null, minScore = 20) =>
                   http('/matcher/search', { method: 'POST', body: { query, entities, minScore } }),
  offenders:     ()                       => http('/matcher/all'),
  cases:         ()                       => http('/graph/cases'),
  buildGraph:    (case_ids)               => http('/graph/build', { method: 'POST', body: { case_ids } }),
  actionPlan:    (payload)                => http('/actionplan/generate', { method: 'POST', body: payload }),
  actionCases:   ()                       => http('/actionplan/cases'),
  chat:          (message, history = [], context = null) =>
                   http('/chat', { method: 'POST', body: { message, history, context } }),
  snowflakeDemo: ()                       => http('/snowflake/demo'),
};
