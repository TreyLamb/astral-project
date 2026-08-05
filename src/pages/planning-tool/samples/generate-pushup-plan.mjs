// Generates samples/pushup-plan.xlsx — the mock workbook for the planning-tool
// dashboard feature (see PROMPT.md's "Requirement 6" and PROGRESS.md's
// verification discipline). Run with: node src/pages/planning-tool/samples/generate-pushup-plan.mjs
//
// Two-pass build, same reasoning as this project's own xlsxPatcher.js:
// SheetJS (community edition) writes a byte-valid workbook (values, shared
// strings, column widths, dimension refs) but silently drops cell styles on
// write (verified empirically — cellStyles:true has no effect in the free
// build). So pass 2 opens the SheetJS output with JSZip and hand-writes
// xl/styles.xml + per-cell `s` attributes using the exact same element-order
// and fill/font-append patterns already verified against real Excel COM in
// xlsxPatcher.js (STYLESHEET_CHILD_ORDER, solid patternFill + fgColor rgb +
// bgColor indexed=64, etc.) — reusing a known-good recipe instead of
// reinventing one from scratch.

import XLSX from 'xlsx';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

// ---------------------------------------------------------------------------
// 1. THE SCHEDULE — source of truth is training.md's actual dated Cycle 1 /
// Cycle 2 tables, corrected per the user's 2026-08-04 confirmation that
// there is only ONE Lift A (bench) per cycle, not two — cycle.md's template
// (and training.md's copy of it) showed Lift A on both D2 and D11 of the
// standard 13-day cycle, which contradicts training-context.md's own Rule 1
// ("3 lift days per cycle: Lift A, Lift B, Lift C"). Cycle 2's D11 is
// therefore plain Easy here, not "Easy + Lift A" — training.md itself still
// shows the old (2x Lift A) version as of this build; re-sync this generator
// once the docs land the fix.
const DAYS = [
  // Cycle 1 (Aug 2 - Aug 13, 2026) — one-time 12-day soft start, unchanged by the Lift-A correction.
  { cycle: 1, day: 1, date: '2026-08-02', label: 'Sun 8/2', session: 'Full rest from running + Lift A (chest/arms)', type: 'bench' },
  { cycle: 1, day: 2, date: '2026-08-03', label: 'Mon 8/3', session: 'Easy run', type: 'easy' },
  { cycle: 1, day: 3, date: '2026-08-04', label: 'Tue 8/4', session: 'Lift B (legs)', type: 'leg' },
  { cycle: 1, day: 4, date: '2026-08-05', label: 'Wed 8/5', session: 'Easy run', type: 'easy' },
  { cycle: 1, day: 5, date: '2026-08-06', label: 'Thu 8/6', session: 'Easy run', type: 'easy' },
  { cycle: 1, day: 6, date: '2026-08-07', label: 'Fri 8/7', session: 'Speed Day 1', type: 'speed' },
  { cycle: 1, day: 7, date: '2026-08-08', label: 'Sat 8/8', session: 'Easy recovery run', type: 'easy' },
  { cycle: 1, day: 8, date: '2026-08-09', label: 'Sun 8/9', session: 'Lift C (back) + Easy', type: 'back' },
  { cycle: 1, day: 9, date: '2026-08-10', label: 'Mon 8/10', session: 'Long run', type: 'long' },
  { cycle: 1, day: 10, date: '2026-08-11', label: 'Tue 8/11', session: 'Easy run', type: 'easy' },
  { cycle: 1, day: 11, date: '2026-08-12', label: 'Wed 8/12', session: 'Speed Day 2', type: 'speed' },
  { cycle: 1, day: 12, date: '2026-08-13', label: 'Thu 8/13', session: 'Full true rest', type: 'rest' },
  // Cycle 2 (Aug 14 - Aug 26, 2026) — standard 13-day template, corrected: single Lift A at D2, D11 is plain Easy.
  { cycle: 2, day: 1, date: '2026-08-14', label: 'Fri 8/14', session: 'Speed Day 1', type: 'speed' },
  { cycle: 2, day: 2, date: '2026-08-15', label: 'Sat 8/15', session: 'Easy run + Lift A (chest/arms)', type: 'bench' },
  { cycle: 2, day: 3, date: '2026-08-16', label: 'Sun 8/16', session: 'Easy run', type: 'easy' },
  { cycle: 2, day: 4, date: '2026-08-17', label: 'Mon 8/17', session: 'Lift B (legs)', type: 'leg' },
  { cycle: 2, day: 5, date: '2026-08-18', label: 'Tue 8/18', session: 'Easy run', type: 'easy' },
  { cycle: 2, day: 6, date: '2026-08-19', label: 'Wed 8/19', session: 'Easy run', type: 'easy' },
  { cycle: 2, day: 7, date: '2026-08-20', label: 'Thu 8/20', session: 'Lift C (back) + Easy', type: 'back' },
  { cycle: 2, day: 8, date: '2026-08-21', label: 'Fri 8/21', session: 'Easy run', type: 'easy' },
  { cycle: 2, day: 9, date: '2026-08-22', label: 'Sat 8/22', session: 'Easy run', type: 'easy' },
  { cycle: 2, day: 10, date: '2026-08-23', label: 'Sun 8/23', session: 'Speed Day 2', type: 'speed' },
  { cycle: 2, day: 11, date: '2026-08-24', label: 'Mon 8/24', session: 'Easy run (corrected: no 2nd Lift A)', type: 'easy' },
  { cycle: 2, day: 12, date: '2026-08-25', label: 'Tue 8/25', session: 'Long run', type: 'long' },
  { cycle: 2, day: 13, date: '2026-08-26', label: 'Wed 8/26', session: 'Full true rest', type: 'rest' },
];

