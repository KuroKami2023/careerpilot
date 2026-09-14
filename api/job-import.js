/**
 * POST /api/job-import
 * Body: { url }
 *
 * Fetches a PUBLIC job posting URL server-side and extracts readable text.
 * Safety rules:
 * - http(s) only, no credentials, no private/local hosts (validated)
 * - 10s timeout, 500KB cap, HTML only
 * - Sends a normal browser User-Agent, respects the response content type
 * - Never follows the page's JS or bypasses auth/paywalls/CAPTCHAs:
 *   on 401/403/429 or unusable content, returns an explicit
 *   "paste manually" signal instead of retrying aggressively.
 * - No scraping of arbitrary pages: single fetch, no crawling, no link following.
 */
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  setCors,
  getClientIp,
  readJsonBody,
  sendJson,
  toPublicError,
  validateJobUrl,
} from './_lib/validation.js';

const FETCH_TIMEOUT_MS = 10000;
const MAX_BYTES = 500 * 1024;

function decodeHtmlEntities(s) {
  return String(s)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCharCode(Number(n)); } catch { return ''; }
    });
}

function htmlToText(html) {
  let t = String(html || '');
  // Drop scripts, styles, nav/footer/aside, noscript
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  t = t.replace(/<aside[\s\S]*?<\/aside>/gi, ' ');
  t = t.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  // Prefer <article>/<main> content when present
  const article = t.match(/<article[\s\S]*?<\/article>/i);
  const main = t.match(/<main[\s\S]*?<\/main>/i);
  if (article) t = article[0];
  else if (main) t = main[0];
  // Title
  const titleMatch = t.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, ' ')).trim().slice(0, 300) : '';
  // Meta description
  const metaMatch = t.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  let metaDesc = '';
  if (metaMatch) {
    const c = metaMatch[0].match(/content=["']([\s\S]*?)["']/i);
    if (c) metaDesc = decodeHtmlEntities(c[1]).trim().slice(0, 500);
  }
  t = t.replace(/<[^>]+>/g, ' ');
  t = decodeHtmlEntities(t);
  t = t.replace(/[ \t\r]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (metaDesc && !t.includes(metaDesc.slice(0, 40))) {
    t = `${metaDesc}\n\n${t}`;
  }
  return { title, text: t.slice(0, 30000) };
}

export default async function handler(req, res) {
  if (setCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const rl = checkRateLimit({ key: `job-import:${getClientIp(req)}`, limit: 10, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  try {
    const body = await readJsonBody(req);
    const url = validateJobUrl(body.url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CareerPilotAI/1.0; +job-import)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'blocked',
        message: 'That page blocks automated reads (login, paywall, or bot protection). Please paste the description manually — that always works.',
      });
    }
    if (!response.ok) {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'fetch_failed',
        message: `Could not read that page (HTTP ${response.status}). Please paste the description manually.`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!/html/i.test(contentType)) {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'unsupported_type',
        message: `That URL returned ${contentType || 'a non-HTML file'}. Please paste the description manually.`,
      });
    }

    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'too_large',
        message: 'That page is too large to import. Please paste the description manually.',
      });
    }

    const { title, text } = htmlToText(buf.toString('utf8'));
    if (!text || text.length < 200) {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'no_content',
        message: 'No readable job text was found (the page may render with JavaScript). Please paste the description manually.',
      });
    }

    return sendJson(res, 200, {
      ok: true,
      imported: true,
      title,
      description: text,
      sourceUrl: url,
    });
  } catch (err) {
    console.error('[api/job-import] failed:', err && err.message ? err.message : err);
    if (err && err.name === 'AbortError') {
      return sendJson(res, 200, {
        ok: true,
        imported: false,
        reason: 'timeout',
        message: 'That page took too long to respond. Please paste the description manually.',
      });
    }
    const pub = toPublicError(err);
    return sendJson(res, pub.status, { ok: false, error: pub.message });
  }
}
