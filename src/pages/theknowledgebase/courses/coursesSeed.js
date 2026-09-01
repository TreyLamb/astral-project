// Initial course list, seeded once on first load (see coursesStorage.seed /
// coursesFirestore.seedIfEmpty). `term` and `color` are edit-once-seeded, not
// re-synced — this is a starting point, not content that gets pushed to an
// account that already customized it.
//
// SOURCE OF TRUTH: SupplementalCourseDocs/ClassSchedule_2026Fall.xlsx, sheet 2
// (the registrar's registered-course list). Corrected 2026-08-31 — the previous
// hand-written list was wrong three ways: it carried PHIL 2050G, which is not in
// the registration at all, and it was missing AERO 1430R and AERO 1100. Ten
// courses, 17.5 credit hours. Re-check this against the spreadsheet each term
// rather than editing it from memory.
//
// trackingLevel: 'full' expects real course material to arrive and be turned
// into study tools. 'light' is for the AERO commissioning-program classes —
// still tracked for the record, no content expected. Both are a starting guess,
// not a rule; toggle it per course from CoursesDashboard any time.

const COLORS = [
  'hsl(203, 68%, 55%)', 'hsl(150, 45%, 45%)', 'hsl(280, 40%, 55%)',
  'hsl(25, 70%, 50%)', 'hsl(340, 55%, 55%)', 'hsl(178, 45%, 42%)',
  'hsl(48, 65%, 48%)', 'hsl(255, 45%, 58%)', 'hsl(5, 60%, 55%)',
  'hsl(105, 38%, 45%)',
];

const RAW = [
  { code: 'AERO 1100', section: '418', title: 'DAF Professionalism A', credits: 1, crn: '33986', delivery: 'Face to Face', trackingLevel: 'light' },
  { code: 'AERO 1430R', section: '416', title: 'Air Force Physical Training', credits: 0.5, crn: '33993', delivery: 'Face to Face Lab', trackingLevel: 'light' },
  { code: 'AERO 1800R', section: '416', title: 'Officer Development', credits: 0.5, crn: '41554', delivery: 'Face to Face', trackingLevel: 'light' },
  { code: 'AERO 2000', section: '415', title: 'Leadership Laboratory 2A', credits: 0.5, crn: '12257', delivery: 'Face to Face Lab', trackingLevel: 'light' },
  { code: 'AERO 2100', section: '419', title: 'Team and Leadership Fundamentals A', credits: 1, crn: '34002', delivery: 'Face to Face', trackingLevel: 'light' },
  { code: 'CHEM 1210', section: '004', title: 'Principles of Chemistry I', credits: 4, crn: '36830', delivery: 'Face to Face', trackingLevel: 'full' },
  { code: 'ESFF 1120', section: 'X02', title: 'Principles of Fire and Emergency Services Safety and Survival', credits: 3, crn: '42835', delivery: 'Online', trackingLevel: 'full' },
  { code: 'ESMG 3200', section: 'X01', title: 'Health and Safety Program Management', credits: 3, crn: '23252', delivery: 'Online', trackingLevel: 'full' },
  { code: 'MICR 2060', section: 'X01', title: 'Microbiology for Health Professions', credits: 3, crn: '15476', delivery: 'Online', trackingLevel: 'full' },
  { code: 'MICR 2065', section: '211', title: 'Microbiology for Health Professions Laboratory', credits: 1, crn: '31041', delivery: 'Face to Face Lab', trackingLevel: 'full' },
];

export const SEED_COURSES = RAW.map((c, i) => ({
  id: `course-${c.code.toLowerCase().replace(/\s+/g, '-')}`,
  code: c.code,
  title: c.title,
  section: c.section,
  credits: c.credits,
  crn: c.crn,
  delivery: c.delivery,
  term: 'Fall 2026',
  trackingLevel: c.trackingLevel,
  color: COLORS[i % COLORS.length],
  createdAt: new Date(0).toISOString(),
}));

/** 17.5 — matches the registrar's own total. A mismatch means this list drifted. */
export const SEED_TOTAL_CREDITS = RAW.reduce((n, c) => n + c.credits, 0);