// ---------------------------------------------------------------------------
// 2. ELIGIBILITY — pure rule engine over the continuous 25-day timeline (not
// reset per-cycle, so a bench/back day near a cycle boundary would still
// correctly exclude neighbors in the adjacent cycle; doesn't happen to bite
// in this window, but it's the more correct way to compute it).
//
// Rulings (see report for full reasoning):
//  - Bench (Lift A) window: 1 day before, the day itself, and 2 days after —
//    literal reading of "within 1 day before ... or 2 days afterwards", plus
//    the bench day itself (pushups ON chest day directly contradicts the
//    whole point of the buffer).
//  - Back (Lift C) window: 1 day before, the day itself, 1 day after —
//    literal reading of "not land on back days or the day before or after".
//  - Full true rest ("no exceptions" per cycle.md/training-context.md rule 6)
//    is EXCLUDED outright — a pushup set is still training, and the docs are
//    explicit "no exceptions". This is a ruling, not stated directly by the
//    user for pushups specifically — flagged in the report.
//  - Speed days are NOT excluded — no rule in the user's spec touches them,
//    and there's no stated physiological conflict the way there is with
//    lifting. Ruling, flagged in the report.
//  - Leg day (Lift B) is never outright excluded by name — it's allowed with
//    a time-of-day truncation (see TRUNCATION below) — but in both cycles as
//    currently templated, leg day always falls inside the bench+2 window
//    anyway, so the truncation rule is implemented generically but is
//    currently DORMANT (verified below, also stated in the report).
function computeEligibility(days) {
  const n = days.length;
  const excluded = new Map(); // index -> reason string
  const exclude = (i, reason) => { if (i >= 0 && i < n && !excluded.has(i)) excluded.set(i, reason); };

  days.forEach((d, i) => {
    if (d.type === 'bench') {
      exclude(i - 1, '1 day before bench (Lift A)');
      exclude(i, 'bench (Lift A) day itself');
      exclude(i + 1, '1 day after bench (Lift A)');
      exclude(i + 2, '2 days after bench (Lift A)');
    }
    if (d.type === 'back') {
      exclude(i - 1, '1 day before back (Lift C)');
      exclude(i, 'back (Lift C) day itself');
      exclude(i + 1, '1 day after back (Lift C)');
    }
  });
  // Full-rest exclusion applied last so it always wins as the stated reason
  // on a rest day even though rest days are never independently caught by
  // the bench/back windows in this particular schedule.
  days.forEach((d, i) => { if (d.type === 'rest') excluded.set(i, 'full true rest day — no exceptions'); });

  return days.map((d, i) => ({ ...d, excludedReason: excluded.get(i) || null, eligible: !excluded.has(i) }));
}

