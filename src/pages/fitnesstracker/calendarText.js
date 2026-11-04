// How text and colour are written on MFT calendar chips. PREFERENCES.md is the why; this is the how.
// Pure, no imports, so the tests and node scripts can load it. Every rule exists because Trey
// complained about a real chip (2026-11-03). Full text always survives in the hover tooltip.

// Real acronyms and course codes that stay upper case. Anything else of 4+ capitals is shouting.
const KEEP_CAPS = new Set([
  'CHEM', 'MICR', 'ESFF', 'ESMG', 'AERO', 'AEROS', 'AFROTC', 'ROTC', 'ODC', 'OPORD', 'TBAS', 'LLAB',
  'DUE', 'ACS', 'ORI', 'OLQ', 'AIWP', 'MMAHP', 'M2OS', 'XLIST', 'DODMERB', 'AFOQT', 'UVU', 'BYU', 'TBC', 'PFRA',
]);

const DURATION_PAREN = /\s*\([^()]*\b\d+\s*[- ]?\s*(?:min(?:ute)?s?|hrs?|hours?)\b[^()]*\)/gi;
const SECTION_PAREN = /\s*\([^()]*\b(?:Ch|Chs|Sec|Lab|Chapter|Section)\.?\s?\d[^()]*\)/gi;
const NUMERIC_RANGE_PAREN = /\s*\(\s*\d+-\d+(?:\s*(?:to|,|&|\/)\s*\d+-\d+)*\s*\)/g;
const SCORE_PAREN = /\s*\([^()]*(?:\d+\/\d+|\d+%)[^()]*\)/g;
const TOOL_PAREN = /\s*\((?:Learning Suite|Canvas|Teams|Remotely Proctored)\)/gi;
const LONG_PAREN_AT = 24;

function capitalise(word) {
  return word[0] + word.slice(1).toLowerCase();
}

