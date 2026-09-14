/**
 * Read resume text from an uploaded file in the browser.
 * - .txt / .md: read directly.
 * - .pdf: extract with a lightweight regex fallback is unreliable, so we
 *   return a signal asking the user to paste text (file is still stored).
 * - .doc/.docx: same paste fallback.
 */

export async function readResumeFileText(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
    return { text: await file.text(), needsPaste: false };
  }
  return { text: '', needsPaste: true };
}

export function validateResumeText(text) {
  const t = String(text || '').trim();
  if (t.length < 50) return 'Paste at least 50 characters of resume text so extraction has something to work with.';
  if (t.length > 60000) return 'Resume text is too long (60,000 character limit). Please shorten it.';
  return null;
}

export function validateJobDescription(text) {
  const t = String(text || '').trim();
  if (t.length < 50) return 'Paste at least 50 characters of the job description.';
  if (t.length > 60000) return 'Job description is too long (60,000 character limit).';
  return null;
}