const scheduled = computeEligibility(DAYS);

// Sanity-check the "leg day rule is dormant" claim baked into the comments
// above — fails loudly (not silently) if a future edit to DAYS ever makes it
// fire, since the report's wording depends on this being true.
const legDayEligible = scheduled.some((d) => d.type === 'leg' && d.eligible);
if (legDayEligible) {
  console.warn('NOTE: a leg day is now eligible under current DAYS — the leg-day time-truncation rule is no longer dormant. Update the report/docs.');
}

// ---------------------------------------------------------------------------
// 3. PROGRESSION — level(d) = 15 + floor((d-1)/2); odd progression-day index
// = uniform (every set = level), even = alternating low/high (level,
// level+1, level, level+1, ...). Matches the user's own worked examples
// (day1 all 15, day2 15/16 alternating, day3 all 16, day4 16/17 alternating,
// day5 all 17) extended forward.
function levelForProgressionDay(d) {
  return 15 + Math.floor((d - 1) / 2);
}
function isAlternatingDay(d) {
  return d % 2 === 0;
}

// Reduced-set compensation ruling (6C): when a day's actual available slots
// (`availableSlots`) are fewer than the variant's normal max (`maxSlots` —
// due to a time-window truncation, e.g. the leg-day 4pm cutoff), the
// alternating low/high spread collapses to a UNIFORM pattern at the HIGH
// value (level+1) across all available slots — "for every set you lose, [the
// alternation collapses and] every other set gains a rep back, equally
// across sets" read literally. A day that was already uniform (odd
// progression day, no alternation to collapse) just runs fewer slots at the
// same level — nothing to "gain back". See report for the fuller reasoning
// and the alternative reading that was tried and rejected.
function repsForDay(progressionDayIdx, availableSlots, maxSlots) {
  const level = levelForProgressionDay(progressionDayIdx);
  const truncated = availableSlots < maxSlots;
  if (!isAlternatingDay(progressionDayIdx)) {
    return Array(availableSlots).fill(level);
  }
  if (truncated) {
    return Array(availableSlots).fill(level + 1);
  }
  return Array.from({ length: availableSlots }, (_, i) => (i % 2 === 0 ? level : level + 1));
}

// ---------------------------------------------------------------------------
// 4. TIME-SLOT VARIANTS (6B ambiguity: literal "every 3 hours from 10am
// until 8pm" = 4 sets; the user's own 6-value example patterns imply every 2
// hours = 6 sets. Default to the literal 3hr spec; ship the 2hr/6-set
// variant alongside it so the choice doesn't cost another round trip.)
const VARIANTS = {
  fourSet: { key: 'fourSet', label: '4-set • every 3 hrs (10a-7p, literal spec)', slots: ['10:00', '13:00', '16:00', '19:00'], legCutoffSlots: ['10:00', '13:00', '16:00'] },
  sixSet: { key: 'sixSet', label: '6-set • every 2 hrs (10a-8p, matches the 6-value examples)', slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], legCutoffSlots: ['10:00', '12:00', '14:00', '16:00'] },
};

let progressionCounter = 0;
const eligibleDays = scheduled.filter((d) => d.eligible);
eligibleDays.forEach((d, i) => { d.progressionDay = i + 1; });

