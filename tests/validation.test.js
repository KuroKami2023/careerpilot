import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateResumeInput,
  validateJobInput,
  validateCompatibilityInput,
  validateInterviewInput,
  validateJobUrl,
} from '../api/_lib/validation.js';

describe('API input validation', () => {
  it('rejects short resume text', () => {
    assert.throws(() => validateResumeInput({ resumeText: 'tiny' }), /at least 50/);
    assert.ok(validateResumeInput({ resumeText: 'x'.repeat(100) }).resumeText.length === 100);
  });

  it('rejects short job descriptions', () => {
    assert.throws(() => validateJobInput({ description: 'short' }), /at least 50/);
  });

  it('requires resume + job analysis for compatibility', () => {
    assert.throws(() => validateCompatibilityInput({}), /resume/i);
    assert.throws(() => validateCompatibilityInput({ resume: {} }), /job analysis/i);
    assert.ok(validateCompatibilityInput({ resume: {}, jobAnalysis: {} }));
  });

  it('clamps interview count and cleans missing skills', () => {
    const v = validateInterviewInput({ jobDescription: 'x'.repeat(100), count: 99, missingSkills: ['Docker', 42, 'x'.repeat(200)] });
    assert.equal(v.count, 15);
    assert.ok(v.missingSkills.length === 2);
  });

  it('validates job URLs safely', () => {
    assert.ok(validateJobUrl('https://example.com/jobs/123').startsWith('https://'));
    assert.throws(() => validateJobUrl('ftp://example.com/x'), /http/);
    assert.throws(() => validateJobUrl('http://localhost:3000/x'), /Private/);
    assert.throws(() => validateJobUrl('http://192.168.1.1/x'), /Private/);
    assert.throws(() => validateJobUrl('http://user:pass@example.com/'), /credentials/);
    assert.throws(() => validateJobUrl('not a url'), /valid/);
  });
});
