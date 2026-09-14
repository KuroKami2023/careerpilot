import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCompatibility, SCORE_WEIGHTS } from '../api/_lib/scoring.js';

const RESUME = {
  skills: ['JavaScript', 'React', 'Tailwind CSS', 'REST APIs', 'Git'],
  technologies: ['Vite', 'Supabase', 'PostgreSQL'],
  experience: [{ title: 'Frontend Engineer', company: 'Northwind', duration: '2022-2026', details: 'Built React dashboards with Recharts for 4 years. Integrated REST APIs.' }],
  education: [{ degree: 'B.S. Computer Science', school: 'OSU', year: '2020' }],
  projects: [{ name: 'ChartKit', description: 'Recharts wrapper', technologies: ['React', 'Recharts'] }],
};

const JOB = {
  required_skills: ['JavaScript', 'React', 'Tailwind CSS'],
  preferred_skills: ['Docker'],
  technologies: ['Vite', 'Supabase'],
  responsibilities: ['Build React dashboards', 'Integrate REST APIs'],
  experience_requirements: '3+ years frontend engineering',
  education_requirements: 'BS in Computer Science',
  keywords: ['react', 'javascript', 'dashboards'],
};

describe('compatibility scoring', () => {
  it('uses the fixed 40/25/15/10/10 weights', () => {
    assert.deepEqual(SCORE_WEIGHTS, { technical: 0.4, experience: 0.25, projects: 0.15, education: 0.1, keywords: 0.1 });
  });

  it('scores a strong overlap highly and never mentions hiring probability', () => {
    const c = computeCompatibility(RESUME, JOB);
    assert.ok(c.overall >= 60, `expected >= 60, got ${c.overall}`);
    assert.ok(c.breakdown.technical === 100);
    assert.ok(c.missing_skills.length === 0);
    const blob = JSON.stringify(c).toLowerCase();
    assert.ok(!blob.includes('chance of getting hired'));
    assert.ok(!blob.includes('likelihood of being hired'));
    assert.ok(!blob.includes('probability you will be hired'));
    assert.ok(c.disclaimer.toLowerCase().includes('not a probability'));
  });

  it('detects missing skills and recommends closing them', () => {
    const c = computeCompatibility(
      { ...RESUME, skills: ['JavaScript'], technologies: [] },
      JOB,
    );
    assert.ok(c.missing_skills.length > 0);
    assert.ok(c.recommendations.length > 0);
    assert.ok(c.overall < 80);
  });

  it('overall equals the weighted sum of dimensions', () => {
    const c = computeCompatibility(RESUME, JOB);
    const expected = Math.round(
      c.breakdown.technical * 0.4 + c.breakdown.experience * 0.25 + c.breakdown.projects * 0.15 + c.breakdown.education * 0.1 + c.breakdown.keywords * 0.1,
    );
    assert.equal(c.overall, expected);
  });

  it('handles empty job requirements gracefully', () => {
    const c = computeCompatibility(RESUME, { required_skills: [], technologies: [], responsibilities: [], keywords: [] });
    assert.ok(c.overall >= 0 && c.overall <= 100);
  });
});