function buildVariantRows(variant) {
  let cumulative = 0;
  return scheduled.map((d) => {
    if (!d.eligible) {
      return {
        ...d,
        reps: null,
        dayTotal: 0,
        cumulative,
        status: `Excluded — ${d.excludedReason}`,
      };
    }
    // Leg-day truncation is implemented generically even though it never
    // actually fires against the current DAYS table (every leg day falls
    // inside a bench+2 exclusion window in both cycles) — see the dormant
    // check above.
    const maxSlots = variant.slots.length;
    const availableSlots = d.type === 'leg' ? variant.legCutoffSlots.length : maxSlots;
    const reps = repsForDay(d.progressionDay, availableSlots, maxSlots);
    const dayTotal = reps.reduce((a, b) => a + b, 0);
    cumulative += dayTotal;
    return {
      ...d,
      reps,
      dayTotal,
      cumulative,
      status: `Eligible — pushup day ${d.progressionDay} of ${eligibleDays.length}`,
    };
  });
}

const fourSetRows = buildVariantRows(VARIANTS.fourSet);
const sixSetRows = buildVariantRows(VARIANTS.sixSet);

// ---------------------------------------------------------------------------
// 5. WEEKLY ROLLUP — calendar weeks Sun-Sat; Aug 2 2026 is itself a Sunday
// (matches Cycle 1 D1), so weeks align cleanly to the schedule with no
// remainder logic needed for week 1.
function weekIndexForDate(iso) {
  const start = new Date('2026-08-02T00:00:00Z');
  const d = new Date(iso + 'T00:00:00Z');
  return Math.floor((d - start) / (7 * 86400000));
}
const WEEK_LABELS = ['Aug 2 - Aug 8 (Cycle 1)', 'Aug 9 - Aug 15 (Cycle 1 -> 2)', 'Aug 16 - Aug 22 (Cycle 2)', 'Aug 23 - Aug 26 (Cycle 2, partial week)'];

function buildWeeklyRollup() {
  const weeks = WEEK_LABELS.map((label, i) => ({
    label, eligibleDays: 0, fourSetTotal: 0, sixSetTotal: 0,
  }));
  fourSetRows.forEach((row) => {
    const w = weekIndexForDate(row.date);
    if (row.eligible) { weeks[w].eligibleDays += 1; weeks[w].fourSetTotal += row.dayTotal; }
  });
  sixSetRows.forEach((row) => {
    const w = weekIndexForDate(row.date);
    if (row.eligible) weeks[w].sixSetTotal += row.dayTotal;
  });
  let c4 = 0, c6 = 0;
  return weeks.map((w) => {
    c4 += w.fourSetTotal; c6 += w.sixSetTotal;
    return { ...w, cumulative4: c4, cumulative6: c6 };
  });
}
const weeklyRollup = buildWeeklyRollup();

// ---------------------------------------------------------------------------
// 6. WORKBOOK ASSEMBLY (pass 1 — SheetJS, values + column widths only)
const wb = XLSX.utils.book_new();

