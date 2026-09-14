/**
 * POST /api/job-analyze
 * Body: { description, title?, company? }
 * Server-only NVIDIA call → canonical job analysis JSON.
 */
import { chatJson } from './_lib/nvidia.js';
import { cleanJobAnalysis } from './_lib/schemas.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateJobInput,
} from './_lib/validation.js';

const SYSTEM_PROMPT = `You are a job description analysis engine. Read the job description and return ONLY valid JSON — no markdown, no code fences, no commentary.

Required JSON shape (exactly these keys):
{
  "required_skills": [],
  "preferred_skills": [],
  "technologies": [],
  "responsibilities": [],
  "experience_requirements": "",
  "education_requirements": "",
  "keywords": [],
  "seniority": ""
}

Rules:
- required_skills: must-have skills explicitly demanded. preferred_skills: nice-to-have / "bonus" / "preferred" items.
- technologies: concrete tools, languages, frameworks, platforms.
- responsibilities: 3-10 concise duty statements paraphrased from the posting.
- experience_requirements / education_requirements: short summaries ("" when not stated).
- keywords: important domain/role terms an ATS would look for (lowercase ok).
- seniority: one of "intern", "junior", "mid", "senior", "lead", "principal", "executive" or "" when unclear.
- NEVER invent requirements not supported by the text. Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `job-analyze:${getClientIp(req)}`, limit: 20, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  const started = Date.now();
  try {
    const body = await readJsonBody(req);
    const { description, title, company } = validateJobInput(body);
    const truncated = description.length > 15000 ? `${description.slice(0, 15000)}\n[...truncated]` : description;

    const ai = await chatJson({
      system: SYSTEM_PROMPT,
      user: `Role: ${title || 'unknown'} at ${company || 'unknown'}\n\nJob description:\n\n${truncated}\n\nReturn ONLY the JSON object.`,
      temperature: 0.1,
      maxTokens: 2048,
      logMeta: { descriptionLength: description.length },
    });

    const cleaned = cleanJobAnalysis(ai.data);
    return sendJson(res, 200, {
      ok: true,
      analysis: cleaned,
      meta: { durationMs: Date.now() - started, aiLatencyMs: ai.latencyMs, attempts: ai.attempts },
    });
  } catch (err) {
    console.error('[api/job-analyze] failed:', err && err.message ? err.message : err);
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
