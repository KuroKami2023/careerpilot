export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Interview',
  'Technical Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

export const SCORE_WEIGHT_LABELS = [
  { key: 'technical', label: 'Technical Skills', weight: 40 },
  { key: 'experience', label: 'Experience', weight: 25 },
  { key: 'projects', label: 'Projects', weight: 15 },
  { key: 'education', label: 'Education', weight: 10 },
  { key: 'keywords', label: 'Keywords', weight: 10 },
];

export const QUESTION_CATEGORIES = ['technical', 'behavioral', 'system_design', 'missing_skill', 'role_specific'];

export const CATEGORY_LABELS = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  system_design: 'System Design',
  missing_skill: 'Missing Skill',
  role_specific: 'Role Specific',
};
