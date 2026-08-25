// Initial course list, seeded once on first load (see coursesStorage.seed /
// coursesFirestore.seedIfEmpty). `term` and `color` are edit-once-seeded, not
// re-synced — this is a starting point, not content that gets pushed to an
// account that already customized it.
//
// trackingLevel: 'full' expects documents/assessments/pattern-analysis to get
// used. 'light' is for a course Trey said may not need any of that (the AERO
// commissioning-program classes) — still tracked for the transcript-adjacent
// record, just no content is expected. Both are a starting guess, not a rule;
// toggle it per course from CoursesDashboard any time.

const COLORS = [
  'hsl(203, 68%, 55%)', 'hsl(150, 45%, 45%)', 'hsl(280, 40%, 55%)',
  'hsl(25, 70%, 50%)', 'hsl(340, 55%, 55%)',
];

const RAW = [
  { code: 'MICR 2060', title: 'Microbiol for Health Prof', trackingLevel: 'full' },
  { code: 'ESMG 3200', title: 'Health Safety Program Mgmt', trackingLevel: 'full' },
  { code: 'PHIL 2050G', title: 'Ethics and Values', trackingLevel: 'full' },
  { code: 'ESFF 1120', title: 'Responder Safety and Survival', trackingLevel: 'full' },
  { code: 'AERO 2100', title: 'Team and Lead Fundamentals A', trackingLevel: 'light' },
  { code: 'CHEM 1210', title: 'Principles of Chem I', trackingLevel: 'full' },
  { code: 'AERO 1800R', title: 'Officer Development', trackingLevel: 'light' },
  { code: 'AERO 2000', title: 'Leadership Laboratory 2A', trackingLevel: 'light' },
  { code: 'MICR 2065', title: 'Microbiol for Health Prof Lab', trackingLevel: 'full' },
];

export const SEED_COURSES = RAW.map((c, i) => ({
  id: `course-${c.code.toLowerCase().replace(/\s+/g, '-')}`,
  code: c.code,
  title: c.title,
  term: 'Fall 2026',
  trackingLevel: c.trackingLevel,
  color: COLORS[i % COLORS.length],
  createdAt: new Date(0).toISOString(),
}));
