import { sendJson } from './_lib/validation.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }
  return sendJson(res, 200, {
    ok: true,
    service: 'careerpilot-ai',
    ai_model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    ai_configured: Boolean(process.env.NVIDIA_API_KEY),
    time: new Date().toISOString(),
  });
}
