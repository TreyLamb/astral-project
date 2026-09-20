// Parses one OpenStax Microbiology (2nd Ed.) chapter PDF into the same block-shaped structure
// parseMmahpChapter.mjs produces, so the two can be matched by topic and rendered side by side.
// OpenStax's own format differs from MMAHP's in several concrete ways, all handled here rather
// than trying to reuse the MMAHP parser as-is:
//
//   - Running header/footer alternates order by page side: "Chapter 7 | Microbial
//     Biochemistry    283" on one page, "284    Chapter 7 | Microbial Biochemistry" on the next -
//     both are stripped, plus the "This OpenStax book is available for free at http://..." line.
//   - Headings have no trailing-period variant and are always exactly 2 levels ("7.1 Organic
//     Molecules"), never 3 like MMAHP's occasional "4.2.1".
//   - Every heading is immediately followed by a "Learning Objectives" bullet list - navigational
//     meta-content, not reading material, and stripped rather than rendered as a block.
//   - "Clinical Focus" / "Part N" scenario boxes are interspersed INSIDE real sections throughout
//     the book (not just at chapter end like MMAHP's single end-of-chapter case study) - a
//     recurring patient-case device. Stripped between a bare "Part N" line and the next
//     "Clinical Focus" occurrence (or the literal "Jump to the next Clinical Focus box." line).
//
// USAGE
//   node scripts/parseOpenstaxChapter.mjs "<pdf path>" --number 7 --out <json path>

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : (argv[i + 1] ?? d); };
const pdfPath = argv[0];
const NUMBER = Number(arg('--number'));
const OUT = arg('--out');

if (!pdfPath || !NUMBER || !OUT) {
  console.error('Usage: node scripts/parseOpenstaxChapter.mjs "<pdf>" --number <N> --out <json>');
  process.exit(1);
}

const tmpTxt = path.join(path.dirname(OUT), `.tmp-extract-os-${NUMBER}.txt`);
execSync(`node "${path.join(import.meta.dirname, 'extractBook.mjs')}" "${pdfPath}" --out "${tmpTxt}"`, { stdio: 'pipe' });
const raw = fs.readFileSync(tmpTxt, 'utf8');
fs.unlinkSync(tmpTxt);

const rawLines = raw.split('\n').map((l) => l.replace(/\r$/, ''));

let page = 1;
const lines = [];
for (const l of rawLines) {
  const m = l.trim().match(/^--\s*(\d+)\s*of\s*(\d+)\s*--$/);
  if (m) { page = Number(m[1]) + 1; continue; }
  lines.push({ text: l, page });
}

// Chapter title + outline live in the first ~15 lines: "Chapter N" then the title, then a
// "Chapter Outline" listing every heading with its own title text - useful as a display title
// and as a cross-check on how many sections to expect, not otherwise used here.
const chNumIdx = lines.findIndex((l) => l.text.trim() === `Chapter ${NUMBER}`);
const title = chNumIdx !== -1 ? (lines[chNumIdx + 1]?.text.trim() || `Chapter ${NUMBER}`) : `Chapter ${NUMBER}`;

// Requires an uppercase letter right after the number - a real heading is always Title Case
// ("7.1 Organic Molecules"). Without this, "...a water molecule. Table\n7.1 summarizes
// macromolecules..." (a table caption whose "Table" wrapped onto the prior line, coincidentally
// leaving "7.1 summarizes..." starting a line of its own) was caught as a fake heading.
const HEADING_RE = new RegExp(`^${NUMBER}\\.(\\d+)\\s+[A-Z]`);
const FIGURE_RE = /^Figure\s*\d+\.\d+\s/i;

