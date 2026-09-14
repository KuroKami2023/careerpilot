/**
 * Shared HTTP helpers for Vercel serverless functions.
 * Works with both Node req/res and edge-style handlers using req/res objects.
 */

export function setCors(req, res, methods = 'POST,OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function sendJson(res, status, obj) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

export function getClientIp(req) {
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return 'unknown';
}

export async function readJsonBody(req, maxBytes = 1_000_000) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (!req.body) return {};
      try {
        return JSON.parse(req.body);
      } catch {
        const err = new Error('Invalid JSON body');
        err.status = 400;
        err.publicMessage = 'Invalid JSON body.';
        throw err;
      }
    }
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    return {};
  }
  // Fallback: stream read
  const chunks = [];
  let size = 0;
  await new Promise((resolve, reject) => {
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        const err = new Error('Request body too large');
        err.status = 413;
        err.publicMessage = 'Request is too large.';
        reject(err);
        return;
      }
      chunks.push(c);
    });
    req.on('end', resolve);
    req.on('error', reject);
  });
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('Invalid JSON body');
    err.status = 400;
    err.publicMessage = 'Invalid JSON body.';
    throw err;
  }
}

export function toPublicError(err) {
  if (err && err.publicMessage) {
    return { status: err.status || 500, message: err.publicMessage };
  }
  const status = (err && err.status && Number.isInteger(err.status)) ? err.status : 500;
  if (status >= 400 && status < 500 && err && err.message) {
    return { status, message: err.message };
  }
  return { status: 500, message: 'Internal server error.' };
}

function asString(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.trim();
  return t.length > max ? t.slice(0, max) : t;
}

export function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.publicMessage = message;
  return err;
}

/** Validate resume extraction input. */
export function validateResumeInput(body) {
  const text = asString(body.resumeText, 60000);
  if (!text || text.length < 50) {
    throw badRequest('Provide resume text of at least 50 characters.');
  }
  return { resumeText: text };
}

/** Validate job analysis input. */
export function validateJobInput(body) {
  const description = asString(body.description, 60000);
  if (!description || description.length < 50) {
    throw badRequest('Provide a job description of at least 50 characters.');
  }
  return {
    description,
    title: asString(body.title, 200),
    company: asString(body.company, 200),
  };
}

/** Validate compatibility input (structured resume + job analysis, no raw secrets). */
export function validateCompatibilityInput(body) {
  if (!body || typeof body !== 'object') throw badRequest('Invalid request.');
  const resume = body.resume && typeof body.resume === 'object' ? body.resume : null;
  const job = body.jobAnalysis && typeof body.jobAnalysis === 'object' ? body.jobAnalysis : null;
  if (!resume) throw badRequest('Missing resume profile.');
  if (!job) throw badRequest('Missing job analysis. Analyze the job first.');
  return { resume, jobAnalysis: job };
}

/** Validate interview generation input. */
export function validateInterviewInput(body) {
  if (!body || typeof body !== 'object') throw badRequest('Invalid request.');
  const jobDescription = asString(body.jobDescription, 20000);
  if (!jobDescription || jobDescription.length < 20) {
    throw badRequest('Provide a job description (at least 20 characters).');
  }
  const missingSkills = Array.isArray(body.missingSkills)
    ? body.missingSkills.filter((s) => typeof s === 'string').map((s) => s.slice(0, 80)).slice(0, 30)
    : [];
  const roleTitle = asString(body.roleTitle, 200);
  const count = Number.isInteger(body.count) ? Math.min(Math.max(body.count, 3), 15) : 8;
  const includeSystemDesign = body.includeSystemDesign === true;
  const resumeSummary = asString(body.resumeSummary, 5000);
  return { jobDescription, missingSkills, roleTitle, count, includeSystemDesign, resumeSummary };
}

/** Validate answer-generation input. */
export function validateAnswerInput(body) {
  if (!body || typeof body !== 'object') throw badRequest('Invalid request.');
  const question = asString(body.question, 2000);
  if (!question) throw badRequest('Provide a question.');
  return {
    question,
    roleTitle: asString(body.roleTitle, 200),
    resumeSummary: asString(body.resumeSummary, 5000),
    category: asString(body.category, 40) || 'technical',
  };
}

/**
 * Safe URL validation for the job-import helper.
 * - http/https only, no credentials, no private hosts, max length guard.
 */
export function validateJobUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s || s.length > 2000) throw badRequest('Provide a valid job URL.');
  let u;
  try {
    u = new URL(s);
  } catch {
    throw badRequest('Provide a valid http(s) job URL.');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw badRequest('Only http(s) job URLs are supported.');
  }
  if (u.username || u.password) throw badRequest('URLs with credentials are not allowed.');
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host === '[::1]' ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw badRequest('Private/local URLs are not allowed.');
  }
  return u.toString();
}
