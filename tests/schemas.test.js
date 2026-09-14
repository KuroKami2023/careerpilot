import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanResumeExtraction, cleanJobAnalysis, cleanInterviewQuestions } from '../api/_lib/schemas.js';
import { extractJson } from '../api/_lib/nvidia.js';

describe('schema sanitization', () => {
  it('cleans resume extraction with dedupe and clamping', () => {
    const cleaned = cleanResumeExtraction({
      name: '  Ava  ',
      summary: 'Hi',
      skills: ['React', 'react', '  ', 42, 'Node.js'],
      experience: [{ title: 'Dev', company: 'X', duration: '2020', details: 'Did things' }],
      education: 'not-an-array',
      projects: [{ name: 'P', description: 'D', technologies: ['JS'] }],
      certifications: ['C1'],
      technologies: ['React'],
      confidence: 250,
    });
    assert.equal(cleaned.name, 'Ava');
    assert.deepEqual(cleaned.skills, ['React', 'Node.js']);
    assert.equal(cleaned.confidence, 100);
    assert.equal(cleaned.experience.length, 1);
    assert.deepEqual(cleaned.education, []);
  });

  it('cleans job analysis with safe defaults', () => {
    const cleaned = cleanJobAnalysis({ required_skills: ['JS'], responsibilities: 'nope' });
    assert.deepEqual(cleaned.required_skills, ['JS']);
    assert.deepEqual(cleaned.preferred_skills, []);
    assert.deepEqual(cleaned.responsibilities, []);
    assert.equal(cleaned.seniority, '');
  });

  it('cleans interview questions and coerces bad categories', () => {
    const cleaned = cleanInterviewQuestions({
      questions: [
        { category: 'technical', question: 'Q1', skill_tag: 'React' },
        { category: 'nonsense', question: 'Q2' },
        { category: 'behavioral', question: '   ' },
      ],
    }, 'behavioral');
    assert.equal(cleaned.length, 3);
    assert.equal(cleaned[0].category, 'technical');
    assert.equal(cleaned[1].category, 'behavioral');
    assert.ok(cleaned[2].question.length > 0);
  });
});

describe('nvidia JSON extraction', () => {
  it('parses fenced JSON', () => {
    const parsed = extractJson('Here you go:\n```json\n{"a":1}\n```\nDone.');
    assert.deepEqual(parsed, { a: 1 });
  });

  it('repairs trailing commas', () => {
    const parsed = extractJson('{"a":1,}');
    assert.deepEqual(parsed, { a: 1 });
  });

  it('throws on empty / non-JSON', () => {
    assert.throws(() => extractJson('   '), /Empty/);
    assert.throws(() => extractJson('no json here'), /no JSON/);
  });
});
