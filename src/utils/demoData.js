/**
 * Synthetic demo data — no real personal information.
 * Lets users test every feature without uploading a real resume.
 */

export const DEMO_RESUMES = [
  {
    key: 'frontend',
    title: 'Demo — Frontend Engineer',
    raw_text: `Ava Martinez
Frontend Engineer — React, TypeScript-free JavaScript, design systems
Portland, OR · ava.martinez@example.com

SUMMARY
Frontend engineer with 4 years of experience building React single-page apps, design systems, and data dashboards. Strong in JavaScript, Vite, Tailwind CSS, REST integration, and accessibility.

SKILLS
JavaScript, React, React Router, Vite, Tailwind CSS, Recharts, REST APIs, Git, Jest, Accessibility (WCAG), Figma

EXPERIENCE
Frontend Engineer, Northwind Labs (2022–Present)
- Built customer dashboard in React + Recharts serving 20k monthly users; cut load time 35% with code splitting.
- Led migration to Vite + Tailwind design system across 3 apps.
- Integrated Supabase Auth and PostgreSQL-backed REST APIs.

Junior Web Developer, Brightline Studio (2020–2022)
- Shipped marketing sites and internal tools; improved Lighthouse scores from 62 to 91.

EDUCATION
B.S. Computer Science, Oregon State University (2020)

PROJECTS
ChartKit — open-source Recharts wrapper with accessible defaults (JavaScript, Vite).
ShiftPlanner — offline-first scheduling PWA with localStorage sync.

CERTIFICATIONS
AWS Certified Cloud Practitioner (2023)`,
    parsed: {
      name: 'Ava Martinez',
      summary:
        'Frontend engineer with 4 years of experience building React single-page apps, design systems, and data dashboards.',
      skills: ['JavaScript', 'React', 'React Router', 'Vite', 'Tailwind CSS', 'Recharts', 'REST APIs', 'Git', 'Jest', 'Accessibility (WCAG)', 'Figma'],
      experience: [
        {
          title: 'Frontend Engineer',
          company: 'Northwind Labs',
          duration: '2022–Present',
          details: 'Built customer dashboard in React + Recharts (20k MAU); cut load time 35%. Led Vite + Tailwind migration. Integrated Supabase Auth and PostgreSQL REST APIs.',
        },
        {
          title: 'Junior Web Developer',
          company: 'Brightline Studio',
          duration: '2020–2022',
          details: 'Shipped marketing sites and internal tools; Lighthouse 62 → 91.',
        },
      ],
      education: [{ degree: 'B.S. Computer Science', school: 'Oregon State University', year: '2020' }],
      projects: [
        { name: 'ChartKit', description: 'Open-source Recharts wrapper with accessible defaults.', technologies: ['JavaScript', 'Vite', 'Recharts'] },
        { name: 'ShiftPlanner', description: 'Offline-first scheduling PWA with localStorage sync.', technologies: ['JavaScript', 'PWA'] },
      ],
      certifications: ['AWS Certified Cloud Practitioner (2023)'],
      technologies: ['JavaScript', 'React', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Git'],
      confidence: 82,
    },
  },
  {
    key: 'backend',
    title: 'Demo — Backend Engineer (Node)',
    raw_text: `Daniel Okafor
Backend Engineer — Node.js, PostgreSQL, serverless APIs
Austin, TX · daniel.okafor@example.com

SUMMARY
Backend engineer with 5 years of experience designing Node.js REST APIs, PostgreSQL schemas, and serverless functions on Vercel. Focus on auth, rate limiting, and clean data models.

SKILLS
JavaScript, Node.js, Express, PostgreSQL, Supabase, Vercel Serverless Functions, Redis, Docker, REST API design, Jest

EXPERIENCE
Backend Engineer, Ledgerline (2021–Present)
- Designed PostgreSQL schema and RLS policies for multi-tenant SaaS; p95 API latency 180ms.
- Built Node.js ingestion pipeline processing 2M events/day with Redis queues.
- Added rate limiting and input validation across 40+ endpoints.

API Developer, CivicApps (2019–2021)
- Maintained Express services and Swagger docs; reduced 5xx rate by 60%.

EDUCATION
B.S. Software Engineering, UT Austin (2019)

PROJECTS
QueueLite — Redis-backed job queue demo with retries and DLQ (Node.js).
SchemaDoc — generates ER diagrams from PostgreSQL DDL.

CERTIFICATIONS
PostgreSQL Associate (2022)`,
    parsed: {
      name: 'Daniel Okafor',
      summary:
        'Backend engineer with 5 years of experience designing Node.js REST APIs, PostgreSQL schemas, and serverless functions.',
      skills: ['JavaScript', 'Node.js', 'Express', 'PostgreSQL', 'Supabase', 'Vercel Serverless Functions', 'Redis', 'Docker', 'REST API design', 'Jest'],
      experience: [
        {
          title: 'Backend Engineer',
          company: 'Ledgerline',
          duration: '2021–Present',
          details: 'PostgreSQL schema + RLS for multi-tenant SaaS; p95 180ms. Node.js pipeline at 2M events/day with Redis queues. Rate limiting + validation on 40+ endpoints.',
        },
        {
          title: 'API Developer',
          company: 'CivicApps',
          duration: '2019–2021',
          details: 'Maintained Express services and Swagger docs; cut 5xx rate 60%.',
        },
      ],
      education: [{ degree: 'B.S. Software Engineering', school: 'UT Austin', year: '2019' }],
      projects: [
        { name: 'QueueLite', description: 'Redis-backed job queue demo with retries and DLQ.', technologies: ['Node.js', 'Redis'] },
        { name: 'SchemaDoc', description: 'Generates ER diagrams from PostgreSQL DDL.', technologies: ['PostgreSQL', 'JavaScript'] },
      ],
      certifications: ['PostgreSQL Associate (2022)'],
      technologies: ['Node.js', 'PostgreSQL', 'Supabase', 'Vercel', 'Redis', 'Docker'],
      confidence: 85,
    },
  },
];

export const DEMO_JOBS = [
  {
    key: 'frontend-role',
    title: 'Frontend Engineer',
    company: 'Acme Analytics',
    location: 'Remote (US)',
    salary_text: '$120k–$150k',
    raw_description: `Acme Analytics is hiring a Frontend Engineer (mid-level, remote US) to build customer-facing dashboards.

Responsibilities:
- Build and maintain React single-page applications with React Router and Vite.
- Create data visualizations with Recharts and Tailwind CSS design-system components.
- Integrate REST APIs backed by PostgreSQL; handle loading, error, and empty states.
- Uphold WCAG 2.1 AA accessibility and improve Core Web Vitals.

Required skills:
- 3+ years professional JavaScript and React experience.
- Strong Tailwind CSS, REST API integration, Git.
- Experience with Supabase Auth or similar authentication.

Preferred skills:
- Recharts or D3, testing with Jest/Vitest, Figma handoff.
- PostgreSQL familiarity, Vercel deployment experience.

Experience: 3+ years frontend engineering. Education: BS in CS or equivalent practical experience.

Keywords: react, javascript, dashboards, data visualization, accessibility, rest api, tailwind, vite, supabase, git.`,
    analysis: {
      required_skills: ['JavaScript', 'React', 'Tailwind CSS', 'REST API integration', 'Git'],
      preferred_skills: ['Recharts', 'Jest', 'Figma', 'PostgreSQL', 'Vercel'],
      technologies: ['React', 'Vite', 'Tailwind CSS', 'Recharts', 'Supabase', 'PostgreSQL'],
      responsibilities: [
        'Build and maintain React SPAs with React Router and Vite',
        'Create Recharts data visualizations with design-system components',
        'Integrate PostgreSQL-backed REST APIs with robust UI states',
        'Uphold WCAG 2.1 AA and improve Core Web Vitals',
      ],
      experience_requirements: '3+ years professional frontend engineering with JavaScript and React.',
      education_requirements: 'BS in Computer Science or equivalent practical experience.',
      keywords: ['react', 'javascript', 'dashboards', 'data visualization', 'accessibility', 'rest api', 'tailwind', 'vite', 'supabase', 'git'],
      seniority: 'mid',
    },
  },
  {
    key: 'fullstack-role',
    title: 'Full-Stack Engineer (React + Node)',
    company: 'Brightpath Health',
    location: 'Hybrid — Denver, CO',
    salary_text: '$130k–$165k + equity',
    raw_description: `Brightpath Health seeks a Full-Stack Engineer to build privacy-aware patient tools.

Responsibilities:
- Ship React + Vite frontends and Node.js serverless APIs on Vercel.
- Model PostgreSQL schemas with Row Level Security for per-user data isolation.
- Implement Supabase Auth, rate limiting, and input validation on every endpoint.
- Design background-safe AI features with server-side API keys.

Required skills:
- 4+ years JavaScript across React and Node.js.
- PostgreSQL schema design, REST API design, authentication.
- Vercel serverless functions, Git.

Preferred skills:
- Supabase (Auth, Storage, RLS), Docker, Redis.
- AI API integration (structured JSON extraction), Recharts dashboards.
- System design for multi-tenant SaaS.

Experience: 4+ years full-stack. Education: BS in CS or equivalent experience.

Keywords: full-stack, react, node.js, postgresql, row level security, supabase auth, vercel, rest api, privacy, rate limiting.`,
    analysis: {
      required_skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'REST API design', 'Authentication', 'Git'],
      preferred_skills: ['Supabase', 'Docker', 'Redis', 'AI API integration', 'Recharts'],
      technologies: ['React', 'Vite', 'Node.js', 'Vercel', 'PostgreSQL', 'Supabase', 'Redis', 'Docker'],
      responsibilities: [
        'Ship React + Vite frontends and Node.js serverless APIs on Vercel',
        'Model PostgreSQL schemas with RLS for per-user isolation',
        'Implement Supabase Auth, rate limiting, input validation',
        'Design background-safe AI features with server-side keys',
      ],
      experience_requirements: '4+ years full-stack JavaScript (React + Node.js).',
      education_requirements: 'BS in CS or equivalent experience.',
      keywords: ['full-stack', 'react', 'node.js', 'postgresql', 'row level security', 'supabase auth', 'vercel', 'rest api', 'privacy', 'rate limiting'],
      seniority: 'mid',
    },
  },
];

export const DEMO_QUESTIONS = [
  { category: 'technical', question: 'Explain how you would structure a React dashboard that renders large Recharts datasets without jank.', skill_tag: 'React' },
  { category: 'technical', question: 'How do you handle loading, error, and empty states when integrating a paginated REST API?', skill_tag: 'REST APIs' },
  { category: 'missing_skill', question: 'You list limited Docker experience — walk me through containerizing a Node.js API for local development.', skill_tag: 'Docker' },
  { category: 'behavioral', question: 'Tell me about a time you disagreed with a designer or PM about scope. What did you do?', skill_tag: '' },
  { category: 'system_design', question: 'Design a per-user application tracker API with auth, RLS, and rate limiting. How do tables and endpoints look?', skill_tag: 'System design' },
  { category: 'role_specific', question: 'How would you implement Row Level Security so users only ever read their own resumes and applications?', skill_tag: 'PostgreSQL' },
];
