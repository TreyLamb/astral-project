// The recurring Fall 2026 class week, transcribed from Trey's own spreadsheet:
//   G:\My Drive\SupplementalCourseDocs\ClassSchedule_2026Fall22.xlsx  →  "Template" sheet
//
// The workbook has three sheets. "Template" is the clean recurring week and is the ONLY one
// transcribed here. "9.1-9.8" is the same grid with one week's scribbles on it (dates, a
// retreat, a pasted assignment list); "Summary" is an AFROTC onboarding checklist. Neither
// is a schedule, so neither is here.
//
// Times and colours are taken from the file rather than re-derived: the grid runs 4am–11pm in
// 30-minute rows (Excel rows 3–42, two per hour), and each colour is the cell's own fill.
// Matching the spreadsheet is the point — if it changes, change this, don't "improve" it.

/** Excel's grid bounds. Row 3 = 4am, two rows per hour, last row 42 = 11:30pm. */
export const GRID_START_HOUR = 4;
export const GRID_END_HOUR = 24;
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
export const SLOT_COUNT = (GRID_END_HOUR - GRID_START_HOUR) * SLOTS_PER_HOUR;

export const TERM_TITLE = 'Class Schedule for 2026 Fall';
export const SOURCE_FILE = 'ClassSchedule_2026Fall22.xlsx — “Template” sheet';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// `course` is the registrar code this block belongs to, where the spreadsheet's short label
// maps to one unambiguously ("Chem I" → CHEM 1210, "Micro Lab" → MICR 2065). It's what lets a
// block line up with the Canvas coursework the rest of the app already knows about. MICR 2060
// is asynchronous online and correctly has no block at all.
export const CLASS_BLOCKS = [
  { id: 'pt-tue', day: 2, start: '06:00', end: '07:00', title: 'Air Force : PT', code: 'AERO 1430R', room: '416', color: '#8FCB6E' },
  { id: 'offdev-wed', day: 3, start: '06:00', end: '07:00', title: 'Officer Development', code: 'AERO 1800R', room: '416', color: '#9DB4E8' },
  { id: 'pt-thu', day: 4, start: '06:00', end: '07:00', title: 'Air Force : PT', code: 'AERO 1430R', room: '416', color: '#8FCB6E' },
  { id: 'daf-thu', day: 4, start: '08:00', end: '09:00', title: 'DAF Professionalism A', code: 'AERO 1100', room: '418', color: '#A98FD2' },
  { id: 'tlf-thu', day: 4, start: '09:00', end: '10:00', title: 'Team & Leadership Fundamentals', code: 'AERO 2100', room: '419', color: '#B7A6E0' },
  { id: 'llab-thu', day: 4, start: '11:00', end: '13:00', title: 'Leadership Lab 2A', code: 'AERO 2000', room: '415', color: '#D9628F' },
  { id: 'chem-mon', day: 1, start: '13:00', end: '14:00', title: 'Chem I', course: 'CHEM 1210', color: '#6ED6D0' },
  { id: 'chem-tue', day: 2, start: '13:00', end: '14:00', title: 'Chem I', course: 'CHEM 1210', color: '#6ED6D0' },
  { id: 'chem-wed', day: 3, start: '13:00', end: '14:00', title: 'Chem I', course: 'CHEM 1210', color: '#6ED6D0' },
  { id: 'chem-thu', day: 4, start: '13:00', end: '14:00', title: 'Chem I', course: 'CHEM 1210', color: '#6ED6D0' },
  { id: 'microlab-thu', day: 4, start: '16:00', end: '18:00', title: 'Micro Lab', course: 'MICR 2065', color: '#C68B59' },
];

/** Excel's own font colour on every coloured block (styles.xml font rgb FF1A1A1A). */
export const BLOCK_TEXT = '#1a1a1a';

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 0-based slot row for a "HH:MM", relative to the 4am top of the grid. */
export function slotIndex(hhmm) {
  return (toMinutes(hhmm) - GRID_START_HOUR * 60) / SLOT_MINUTES;
}

export function slotSpan(block) {
  return slotIndex(block.end) - slotIndex(block.start);
}

/** "6am", "12pm", "1pm" — the spreadsheet's own gutter labels. */
export function hourLabel(hour24) {
  if (hour24 === 0) return '12am';
  if (hour24 === 12) return '12pm';
  return hour24 < 12 ? `${hour24}am` : `${hour24 - 12}pm`;
}

/** "6am - 7am", or "12:30pm - 1pm" when a block doesn't land on the hour. */
export function timeRange(block) {
  const fmt = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const base = hourLabel(h);
    return m === 0 ? base : `${base.replace(/(am|pm)$/, '')}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
  };
  return `${fmt(block.start)} - ${fmt(block.end)}`;
}

export const blocksForDay = (day) => CLASS_BLOCKS.filter((b) => b.day === day);

/** Every distinct class, for a legend — one entry per title, with the days it meets. */
export function classLegend() {
  const map = new Map();
  for (const b of CLASS_BLOCKS) {
    if (!map.has(b.title)) map.set(b.title, { ...b, days: [] });
    map.get(b.title).days.push(b.day);
  }
  return [...map.values()];
}

/** Weekly contact hours, which the spreadsheet never totals but is the obvious question. */
export function weeklyHours() {
  return CLASS_BLOCKS.reduce((n, b) => n + (toMinutes(b.end) - toMinutes(b.start)) / 60, 0);
}
