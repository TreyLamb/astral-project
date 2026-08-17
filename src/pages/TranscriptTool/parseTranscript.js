// Turns a UVU registrar transcript text dump into structured course records.
//
// Pure — no imports, no fs, no network. The same function runs in
// scripts/parseTranscript.mjs (build-time) and in the browser when a new
// transcript is pasted in, so it must stay free of anything Node-only.
//
// WHY A REGEX SCAN AND NOT A LINE SPLIT: the source is OCR'd two-column PDF
// text, and rows collide. Where a row ends in an R (repeat) flag, the next
// course's subject code is fused to it with no separator:
//
//   ...Prof BB 3.00 D+ 0.00 EMICR 2065 ...Lab 1.00 D+ 0.00 EPES 1097 Fitness...
//                          ^^^^^                        ^^^^
//                          flag E + subject MICR        flag E + subject PES
//
// That single line holds THREE courses. Splitting on \n silently loses two of
// them and still produces a plausible-looking GPA, so we scan the whole
// document and bucket each match into a term by character offset instead.

// A course row: SUBJ NO. TITLE [GE] CRED GRD PTS [R]
//
// The flag is matched with [ \t]* (not \s*) on purpose. \s crosses newlines,
// which would let a flagless row swallow the first letter of the NEXT line's
// subject code — "…11.10\nEXSC 4550" would read as flag=E plus a subject of
// "XSC". The flag only ever appears on the row's own line.
const COURSE_RE = /([A-Z]{2,4})[ \t]+(\d{3}[0-9A-Z])[ \t]+(.+?)[ \t]+(\d+\.\d{2})[ \t]+([A-E][+-]?)[ \t]+(\d+\.\d{2})[ \t]*([EI])?/g;

const TERM_RE = /^[ \t]*(\d{4})[ \t]+(FALL|SPRING|SUMMER)[ \t]*$/gm;
const FOOTER_RE = /Ehrs:[ \t]*(\d+\.\d{2})[ \t]+GPA-Hrs:[ \t]*(\d+\.\d{2})[ \t]+QPts:[ \t]*(\d+\.\d{2})[ \t]+GPA:[ \t]*(\d+\.\d{2})/g;

// General-education attribute codes the registrar appends to the course title.
// Deliberately a whitelist, not a "trailing two capitals" rule: "Paramedic II"
// and "Intermediate Chinese II" both end in two capital letters that are roman
// numerals, not attributes, and stripping those would corrupt the titles.
const GE_ATTRIBUTES = new Set([
  'AI', 'AS', 'BB', 'CC', 'EN', 'FA', 'FE', 'FF', 'GE', 'GI', 'GM',
  'HH', 'IH', 'LH', 'PP', 'PS', 'QL', 'SS', 'TC', 'WA',
]);

const TERM_SEQ = { SPRING: 1, SUMMER: 2, FALL: 3 };

// Lines that legitimately carry no course data. Anything left over after the
// matched spans are removed AND these are filtered is reported in `unparsed`
// rather than dropped — a parse miss has to be visible somewhere.
const NOISE_RE = [
  /^[\s_*]*$/,
  /CONTINUED ON/i,
  /TRANSCRIPT TOTALS/i,
  /END OF TRANSCRIPT/i,
  /^SUBJ\s+NO\./i,
  /Institution Information continued/i,
  /INSTITUTION CREDIT/i,
  /TRANSFER CREDIT ACCEPTED/i,
  /Ehrs:/,
  /Dean's List/i,
  /^\s*\d{4}\s+(FALL|SPRING|SUMMER)\s*$/,
  /TRANSCRIPT OF ACADEMIC RECORD/i,
  /OFFICE OF RECORDS/i,
  /Date Issued|Date of Birth|Student ID|^Level:|^Record of:|^Page:/i,
  /Registrar|www\.|FAX|University Parkway|^Orem, UT|Undergraduate/i,
  /^Trey|^TREY/,
  /Course Level|Current Program|Bachelor of Science|Associate in Applied Science/i,
  /^\s*(College|Major|Maj\/Concentration|Degrees Awarded|Primary Degree)/i,
  /^\s*\d{2}\/\d{2}-\d{2}\/\d{2}/,
  /^\s*\d{6,}\s*$/,
  /^\s*\(\d{3}\)/,
  /^\d{2}-[A-Z]{3}(-\d{4})?$/, // the issue date, alone on a line in the letterhead
];

function splitTitle(rawTitle) {
  const parts = rawTitle.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  if (parts.length > 1 && GE_ATTRIBUTES.has(last)) {
    return { course: parts.slice(0, -1).join(' '), attribute: last };
  }
  return { course: parts.join(' '), attribute: null };
}

