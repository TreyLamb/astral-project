// Free-provider rotation for server-side AI text calls, ported from
// Transcription/engine/providers.py (Groq -> GitHub Models GPT-4o -> Gemini).
// Tries each provider that has a key configured, and within a provider tries
// its models in order, falling through to the next model/provider on any
// HTTP error or network failure. Unlike the Python original this does NOT
// sleep-and-repass on a full-list miss — a serverless function has a hard
// execution time limit, so one pass through everything is all we get; the
// caller just sees the final error and can retry the request later.
//
// Keys come from plain process.env (NOT VITE_*/import.meta.env — see
// CLAUDE.md's "Backend / serverless functions" section). Nothing here ever
// logs a key.

const PROVIDERS = [
  {
    name: 'groq',
    style: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  {
    name: 'github',
    style: 'openai',
    url: 'https://models.github.ai/inference/chat/completions',
    keyEnv: 'GITHUB_TOKEN',
    models: ['openai/gpt-4o', 'openai/gpt-4o-mini'],
  },
  {
    name: 'gemini',
    style: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    keyEnv: 'GEMINI_API_KEY',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  },
];

export function hasAnyKey() {
  return PROVIDERS.some((p) => !!process.env[p.keyEnv]);
}

function extractText(style, data) {
  if (style === 'gemini') {
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text.trim();
  } else {
    const text = data?.choices?.[0]?.message?.content;
    if (text) return text.trim();
  }
  throw new Error(`empty response (${JSON.stringify(data).slice(0, 150)})`);
}

async function askOne(prov, model, promptText, key, temperature) {
  let url = prov.url;
  let body;
  const headers = { 'Content-Type': 'application/json' };
  if (prov.style === 'gemini') {
    url = prov.url.replace('{model}', model) + `?key=${key}`;
    body = { contents: [{ parts: [{ text: promptText }] }] };
  } else {
    body = { model, messages: [{ role: 'user', content: promptText }], temperature };
    headers.Authorization = `Bearer ${key}`;
  }

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    const err = new Error(`HTTP ${resp.status} ${detail.slice(0, 200)}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  return extractText(prov.style, data);
}

// Runs one prompt through the provider/model rotation. Returns
// { text, source } where source is e.g. "groq:llama-3.3-70b-versatile".
// Throws if every configured provider/model failed (or none are configured).
export async function askAI(promptText, { temperature = 0.2 } = {}) {
  let lastError = 'no providers with a key configured';
  for (const prov of PROVIDERS) {
    const key = process.env[prov.keyEnv];
    if (!key) continue;
    for (const model of prov.models) {
      try {
        const text = await askOne(prov, model, promptText, key, temperature);
        return { text, source: `${prov.name}:${model}` };
      } catch (e) {
        lastError = `${prov.name}/${model}: ${e.message}`;
        // 401/403 means the key itself is bad — no point trying this
        // provider's other model, move straight to the next provider.
        if (e.status === 401 || e.status === 403) break;
      }
    }
  }
  throw new Error(`All AI providers unavailable (last: ${lastError})`);
}
