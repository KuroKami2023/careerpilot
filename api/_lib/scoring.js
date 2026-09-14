/**
 * Transparent compatibility scoring — shared by the API and the frontend.
 *
 * Weights (fixed, shown in the UI):
 *   Technical Skills 40% | Experience 25% | Projects 15% | Education 10% | Keywords 10%
 *
 * IMPORTANT: the result is a SKILL/REQUIREMENT OVERLAP score, not a hiring
 * probability. All labels must say "match"/"compatibility", never
 * "chance of getting hired" or similar.
 */

export const SCORE_WEIGHTS = {
  technical: 0.4,
  experience: 0.25,
  projects: 0.15,
  education: 0.1,
  keywords: 0.1,
};

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function toSet(list) {
  const set = new Set();
  for (const item of Array.isArray(list) ? list : []) {
    const n = norm(item);
    if (n) set.add(n);
  }
  return set;
}

/** Overlap ratio: |A ∩ B| / |B| (0 when B is empty). Fuzzy: substring either way. */
function overlapRatio(haveList, needList) {
  const have = Array.isArray(haveList) ? haveList.map(norm).filter(Boolean) : [];
  const need = Array.isArray(needList) ? needList.map(norm).filter(Boolean) : [];
  if (need.length === 0) return { ratio: 1, matched: [], missing: [] };
  const matched = [];
  const missing = [];
  for (const n of need) {
    const hit = have.find((h) => h === n || (h.length > 2 && n.length > 2 && (h.includes(n) || n.includes(h))));
    if (hit) matched.push(n);
    else missing.push(n);
  }
  // De-dupe preserving order
  const uniq = (arr) => [...new Set(arr)];
  return { ratio: matched.length / need.length, matched: uniq(matched), missing: uniq(missing) };
}

function experienceText(resume) {
  const parts = [];
  for (const e of resume.experience || []) {
    if (typeof e === 'string') parts.push(e);
    else if (e && typeof e === 'object') parts.push(`${e.title || ''} ${e.company || ''} ${e.details || ''}`);
  }
  return parts.join('\n').toLowerCase();
}