function scanTerms(text) {
  const terms = [];
  TERM_RE.lastIndex = 0;
  let m;
  while ((m = TERM_RE.exec(text)) !== null) {
    terms.push({
      year: Number(m[1]),
      term: m[2],
      semester: `${m[1]} ${m[2]}`,
      termOrder: Number(m[1]) * 10 + TERM_SEQ[m[2]],
      index: m.index,
    });
  }
  return terms;
}

function termAt(terms, index) {
  let found = null;
  for (const t of terms) {
    if (t.index < index) found = t;
    else break;
  }
  return found;
}

// The printed per-term footer (Ehrs / GPA-Hrs / QPts / GPA). Kept as
// validation data, not discarded — it is what the parser is checked against.
function scanFooters(text, terms) {
  const byTerm = new Map();
  FOOTER_RE.lastIndex = 0;
  let m;
  while ((m = FOOTER_RE.exec(text)) !== null) {
    const t = termAt(terms, m.index);
    if (!t) continue; // the transfer-credit block's footer precedes every term
    byTerm.set(t.semester, {
      earnedHours: Number(m[1]),
      gpaHours: Number(m[2]),
      points: Number(m[3]),
      gpa: Number(m[4]),
    });
  }
  return byTerm;
}

function scanTotals(text) {
  const grab = (label) => {
    const re = new RegExp(`${label}[ \\t]+(\\d+\\.\\d{2})[ \\t]+(\\d+\\.\\d{2})[ \\t]+(\\d+\\.\\d{2})[ \\t]+(\\d+\\.\\d{2})`);
    const m = text.match(re);
    if (!m) return null;
    return { earnedHours: Number(m[1]), gpaHours: Number(m[2]), points: Number(m[3]), gpa: Number(m[4]) };
  };
  return {
    institution: grab('TOTAL INSTITUTION'),
    transfer: grab('TOTAL TRANSFER'),
    overall: grab('OVERALL'),
  };
}

// Blanks out every consumed span, then reports what non-noise text survives.
function findUnparsed(text, spans) {
  const chars = text.split('');
  for (const [start, end] of spans) {
    for (let i = start; i < end && i < chars.length; i++) {
      if (chars[i] !== '\n') chars[i] = ' ';
    }
  }
  const out = [];
  chars.join('').split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (NOISE_RE.some((re) => re.test(trimmed))) return;
    out.push({ line: i + 1, text: trimmed });
  });
  return out;
}

/**
 * @param {string} rawText the transcript text dump
 * @returns {{courses: Array, terms: Array, totals: Object, unparsed: Array}}
 */
export function parseTranscript(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { courses: [], terms: [], totals: { institution: null, transfer: null, overall: null }, unparsed: [] };
  }

  // Everything after the totals banner is the summary block and page 2's
  // letterhead — no course rows live there.
  const cut = rawText.indexOf('TRANSCRIPT TOTALS');
  const body = cut === -1 ? rawText : rawText.slice(0, cut);

  const terms = scanTerms(body);
  const spans = [];
  const courses = [];
  const seenIds = new Set();

  COURSE_RE.lastIndex = 0;
  let m;
  while ((m = COURSE_RE.exec(body)) !== null) {
    const [full, subject, number, rawTitle, credits, grade, points, flag] = m;
    const t = termAt(terms, m.index);
    const { course, attribute } = splitTitle(rawTitle);

    let id = `${subject}-${number}-${t ? t.semester.replace(' ', '-') : 'NA'}`;
    let n = 2;
    while (seenIds.has(id)) id = `${subject}-${number}-${t ? t.semester.replace(' ', '-') : 'NA'}-${n++}`;
    seenIds.add(id);

    courses.push({
      id,
      subject,
      number,
      code: `${subject} ${number}`,
      course,
      attribute,
      credits: Number(credits),
      grade,
      // The registrar prints 0.00 for an excluded attempt regardless of the
      // letter grade, so this is a record of the transcript, NOT a value to
      // recompute a GPA from. gpa.js derives points from the scale instead.
      printedPoints: Number(points),
      repeatFlag: flag || null,
      semester: t ? t.semester : null,
      year: t ? t.year : null,
      term: t ? t.term : null,
      termOrder: t ? t.termOrder : 0,
    });

    spans.push([m.index, m.index + full.length]);
  }

  const footers = scanFooters(body, terms);

  return {
    courses,
    // `index` is scan bookkeeping, not part of the emitted record.
    terms: terms.map((t) => ({
      year: t.year,
      term: t.term,
      semester: t.semester,
      termOrder: t.termOrder,
      printed: footers.get(t.semester) || null,
    })),
    totals: scanTotals(rawText),
    unparsed: findUnparsed(body, spans),
  };
}
