/**
 * POST /api/interview-generate
 * Body: { jobDescription, missingSkills?, roleTitle?, resumeSummary?, count?, includeSystemDesign? }
 * Server-only NVIDIA call → list of interview questions (no answers yet).
 */
import { chatJson } from './_lib/nvidia.js';
import { cleanInterviewQuestions } from './_lib/schemas.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateInterviewInput,
} from './_lib/validation.js';

const SYSTEM_PROMPT = `You are an interview preparation coach. Given a job description (and missing skills), generate interview questions. Return ONLY valid JSON — no markdown, no code fences, no commentary.

Required shape:
{ "questions": [ {"category":"","question":"","skill_tag":""} ] }

Categories (use exactly these): "technical", "behavioral", "system_design", "missing_skill", "role_specific".

Rules:
- Mix categories: mostly technical + role_specific, 2-3 behavioral, include "missing_skill" questions for each listed missing skill (tagged with that skill), and "system_design" ONLY when relevant to the role (software/data/infra roles) or explicitly requested.
- Questions must be specific to THIS job description, not generic.
- No answers, no explanations — questions only.
- Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `interview:${getClientIp(req)}`, limit: 15, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  const started = Date.now();
  try {
    const body = await readJsonBody(req);
    const input = validateInterviewInput(body);

    const parts = [
      `Role: ${input.roleTitle || 'unspecified'}`,
      `Generate ${input.count} questions.`,
      `Include system design questions: ${input.includeSystemDesign ? 'yes' : 'only if clearly relevant to the role'}.`,
    ];
    if (input.missingSkills.length > 0) {
      parts.push(`Candidate's missing skills (probe at least one question per skill): ${input.missingSkills.join(', ')}`);
    }
    if (input.resumeSummary) {
      parts.push(`Candidate background (tailor difficulty, do not reveal private data): ${input.resumeSummary.slice(0, 1500)}`);
    }
    parts.push(`Job description:\n${input.jobDescription.slice(0, 12000)}`);
    parts.push('Return ONLY the JSON object.');

    const ai = await chatJson({
      system: SYSTEM_PROMPT,
      user: parts.join('\n\n'),
      temperature: 0.4,
      maxTokens: 2048,
      logMeta: { count: input.count },
    });

    const questions = cleanInterviewQuestions(ai.data).slice(0, input.count);
    return sendJson(res, 200, {
      ok: true,
      questions,
      meta: { durationMs: Date.now() - started, aiLatencyMs: ai.latencyMs, attempts: ai.attempts },
    });
  } catch (err) {
    console.error('[api/interview-generate] failed:', err && err.message ? err.message : err);
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