function isNoise(t) {
  if (!t) return true;
  if (/^Chapter\s+\d+\s*\|/.test(t)) return true; // "Chapter 7 | Microbial Biochemistry   283"
  if (/^\d+\s+Chapter\s+\d+\s*\|/.test(t)) return true; // "284   Chapter 7 | Microbial Biochemistry"
  if (/^This OpenStax book is available for free/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (t === `Chapter ${NUMBER}`) return true;
  if (t === title) return true;
  return false;
}
// Every chapter ends with its own back matter: a "Summary" that RESTATES each heading number
// ("7.1 Organic Molecules" again, with a bullet recap) followed by "Review Questions" (numbered
// MC + essay self-test items) - the same end-of-chapter self-test pattern MMAHP has, and the
// same fix: cut everything from "Summary" onward before section-parsing runs, both because it's
// not real reading material and because leaving it in would have DUPLICATED every heading number
// (found 2026-09-18: every section appeared twice, once for real content, once for its own
// "Summary" recap, before this cut was added). MUST run before `clean` is built below, or the
// truncation has no effect on what actually gets parsed into sections.
const summaryIdx = lines.findIndex((l) => l.text.trim() === 'Summary');
if (summaryIdx !== -1) lines.length = summaryIdx;

let clean = lines.filter((l) => !isNoise(l.text.trim())).map((l) => ({ text: l.text.trim(), page: l.page }));

// "Chapter Outline" lists every heading up front ("7.1 Organic Molecules", "7.2 Carbohydrates"...)
// in the SAME "N.M Title" shape as a real section heading - without stripping it, the outline
// itself gets parsed as a set of empty duplicate sections, and every real heading later in the
// body then looks like a second occurrence of the same number. Drop the whole outline block.
const outlineIdx = clean.findIndex((l) => l.text === 'Chapter Outline');
if (outlineIdx !== -1) {
  let i = outlineIdx + 1;
  while (i < clean.length && HEADING_RE.test(clean[i].text)) i++;
  clean = [...clean.slice(0, outlineIdx), ...clean.slice(i)];
}

// Skip the front matter (title/Introduction) up to the first real numbered heading - same
// approach as parseMmahpChapter.mjs.
let bodyStart = 0;
for (let i = 0; i < clean.length; i++) {
  if (HEADING_RE.test(clean[i].text)) { bodyStart = i; break; }
}

const PARA_END_LEN = 95;
const PARA_END_RE = /[.!?]["'”’)\]]?$/;

/**
 * Strips OpenStax's interspersed sidebar boxes ("Clinical Focus" patient-case narratives spread
 * across several "Part N" installments, and standalone "Link to Learning" external-link boxes)
 * from a run of lines before block-parsing - removing it structurally is more reliable than
 * trying to classify it block-by-block after the fact, the same way parseMmahpChapter.mjs cuts
 * the end-of-chapter SOQ bank before section-parsing runs.
 *
 * Real box structure verified against chapter 7's full text: a bare "Part N" OR a bare "Clinical
 * Focus" OR a bare "Link to Learning" line each start a box; a "Clinical Focus" narrative closes
 * with some combination of "Jump to the next/previous Clinical Focus box." / "Go back to the
 * next/previous Clinical Focus box." on one line, but a "Link to Learning" box (a short external
 * pointer) has NO closing phrase at all. A fixed line cap on top of the closing-phrase search
 * covers that second case without needing a different rule for it.
 */
const BOX_START_RE = /^(Part\s+\d+|Clinical Focus|Link to Learning)$/i;
const BOX_END_RE = /(Jump to the (next|previous) Clinical Focus box\.?|Go back to the (next|previous) Clinical Focus box\.?)/i;
const BOX_MAX_LINES = 15;

function stripClinicalFocus(runLines) {
  const out = [];
  let skipping = false;
  let skipStart = -1;
  for (let i = 0; i < runLines.length; i++) {
    const t = runLines[i].text;
    if (!skipping && BOX_START_RE.test(t)) { skipping = true; skipStart = i; continue; }
    if (skipping) {
      if (BOX_END_RE.test(t) || (i - skipStart) >= BOX_MAX_LINES) skipping = false;
      continue;
    }
    out.push(runLines[i]);
  }
  return out;
}

function toBlocks(runLines) {
  const lines2 = stripClinicalFocus(runLines);
  const blocks = [];
  let cur = null;
  let skippingObjectives = false;

  const flush = () => {
    if (cur && cur.text.length) blocks.push({ type: cur.type, text: cur.text.join(' ').replace(/\s{2,}/g, ' ').trim(), page: cur.page });
    cur = null;
  };

  for (let i = 0; i < lines2.length; i++) {
    const { text: t, page: p } = lines2[i];
    if (!t) continue;

    if (/^Learning Objectives$/i.test(t)) { skippingObjectives = true; flush(); continue; }
    if (skippingObjectives) {
      if (t.startsWith('•')) continue; // an objective bullet - part of the skipped block
      skippingObjectives = false; // first non-bullet line ends the objectives block, fall through
    }

    if (FIGURE_RE.test(t)) {
      if (!cur || cur.type !== 'figure') { flush(); cur = { type: 'figure', text: [], page: p }; }
      cur.text.push(t);
      if (t.length < PARA_END_LEN && PARA_END_RE.test(t)) flush();
      continue;
    }

    const next = lines2[i + 1];
    const looksLikeSubheading = t.length < 45 && !PARA_END_RE.test(t) && next && next.text.length >= PARA_END_LEN
      && !FIGURE_RE.test(next.text) && !/^Learning Objectives$/i.test(next.text);
    if (looksLikeSubheading && (!cur || cur.type !== 'paragraph' || !cur.text.length)) {
      flush();
      blocks.push({ type: 'subheading', text: t, page: p });
      continue;
    }

    if (!cur || cur.type !== 'paragraph') { flush(); cur = { type: 'paragraph', text: [], page: p }; }
    cur.text.push(t);
    if (t.length < PARA_END_LEN && PARA_END_RE.test(t)) flush();
  }
  flush();
  // A rare leftover: a bare "Clinical Focus" (or "Link to Learning") label that didn't trigger
  // stripClinicalFocus() as a box-start, usually because it's acting as a closing/handoff tag
  // rather than opening a new box (found 2026-09-19: ~0.6% of blocks in a real chapter). A block
  // that consists of ONLY that label carries no information regardless of why it survived, so
  // drop it here rather than chase every box-boundary variant this book uses.
  return blocks.filter((b) => !/^(Clinical Focus|Link to Learning)$/i.test(b.text.trim()));
}

const sections = [];
let current = { heading: null, number: null, lines: [] };
for (let i = bodyStart; i < clean.length; i++) {
  const { text: t, page: p } = clean[i];
  const m = t.match(HEADING_RE);
  if (m) {
    if (current.lines.length) sections.push(current);
    const spaceIdx = t.indexOf(' ');
    current = { number: t.slice(0, spaceIdx), heading: t.slice(spaceIdx + 1).trim(), lines: [] };
  } else {
    current.lines.push({ text: t, page: p });
  }
}
if (current.lines.length) sections.push(current);

const out = {
  id: `os${String(NUMBER).padStart(2, '0')}`,
  number: NUMBER,
  title,
  sourceFile: path.basename(pdfPath),
  sections: sections.map((s) => ({
    number: s.number,
    heading: s.heading,
    blocks: toBlocks(s.lines),
  })),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const blockCount = out.sections.reduce((n, s) => n + s.blocks.length, 0);
console.log(`${out.id}: "${out.title}" - ${out.sections.length} sections, ${blockCount} blocks -> ${OUT}`);
