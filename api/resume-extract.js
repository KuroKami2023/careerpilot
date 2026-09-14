/**
 * POST /api/resume-extract
 * Body: { resumeText }
 * Server-only NVIDIA call → canonical resume extraction JSON.
 */
import { chatJson } from './_lib/nvidia.js';
import { cleanResumeExtraction } from './_lib/schemas.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateResumeInput,
} from './_lib/validation.js';

const SYSTEM_PROMPT = `You are a resume information extraction engine. Read the resume text and return ONLY valid JSON — no markdown, no code fences, no commentary.

Required JSON shape (exactly these keys):
{
  "name": "",
  "summary": "",
  "skills": [],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": [],
  "technologies": [],
  "confidence": 0
}

Shapes:
- experience item: {"title":"","company":"","duration":"","details":""}
- education item: {"degree":"","school":"","year":""}
- projects item: {"name":"","description":"","technologies":[]}

Rules:
- NEVER invent values. Use "" / [] when unknown. confidence is 0-100.
- skills: concise skill names (e.g. "React", "SQL"). technologies: tools/platforms/languages/frameworks.
- Keep summary to 2-4 sentences paraphrased from the resume.
- Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `resume-extract:${getClientIp(req)}`, limit: 20, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  const started = Date.now();
  try {
    const body = await readJsonBody(req);
    const { resumeText } = validateResumeInput(body);
    const truncated = resumeText.length > 15000 ? `${resumeText.slice(0, 15000)}\n[...truncated]` : resumeText;

    const ai = await chatJson({
      system: SYSTEM_PROMPT,
      user: `Resume text to extract:\n\n${truncated}\n\nReturn ONLY the JSON object.`,
      temperature: 0.1,
      maxTokens: 2048,
      logMeta: { resumeLength: resumeText.length },
    });

    const cleaned = cleanResumeExtraction(ai.data);
    return sendJson(res, 200, {
      ok: true,
      extraction: cleaned,
      meta: { durationMs: Date.now() - started, aiLatencyMs: ai.latencyMs, attempts: ai.attempts },
    });
  } catch (err) {
    console.error('[api/resume-extract] failed:', err && err.message ? err.message : err);
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