function readmeSheet() {
  const lines = [
    ['Push-up Plan — Mock Dashboard Source Workbook'],
    [''],
    ['What this is', 'A mock push-up training plan built to prove out the planning-tool\'s new read-only Dashboard view (see PlanningToolApp.jsx). Covers Cycle 1 + Cycle 2 of the ACFT running plan (Aug 2 - Aug 26, 2026).'],
    ['Source of truth for the running schedule', 'src/pages/fitnesstracker/runningworkouts/training.md — this workbook mirrors its dated Cycle 1 / Cycle 2 tables, corrected for the single-Lift-A-per-cycle fix (see below). Re-generate this workbook (node generate-pushup-plan.mjs) if training.md changes.'],
    ['IMPORTANT — Lift A correction', 'training.md currently shows Lift A (bench) on BOTH Cycle 2 Day 2 and Day 11. Per user confirmation (2026-08-04) this is a documented bug — training-context.md\'s own Rule 1 says 3 lift days per cycle (one Lift A, one Lift B, one Lift C), not four. This workbook is built on ONE Lift A per cycle (Cycle 2 Day 11 is plain Easy). Re-sync once training.md lands the fix.'],
    [''],
    ['HARD RULES APPLIED TO PUSH-UP SCHEDULING'],
    ['No pushups within 1 day before, on, or 2 days after a bench (Lift A) day', 'Literal reading of the user\'s spec plus the bench day itself (doing pushups ON chest day defeats the point).'],
    ['No pushups within 1 day before, on, or 1 day after a back (Lift C) day', 'Literal reading of "not land on back days or the day before or after."'],
    ['No pushups on the full true rest day', 'Ruling: cycle.md/training-context.md both describe full rest as "no running, no lifting, no exceptions" — a pushup set is still training, so it\'s excluded too. Not explicitly stated by the user for pushups; flagged as a judgment call.'],
    ['Speed days ARE eligible for pushups', 'Ruling: no rule in the user\'s spec touches speed days, and there\'s no stated conflict the way there is with lifting.'],
    ['Leg day (Lift B): pushups allowed but must stop 3 hrs before a 7pm leg workout (last set <=4pm)', 'Implemented generically. In BOTH Cycle 1 and Cycle 2 as currently templated, leg day always falls 2 days after a bench day, which is already excluded outright — so this rule is currently DORMANT (never actually produces a truncated-but-eligible leg day in this schedule). Kept generic for when spacing changes.'],
    [''],
    ['THE SCARCITY / RELAXATION ANALYSIS'],
    ['Eligible days, current rules', `${eligibleDays.length} of 25 calendar days (Cycle 1: 5, Cycle 2: 5).`],
    ['Single biggest lever to gain more days back', 'Relax the back-day buffer from +/-1 day to "the back day itself only" (drop the day-before/day-after buffer). That alone regains 2 full, untruncated days per cycle (4 total across both cycles) vs. relaxing the bench 2-days-after rule to 1-day-after (regains only 1 day per cycle, and that day is a truncated leg day) or relaxing the full-rest exclusion (regains 1 day per cycle, untruncated, but overrides an explicit "no exceptions" rule). This is the user\'s call, not applied here — the workbook is built on the stated rules as-is.'],
    [''],
    ['SET-COUNT AMBIGUITY (two variants shipped, see the two Daily tabs)'],
    ['4-set / every 3 hrs (10am, 1pm, 4pm, 7pm)', 'DEFAULT — literal reading of "every 3 hours from 10am until 8pm".'],
    ['6-set / every 2 hrs (10am, 12pm, 2pm, 4pm, 6pm, 8pm)', 'Matches the 6-value example patterns (15,16,15,16,15,16). Shipped alongside so the choice doesn\'t cost another round trip.'],
    [''],
    ['PROGRESSION RULE'],
    ['Level for progression day d', 'level(d) = 15 + floor((d-1)/2)'],
    ['Odd progression days', 'Uniform — every set = level(d). (Day 1 = all 15, Day 3 = all 16, Day 5 = all 17, ...)'],
    ['Even progression days', 'Alternating — level(d), level(d)+1, repeating. (Day 2 = 15,16,15,16 ; Day 4 = 16,17,16,17 ; ...)'],
    [''],
    ['REDUCED-SET COMPENSATION RULE (for a truncated leg day, currently dormant — see above)'],
    ['Rule implemented', 'When fewer slots are available than the variant\'s normal max, an alternating day\'s low/high spread collapses into a UNIFORM pattern at the HIGH value (level+1) across every available slot. A uniform (odd) day just runs fewer slots at the same level — there\'s no alternation to "gain back".'],
    ['Why this reading over the literal total-preserving one', 'The user\'s own example ("15,16,15,16" -> "16,16,16,16") already shows a same-slot-count, uniform-high result rather than a smaller slot count with redistributed totals — a strict "preserve total volume across fewer sets" reading produces awkward, unstated fractional-remainder rules and doesn\'t match the example as cleanly. Flagged as an ambiguity ruling, not a literal derivation.'],
    [''],
    ['HOW TO LOAD THIS INTO THE PLANNING TOOL'],
    ['Local file', 'Open /planning-tool, click "Upload .xlsx", and select this file (samples/pushup-plan.xlsx in the repo, also served at /planning-tool-samples/pushup-plan.xlsx).'],
    ['One-click sample load', 'The planning tool\'s empty state also has a "Load push-up plan sample" button that fetches this exact file from public/ and opens it directly — no manual file hunting needed.'],
    ['Dashboard view', 'Once loaded, click "Dashboard view" in the toolbar to see the read-only KPI/chart dashboard built for this feature (works for any saved workbook, not just this one).'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(lines);
  ws['!cols'] = [{ wch: 46 }, { wch: 110 }];
  return ws;
}

function dailySheetRows(rows, variant) {
  const header = ['Date', 'Cycle', 'Cycle Day', 'Session', 'Pushup Status', ...variant.slots, 'Day Total', 'Cumulative Total'];
  const body = rows.map((r) => {
    const slotVals = variant.slots.map((slot, i) => (r.reps && i < r.reps.length ? r.reps[i] : (r.reps ? '-' : '')));
    return [r.label, `Cycle ${r.cycle}`, `D${r.day}`, r.session, r.status, ...slotVals, r.eligible ? r.dayTotal : 0, r.eligible ? r.cumulative : r.cumulative];
  });
  return [header, ...body];
}

function weeklySheet() {
  const header = ['Week', 'Eligible Days', '4-set Total', '4-set Cumulative', '6-set Total', '6-set Cumulative'];
  const body = weeklyRollup.map((w) => [w.label, w.eligibleDays, w.fourSetTotal, w.cumulative4, w.sixSetTotal, w.cumulative6]);
  const grandTotalRow = ['TOTAL (Cycle 1 + Cycle 2)', eligibleDays.length, fourSetRows.reduce((a, r) => a + r.dayTotal, 0), '', sixSetRows.reduce((a, r) => a + r.dayTotal, 0), ''];
  const ws = XLSX.utils.aoa_to_sheet([header, ...body, [''], grandTotalRow]);
  ws['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
  return ws;
}

const readmeWs = readmeSheet();
XLSX.utils.book_append_sheet(wb, readmeWs, 'ReadMe');

const fourSetWs = XLSX.utils.aoa_to_sheet(dailySheetRows(fourSetRows, VARIANTS.fourSet));
fourSetWs['!cols'] = [{ wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 34 }, { wch: 48 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 11 }, { wch: 16 }];
XLSX.utils.book_append_sheet(wb, fourSetWs, 'Daily (4-set)');

const sixSetWs = XLSX.utils.aoa_to_sheet(dailySheetRows(sixSetRows, VARIANTS.sixSet));
sixSetWs['!cols'] = [{ wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 34 }, { wch: 48 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 11 }, { wch: 16 }];
XLSX.utils.book_append_sheet(wb, sixSetWs, 'Daily (6-set)');

const weeklyWs = weeklySheet();
XLSX.utils.book_append_sheet(wb, weeklyWs, 'Weekly Rollup');

const pass1Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// ---------------------------------------------------------------------------
// 7. STYLE POST-PROCESS (pass 2 — JSZip + hand-written styles.xml, following
// xlsxPatcher.js's already-verified append/order patterns).
const STYLESHEET_CHILD_ORDER = ['numFmts', 'fonts', 'fills', 'borders', 'cellStyleXfs', 'cellXfs', 'cellStyles', 'dxfs', 'tableStyles', 'colors', 'extLst'];
const WORKSHEET_CHILD_ORDER = ['sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData', 'sheetCalcPr', 'sheetProtection', 'protectedRanges', 'scenarios', 'autoFilter', 'sortState', 'dataConsolidate', 'customSheetViews', 'mergeCells', 'phoneticPr', 'conditionalFormatting', 'dataValidations', 'hyperlinks', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter', 'rowBreaks', 'colBreaks', 'customProperties', 'cellWatches', 'ignoredErrors', 'smartTags', 'drawing', 'legacyDrawing', 'legacyDrawingHF', 'picture', 'oleObjects', 'controls', 'webPublishItems', 'tableParts', 'extLst'];

function insertInOrder(parent, el, order) {
  const myIdx = order.indexOf(el.tagName);
  const before = Array.from(parent.childNodes).find((c) => c.nodeType === 1 && order.indexOf(c.tagName) > myIdx);
  if (before) parent.insertBefore(el, before); else parent.appendChild(el);
}

function hexToArgb(hex) { return 'FF' + hex.toUpperCase(); }

async function styleWorkbook(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const stylesXmlText = await zip.file('xl/styles.xml').async('string');
  const stylesDoc = parser.parseFromString(stylesXmlText, 'application/xml');
  const root = stylesDoc.documentElement;
  const fontsEl = root.getElementsByTagName('fonts')[0];
  const fillsEl = root.getElementsByTagName('fills')[0];
  const cellXfsEl = root.getElementsByTagName('cellXfs')[0];

  function appendFont({ bold = false, color = null, sz = 11 } = {}) {
    const el = stylesDoc.createElementNS(NS_MAIN, 'font');
    const szEl = stylesDoc.createElementNS(NS_MAIN, 'sz'); szEl.setAttribute('val', String(sz)); el.appendChild(szEl);
    if (color) { const c = stylesDoc.createElementNS(NS_MAIN, 'color'); c.setAttribute('rgb', hexToArgb(color)); el.appendChild(c); }
    const nameEl = stylesDoc.createElementNS(NS_MAIN, 'name'); nameEl.setAttribute('val', 'Calibri'); el.appendChild(nameEl);
    if (bold) el.insertBefore(stylesDoc.createElementNS(NS_MAIN, 'b'), el.firstChild);
    const idx = fontsEl.childNodes.length ? Array.from(fontsEl.childNodes).filter((n) => n.nodeType === 1).length : 0;
    fontsEl.appendChild(el);
    return idx;
  }
  function appendFill(hexBg) {
    const el = stylesDoc.createElementNS(NS_MAIN, 'fill');
    const pf = stylesDoc.createElementNS(NS_MAIN, 'patternFill'); pf.setAttribute('patternType', 'solid');
    const fg = stylesDoc.createElementNS(NS_MAIN, 'fgColor'); fg.setAttribute('rgb', hexToArgb(hexBg)); pf.appendChild(fg);
    const bg = stylesDoc.createElementNS(NS_MAIN, 'bgColor'); bg.setAttribute('indexed', '64'); pf.appendChild(bg);
    el.appendChild(pf);
    const idx = Array.from(fillsEl.childNodes).filter((n) => n.nodeType === 1).length;
    fillsEl.appendChild(el);
    return idx;
  }
  function appendXf(fontId, fillId) {
    const el = stylesDoc.createElementNS(NS_MAIN, 'xf');
    el.setAttribute('numFmtId', '0');
    el.setAttribute('fontId', String(fontId));
    el.setAttribute('fillId', String(fillId));
    el.setAttribute('borderId', '0');
    el.setAttribute('xfId', '0');
    el.setAttribute('applyFont', '1');
    el.setAttribute('applyFill', '1');
    const idx = Array.from(cellXfsEl.childNodes).filter((n) => n.nodeType === 1).length;
    cellXfsEl.appendChild(el);
    return idx;
  }

  const headerFont = appendFont({ bold: true, color: 'FFFFFF' });
  const headerFill = appendFill('2F3A56');
  const headerXf = appendXf(headerFont, headerFill);

  const boldFont = appendFont({ bold: true });
  const eligibleFill = appendFill('DCEEDD');
  const eligibleXf = appendXf(boldFont, eligibleFill);

  const excludedBenchFill = appendFill('F6D9D9');
  const excludedBenchXf = appendXf(0, excludedBenchFill);
  const excludedBackFill = appendFill('FCE8CE');
  const excludedBackXf = appendXf(0, excludedBackFill);
  const excludedRestFill = appendFill('E4E4E9');
  const excludedRestXf = appendXf(0, excludedRestFill);

  fontsEl.setAttribute('count', String(Array.from(fontsEl.childNodes).filter((n) => n.nodeType === 1).length));
  fillsEl.setAttribute('count', String(Array.from(fillsEl.childNodes).filter((n) => n.nodeType === 1).length));
  cellXfsEl.setAttribute('count', String(Array.from(cellXfsEl.childNodes).filter((n) => n.nodeType === 1).length));

  zip.file('xl/styles.xml', serializer.serializeToString(stylesDoc));

  function styleIdForRow(row) {
    if (!row) return null;
    if (row.eligible) return eligibleXf;
    if (row.excludedReason?.includes('bench')) return excludedBenchXf;
    if (row.excludedReason?.includes('back')) return excludedBackXf;
    if (row.excludedReason?.includes('rest')) return excludedRestXf;
    return null;
  }

  async function styleSheet(sheetPath, dataRows) {
    const xmlText = await zip.file(sheetPath).async('string');
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const rows = Array.from(doc.getElementsByTagName('row'));
    for (const rowEl of rows) {
      const r = parseInt(rowEl.getAttribute('r'), 10);
      const cells = Array.from(rowEl.getElementsByTagName('c'));
      if (r === 1) {
        cells.forEach((c) => c.setAttribute('s', String(headerXf)));
        continue;
      }
      const dataRow = dataRows[r - 2]; // header is row 1
      const sId = styleIdForRow(dataRow);
      if (sId !== null) cells.forEach((c) => c.setAttribute('s', String(sId)));
    }
    // Freeze header row — cheap, well-documented pane-split XML, inserted in
    // the correct WORKSHEET_CHILD_ORDER position (right after <dimension>).
    const worksheetEl = doc.documentElement;
    let sheetViewsEl = worksheetEl.getElementsByTagName('sheetViews')[0];
    if (!sheetViewsEl) {
      sheetViewsEl = doc.createElementNS(NS_MAIN, 'sheetViews');
      insertInOrder(worksheetEl, sheetViewsEl, WORKSHEET_CHILD_ORDER);
    }
    const sheetViewEl = doc.createElementNS(NS_MAIN, 'sheetView');
    sheetViewEl.setAttribute('workbookViewId', '0');
    const paneEl = doc.createElementNS(NS_MAIN, 'pane');
    paneEl.setAttribute('ySplit', '1');
    paneEl.setAttribute('topLeftCell', 'A2');
    paneEl.setAttribute('activePane', 'bottomLeft');
    paneEl.setAttribute('state', 'frozen');
    sheetViewEl.appendChild(paneEl);
    sheetViewsEl.appendChild(sheetViewEl);

    zip.file(sheetPath, serializer.serializeToString(doc));
  }

  // Sheet order in the archive matches append order above: sheet1=ReadMe,
  // sheet2=Daily(4-set), sheet3=Daily(6-set), sheet4=Weekly Rollup.
  await styleSheet('xl/worksheets/sheet2.xml', fourSetRows);
  await styleSheet('xl/worksheets/sheet3.xml', sixSetRows);

  return zip.generateAsync({ type: 'nodebuffer' });
}

const finalBuffer = await styleWorkbook(pass1Buffer);
const outPath = path.join(__dirname, 'pushup-plan.xlsx');
fs.writeFileSync(outPath, finalBuffer);
console.log('Wrote', outPath, finalBuffer.length, 'bytes');
console.log('Eligible pushup days:', eligibleDays.length, eligibleDays.map((d) => d.label).join(', '));
console.log('4-set grand total:', fourSetRows.reduce((a, r) => a + r.dayTotal, 0));
console.log('6-set grand total:', sixSetRows.reduce((a, r) => a + r.dayTotal, 0));
