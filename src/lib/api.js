/**
 * Client for our own serverless API. Never sends secrets —
 * the NVIDIA key stays server-side in NVIDIA_API_KEY.
 */

async function parseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: 'Unexpected server response' };
  }
}

async function post(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseBody(res);
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

export async function extractResume(resumeText) {
  return post('/api/resume-extract', { resumeText });
}

export async function analyzeJob({ description, title = '', company = '' }) {
  return post('/api/job-analyze', { description, title, company });
}

export async function scoreCompatibility({ resume, jobAnalysis }) {
  return post('/api/compatibility', { resume, jobAnalysis });
}

export async function generateInterviewQuestions(payload) {
  return post('/api/interview-generate', payload);
}

export async function generateAnswer(payload) {
  return post('/api/interview-answer', payload);
}

export async function importJobUrl(url) {
  return post('/api/job-import', { url });
}

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return parseBody(res);
}