function scoreExperience(resume, job) {
  const text = experienceText(resume);
  const req = String(job.experience_requirements || '').toLowerCase();
  // Years-of-experience heuristic: compare largest mentioned YoE numbers
  const yearsOf = (t) => {
    const m = String(t).match(/(\d+)\s*\+?\s*(years?|yrs?)/i);
    return m ? Number(m[1]) : null;
  };
  const haveYears = yearsOf(text);
  const needYears = yearsOf(req);
  let yearsScore = 0.5;
  if (needYears == null) yearsScore = text.length > 200 ? 0.7 : 0.4;
  else if (haveYears == null) yearsScore = text.length > 200 ? 0.5 : 0.3;
  else yearsScore = Math.min(1, haveYears / needYears);

  // Responsibility keyword coverage inside experience text
  const resp = Array.isArray(job.responsibilities) ? job.responsibilities : [];
  let cover = 0.5;
  if (resp.length > 0) {
    let hits = 0;
    for (const r of resp) {
      const words = norm(r).split(/[^a-z0-9+#.]+/).filter((w) => w.length > 3);
      const key = words.slice(0, 4);
      if (key.some((w) => text.includes(w))) hits += 1;
    }
    cover = hits / resp.length;
  }
  return Math.round(((yearsScore * 0.6 + cover * 0.4) * 100));
}

function scoreProjects(resume, job) {
  const techs = new Set([...toSet(resume.technologies), ...toSet((resume.projects || []).flatMap((p) => (p && p.technologies) || []))]);
  const need = toSet([...(job.technologies || []), ...(job.required_skills || [])]);
  if (need.size === 0) return 70;
  let hits = 0;
  for (const n of need) {
    for (const h of techs) {
      if (h === n || (h.length > 2 && n.length > 2 && (h.includes(n) || n.includes(h)))) { hits += 1; break; }
    }
  }
  const coverage = hits / need.size;
  const countBonus = Math.min(1, (resume.projects || []).length / 3);
  return Math.round((coverage * 0.8 + countBonus * 0.2) * 100);
}

function scoreEducation(resume, job) {
  const req = norm(job.education_requirements);
  if (!req) return 70;
  const eduText = (resume.education || []).map((e) => (typeof e === 'string' ? e : `${e.degree || ''} ${e.school || ''}`)).join(' ').toLowerCase();
  if (!eduText.trim()) return 30;
  const levels = ['phd', 'doctorate', 'master', 'bachelor', 'associate', 'diploma', 'degree'];
  const reqLevel = levels.find((l) => req.includes(l));
  if (!reqLevel) return eduText.length > 10 ? 70 : 40;
  return eduText.includes(reqLevel) ? 85 : 45;
}

export function computeCompatibility(resume, jobAnalysis) {
  const r = resume || {};
  const j = jobAnalysis || {};

  const resumeSkills = [...(r.skills || []), ...(r.technologies || [])];
  const requiredSkills = [...(j.required_skills || []), ...(j.technologies || [])];
  const techOverlap = overlapRatio(resumeSkills, requiredSkills);
  const technical = Math.round(techOverlap.ratio * 100);

  const keywordOverlap = overlapRatio(resumeSkills, j.keywords || []);
  const keywords = Math.round(keywordOverlap.ratio * 100);

  const experience = scoreExperience(r, j);
  const projects = scoreProjects(r, j);
  const education = scoreEducation(r, j);

  const overall = Math.round(
    technical * SCORE_WEIGHTS.technical +
    experience * SCORE_WEIGHTS.experience +
    projects * SCORE_WEIGHTS.projects +
    education * SCORE_WEIGHTS.education +
    keywords * SCORE_WEIGHTS.keywords,
  );

  const matching = techOverlap.matched;
  const missing = techOverlap.missing;
  const strong = matching.slice(0, 8);
  // Weak matches: preferred skills the user lacks
  const prefOverlap = overlapRatio(resumeSkills, j.preferred_skills || []);
  const weak = prefOverlap.missing.slice(0, 8);

  const recommendations = buildRecommendations({ missing: techOverlap.missing, weak, experience, projects, education, keywords });

  return {
    overall,
    breakdown: { technical, experience, projects, education, keywords },
    weights: { technical: 40, experience: 25, projects: 15, education: 10, keywords: 10 },
    matching_skills: matching,
    missing_skills: missing,
    strong_matches: strong,
    weak_matches: weak,
    recommendations,
    disclaimer: 'Skill/requirement overlap only — not a probability of getting hired.',
  };
}

function buildRecommendations({ missing, weak, experience, projects, education, keywords }) {
  const recs = [];
  if (missing.length > 0) {
    recs.push(`Close the top skill gaps first: ${missing.slice(0, 3).join(', ')}. Add a small project or certification for each.`);
  }
  if (weak.length > 0) {
    recs.push(`Preferred (bonus) skills you lack: ${weak.slice(0, 3).join(', ')} — mentioning any exposure helps.`);
  }
  if (experience < 60) {
    recs.push('Mirror the job\'s responsibility language in your experience bullets with measurable outcomes.');
  }
  if (projects < 60) {
    recs.push('Add 1–2 projects using the job\'s core technologies and link code/live demos.');
  }
  if (education < 60) {
    recs.push('Address the education requirement explicitly (degree, relevant coursework, or equivalent experience).');
  }
  if (keywords < 60) {
    recs.push('Weave the job\'s keywords naturally into your summary and skills (no keyword stuffing).');
  }
  if (recs.length === 0) {
    recs.push('Strong overlap — tailor your summary to this role and quantify recent achievements.');
  }
  return recs.slice(0, 6);
}
