/**
 * POST /api/compatibility
 * Body: { resume, jobAnalysis }
 *
 * Deterministic transparent scoring (no AI needed):
 *   Technical 40% | Experience 25% | Projects 15% | Education 10% | Keywords 10%
 * The result is a skill/requirement overlap score — NEVER a hiring probability.
 */
import { computeCompatibility } from './_lib/scoring.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateCompatibilityInput,
} from './_lib/validation.js';

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `compatibility:${getClientIp(req)}`, limit: 60, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  try {
    const body = await readJsonBody(req);
    const { resume, jobAnalysis } = validateCompatibilityInput(body);
    const result = computeCompatibility(resume, jobAnalysis);
    return sendJson(res, 200, { ok: true, compatibility: result });
  } catch (err) {
    console.error('[api/compatibility] failed:', err && err.message ? err.message : err);
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
