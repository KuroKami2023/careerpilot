/**
 * Centralized server-side NVIDIA client.
 *
 * Model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
 * Endpoint: https://integrate.api.nvidia.com/v1 (OpenAI-compatible)
 *
 * NEVER imported by frontend code. The key lives only in NVIDIA_API_KEY.
 * Handles: timeouts, retries (429/5xx), safe logging, JSON extraction.
 */

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const NVIDIA_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

const DEFAULT_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1200;

function getApiKey() {
  return process.env.NVIDIA_API_KEY || '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeLogError(stage, err, meta = {}) {
  const safeMeta = { ...meta };
  delete safeMeta.apiKey;
  delete safeMeta.prompt;
  const message = err && err.message ? err.message : String(err);
  const status = err && err.status ? ` status=${err.status}` : '';
  console.error(`[nvidia] ${stage} failed:${status} ${message}`, JSON.stringify(safeMeta).slice(0, 800));
}

function isRetryable(err) {
  if (err && err.name === 'AbortError') return true;
  const status = err && err.status;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500 && status < 600) return true;
  if (err && err.code && ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(err.code)) return true;
  return false;
}

/**
 * Extract the first plausible JSON object/array from model text.
 * Handles raw JSON, ```json fences, leading/trailing prose.
 */
export function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty model response');
  }
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  let start = -1;
  let endChar = '';
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    start = objStart;
    endChar = '}';
  } else if (arrStart !== -1) {
    start = arrStart;
    endChar = ']';
  }
  if (start === -1) throw new Error('Model response contained no JSON');
  const end = cleaned.lastIndexOf(endChar);
  if (end <= start) throw new Error('Model response contained no JSON');
  const candidate = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    const repaired = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error(`Model returned malformed JSON: ${err.message}`);
    }
  }
}

async function postChatCompletions({ messages, temperature = 0.2, maxTokens = 2048, timeoutMs }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error('NVIDIA_API_KEY is not configured on the server');
    err.status = 500;
    err.publicMessage = 'AI service is not configured. Set NVIDIA_API_KEY in server environment variables.';
    throw err;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      const err = new Error(`NVIDIA API error ${res.status}: ${bodyText.slice(0, 300)}`);
      err.status = res.status;
      err.publicMessage =
        res.status === 401 || res.status === 403
          ? 'AI service authentication failed. Check server API key configuration.'
          : res.status === 429
            ? 'AI service is rate-limited. Please retry shortly.'
            : 'AI service request failed. Please retry.';
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function getModelText(response) {
  const text = response?.choices?.[0]?.message?.content;
  if (typeof text === 'string' && text.trim()) return text;
  const reasoning = response?.choices?.[0]?.message?.reasoning_content;
  if (typeof reasoning === 'string' && reasoning.trim()) return reasoning;
  throw new Error('Model returned an empty response');
}

/**
 * Generic structured chat call: system + user → parsed JSON.
 */
export async function chatJson({ system, user, temperature = 0.2, maxTokens = 2048, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = MAX_RETRIES, logMeta = {} }) {
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const started = Date.now();
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await postChatCompletions({ messages, temperature, maxTokens, timeoutMs });
      const rawText = getModelText(response);
      const parsed = extractJson(rawText);
      return {
        data: parsed,
        usage: response?.usage || null,
        latencyMs: Date.now() - started,
        attempts: attempt + 1,
      };
    } catch (err) {
      lastErr = err;
      safeLogError(`chatJson attempt ${attempt + 1}`, err, logMeta);
      if (attempt < maxRetries && isRetryable(err)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      break;
    }
  }
  const finalErr = lastErr instanceof Error ? lastErr : new Error('AI request failed');
  if (!finalErr.publicMessage) finalErr.publicMessage = 'AI request failed. Please retry.';
  if (!finalErr.status) finalErr.status = 502;
  throw finalErr;
}

export const __internal = { isRetryable };
