/**
 * Sanitize + normalize AI outputs into canonical shapes.
 * The frontend and database only ever consume these shapes.
 */

function str(v, max = 500) {
  if (typeof v !== 'string') return '';
  const t = v.trim();
  return t.length > max ? t.slice(0, max) : t;
}

function strArray(v, maxItems = 60, maxLen = 120) {
  if (!Array.isArray(v)) return [];
  const out = [];
  const seen = new Set();
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, maxLen));
    if (out.length >= maxItems) break;
  }
  return out;
}

function clampConfidence(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function cleanResumeExtraction(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const experience = Array.isArray(src.experience) ? src.experience.slice(0, 20).map((e) => {
    if (typeof e === 'string') return { title: e.slice(0, 200), company: '', duration: '', details: '' };
    const o = e && typeof e === 'object' ? e : {};
    return {
      title: str(o.title, 200),
      company: str(o.company, 200),
      duration: str(o.duration, 120),
      details: str(o.details || o.description, 1000),
    };
  }).filter((e) => e.title || e.company || e.details) : [];

  const education = Array.isArray(src.education) ? src.education.slice(0, 10).map((e) => {
    if (typeof e === 'string') return { degree: e.slice(0, 300), school: '', year: '' };
    const o = e && typeof e === 'object' ? e : {};
    return {
      degree: str(o.degree, 300),
      school: str(o.school, 300),
      year: str(o.year, 40),
    };
  }).filter((e) => e.degree || e.school) : [];

  const projects = Array.isArray(src.projects) ? src.projects.slice(0, 20).map((p) => {
    if (typeof p === 'string') return { name: p.slice(0, 200), description: '', technologies: [] };
    const o = p && typeof p === 'object' ? p : {};
    return {
      name: str(o.name, 200),
      description: str(o.description, 1000),
      technologies: strArray(o.technologies, 20, 80),
    };
  }).filter((p) => p.name || p.description) : [];

  return {
    name: str(src.name, 200),
    summary: str(src.summary, 2000),
    skills: strArray(src.skills, 80, 80),
    experience,
    education,
    projects,
    certifications: strArray(src.certifications, 30, 200),
    technologies: strArray(src.technologies, 60, 80),
    confidence: clampConfidence(src.confidence),
  };
}

export function cleanJobAnalysis(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    required_skills: strArray(src.required_skills, 60, 80),
    preferred_skills: strArray(src.preferred_skills, 60, 80),
    technologies: strArray(src.technologies, 60, 80),
    responsibilities: strArray(src.responsibilities, 30, 300),
    experience_requirements: str(src.experience_requirements, 1000),
    education_requirements: str(src.education_requirements, 1000),
    keywords: strArray(src.keywords, 60, 60),
    seniority: str(src.seniority, 60),
  };
}

export function cleanInterviewQuestions(raw, fallbackCategory = 'technical') {
  const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.questions) ? raw.questions : []);
  const allowed = new Set(['technical', 'behavioral', 'system_design', 'missing_skill', 'role_specific']);
  return list.slice(0, 15).map((q, i) => {
    const o = q && typeof q === 'object' ? q : {};
    const category = typeof o.category === 'string' && allowed.has(o.category) ? o.category : fallbackCategory;
    return {
      category,
      question: str(o.question, 800) || `Interview question ${i + 1}`,
      skill_tag: str(o.skill_tag || o.skill, 80),
      sort_order: i,
    };
  }).filter((q) => q.question);
}