/** The one-line form of a title for a calendar chip. */
export function tidyTitle(raw) {
  if (!raw) return '';
  let s = String(raw);
  s = s.replace(DURATION_PAREN, '')
    .replace(SECTION_PAREN, '')
    .replace(NUMERIC_RANGE_PAREN, '')
    .replace(SCORE_PAREN, '')
    .replace(TOOL_PAREN, '')
    .replace(/\s+on MMAHP.*$/i, '')
    .replace(/\s+this week\b/gi, '');

  // Spell out the shorthand that had to be explained to him once already.
  s = s.replace(/\bInit\.?\s*(\d+)\s*\+\s*(\d+)/gi, 'Initiatives $1 + $2')
    .replace(/\bInit\.?\s*(\d+)/gi, 'Initiative $1')
    .replace(/\bDB\s?(\d+)/g, 'Discussion Board $1')
    .replace(/\bQ(\d+)\b/g, 'Quiz $1')
    .replace(/\bA(\d+)\b/g, 'Assignment $1')
    .replace(/\bW(\d+)\b/g, 'Week $1')
    .replace(/#(?=\d)/g, '')
    .replace(/(\d)\+(\d)/g, '$1 + $2');

  // A long remark in brackets belongs in the tooltip, not on the chip.
  s = s.replace(/\s*\(([^()]*)\)/g, (m, inner) => (inner.length > LONG_PAREN_AT ? '' : m));

  // SHOUTING: keep real acronyms, tone the rest down (lower case right after a comma).
  s = s.replace(/(^|[(,]\s*|\s)([A-Z]{4,})\b/g, (m, lead, word) => {
    if (KEEP_CAPS.has(word)) return m;
    const afterBreak = /,\s*$/.test(lead);
    return lead + (afterBreak ? word.toLowerCase() : capitalise(word));
  });

  return s.replace(/\s{2,}/g, ' ').replace(/\s+([,:;])/g, '$1').replace(/\s*\+\s*$/, '').trim();
}

/** A Canvas item's name without the course code (the chip adds it) and without the topic subtitle. */
export function tidyCourseName(name) {
  let s = String(name || '')
    .replace(/^Take\s+/i, '')
    .replace(/\s+-\s+Paper$/i, '')
    .replace(/Pre-Lab Preparation Assignment/i, 'Pre-Lab');
  s = tidyTitle(s);
  const colon = s.indexOf(':');
  if (colon > 0 && /\d/.test(s.slice(0, colon))) s = s.slice(0, colon);
  return s.replace(/,\s*\d+-\d+(?:\s*(?:to|&)\s*\d+-\d+)?$/, '').trim();
}

/** "CHEM 1210 Quiz 21": the full course code in front of the tidy name. */
export function courseChipLabel(task) {
  const name = tidyCourseName(task.name);
  return name.startsWith(task.code) ? name : `${task.code} ${name}`;
}

/** A cross-listed shell ("2026-XLIST …") repeats a real course's item; keep only the real one. */
export function dedupeCrossListed(tasks) {
  if (!tasks || tasks.length < 2) return tasks;
  const key = (t) => tidyCourseName(t.name).toLowerCase();
  const real = new Set(tasks.filter((t) => !/XLIST/i.test(t.code)).map(key));
  return tasks.filter((t) => !/XLIST/i.test(t.code) || !real.has(key(t)));
}

// ── Colour: one meaning per colour ──────────────────────────────────────────────────────────────
const TITLE_COURSES = [
  [/\bCHEM 1210\b/, 'CHEM 1210'], [/\bMICR 2060\b/, 'MICR 2060'], [/\bMICR 2065\b/, 'MICR 2065'],
  [/\bESFF 1120\b/, 'ESFF 1120'], [/\bESMG 3200\b/, 'ESMG 3200'], [/\bAERO 2100\b|\bAEROS 210\b/, 'AERO 2100'],
  [/\bAERO 1100\b/, 'AERO 1100'],
];
export const courseInTitle = (title) => TITLE_COURSES.find(([re]) => re.test(title || ''))?.[1] ?? null;

export const COLOR_DUE = '#f87171';
export const COLOR_STAR = '#f8fafc';
export const COLOR_ROTC = '#38bdf8';

/**
 * The dot colour of a plan/overlay event. Courses keep ONE colour everywhere (the same one their
 * Canvas chips use), red always means something is due, ★ is white, and what is left falls back
 * to its kind. `colorOfCourse` is courseColor from the coursework model, injected to keep this pure.
 */
export function chipDotColor(ev, colorOfCourse, kindColors) {
  if (ev.calId !== 'plan') return ev.color;
  if (ev.kind === 'star') return COLOR_STAR;
  if (ev.kind === 'due') return COLOR_DUE;
  const course = courseInTitle(ev.title) ?? (ev.course && ev.course !== 'AFROTC' ? ev.course : null);
  if (course) return colorOfCourse(course);
  if (ev.course === 'AFROTC') return COLOR_ROTC;
  return kindColors[ev.kind] ?? ev.color;
}

/**
 * The text colour of a plan chip. A chip about a course is written in that course's colour, so it
 * matches the Canvas chip for the same course on that day and stands out among the white ones
 * (Trey, 2026-11-03). ROTC events are blue like the AERO classes. Null = leave it white: personal items
 * and lines that mix several courses.
 */
export function chipTextColor(ev, colorOfCourse) {
  if (ev.calId !== 'plan' || ev.kind === 'star') return null;
  const named = TITLE_COURSES.filter(([re]) => re.test(ev.title || '')).map(([, code]) => code);
  const courses = new Set(named.length ? named : (ev.course && ev.course !== 'AFROTC' ? [ev.course] : []));
  if (courses.size === 1) return colorOfCourse([...courses][0]);
  return !courses.size && ev.course === 'AFROTC' ? COLOR_ROTC : null;
}

/** The legend under the calendar: what each colour means. [colour key, label]; key is a course code, 'rotc' or 'due'. */
export const COLOR_LEGEND = [
  ['CHEM 1210', 'CHEM 1210'], ['MICR 2060', 'MICR 2060'], ['MICR 2065', 'MICR 2065 lab'],
  ['ESFF 1120', 'ESFF 1120'], ['ESMG 3200', 'ESMG 3200'], ['rotc', 'AERO + ROTC (blues)'], ['due', 'Due'],
];
