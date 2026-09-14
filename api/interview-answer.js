/**
 * POST /api/interview-answer
 * Body: { question, roleTitle?, resumeSummary?, category? }
 * Server-only NVIDIA call → sample answer + improvement suggestions for ONE question.
 */
import { chatJson } from './_lib/nvidia.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateAnswerInput,
} from './_lib/validation.js';

const SYSTEM_PROMPT = `You are an interview coach. For the given interview question, return ONLY valid JSON — no markdown, no code fences, no commentary.

Required shape:
{ "sample_answer": "", "improvement_tips": "" }

Rules:
- sample_answer: a strong 120-220 word example answer a candidate could adapt (STAR structure for behavioral questions).
- improvement_tips: 2-4 concise actionable bullets as a single string (newline separated), focused on structure, specifics, and what interviewers listen for.
- Tailor to the role; keep it honest (no fabricated credentials, no advice to lie).
- Return ONLY the JSON object.`;

function cleanAnswer(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const sample = typeof src.sample_answer === 'string' ? src.sample_answer.trim().slice(0, 4000) : '';
  const tips = typeof src.improvement_tips === 'string' ? src.improvement_tips.trim().slice(0, 3000) : '';
  if (!sample) throw new Error('Model returned no sample answer');
  return { sample_answer: sample, improvement_tips: tips };
}

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `interview-answer:${getClientIp(req)}`, limit: 20, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  try {
    const body = await readJsonBody(req);
    const input = validateAnswerInput(body);

    const ai = await chatJson({
      system: SYSTEM_PROMPT,
      user: [
        `Role: ${input.roleTitle || 'unspecified'} (question type: ${input.category})`,
        input.resumeSummary ? `Candidate background: ${input.resumeSummary.slice(0, 1200)}` : null,
        `Question: ${input.question}`,
        'Return ONLY the JSON object.',
      ].filter(Boolean).join('\n\n'),
      temperature: 0.4,
      maxTokens: 1500,
      logMeta: { category: input.category },
    });

    return sendJson(res, 200, { ok: true, ...cleanAnswer(ai.data) });
  } catch (err) {
    console.error('[api/interview-answer] failed:', err && err.message ? err.message : err);
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
