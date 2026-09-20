// Parses one MMAHP chapter PDF's already-extracted text into structured JSON: a running title,
// then an ordered list of sections split at the book's own numbered headings ("2.1 Units of
// measurement"), each holding an ordered list of BLOCKS (paragraph / subheading / figure) rather
// than one flat wall of text. This is the read-side counterpart to parseMciWorksheet.mjs - a
// one-time parser run per source file, its committed JSON output is what the app actually reads
// (see courses/AGENT-PROMPT.md "no file upload feature" - only derived, structured artifacts
// land in the repo).
//
// USAGE
//   node scripts/parseMmahpChapter.mjs "<pdf path>" --number 1 --out <json path>
//
// Rewritten 2026-09-18 after Trey: "everything is one chunk of words... not fit for a human to
// read." The original version joined every line in a section into ONE string - real, no
// paragraph breaks survive PDF text extraction as blank lines (verified: pdf-parse gives
// sequential wrapped lines with no vertical whitespace marker between paragraphs on the same
// page), so recovering structure needs real signals, not a join(' '):
//
//   1. PARAGRAPH BREAKS: a full-width wrapped line in this document runs ~106-126 chars
//      (measured against real chapter 1/2 text). A paragraph's LAST line is whatever remains
//      after the final sentence, so it is reliably SHORTER than that - a line under ~95 chars
//      that ends in sentence-terminal punctuation (. ! ? or those followed by a closing quote/
//      paren) closes the paragraph.
//   2. SUBHEADINGS: the book's own bolded mini-headings ("Viruses", "Domain Bacteria") survive
//      extraction as short standalone lines immediately followed by a full-width prose line -
//      the same length-gap signal parseMmahpSlides.mjs already uses for slide titles.
//   3. FIGURES: "Fig. 1.4. Some eukaryotic microbes..." starts its own line every time it was
//      checked. Pulled into their own block (never merged into paragraph prose) both because a
//      real textbook renders a caption as its own visually distinct unit, AND because this is
//      the page-tagged anchor scripts/buildMmahpReader.mjs uses to attach the PDF's real
//      embedded image (via pdf-parse's getImage()) to the right spot in the reading.

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : (argv[i + 1] ?? d); };
const pdfPath = argv[0];
const NUMBER = Number(arg('--number'));
const OUT = arg('--out');

if (!pdfPath || !NUMBER || !OUT) {
  console.error('Usage: node scripts/parseMmahpChapter.mjs "<pdf>" --number <N> --out <json>');
  process.exit(1);
}

const tmpTxt = path.join(path.dirname(OUT), `.tmp-extract-${NUMBER}.txt`);
execSync(`node "${path.join(import.meta.dirname, 'extractBook.mjs')}" "${pdfPath}" --out "${tmpTxt}"`, { stdio: 'pipe' });
const raw = fs.readFileSync(tmpTxt, 'utf8');
fs.unlinkSync(tmpTxt);

const rawLines = raw.split('\n').map((l) => l.replace(/\r$/, ''));

// Tag every line with its 1-based PDF page number BEFORE any noise-stripping, by counting the
// "-- N of TOTAL --" page-break markers extractBook.mjs inserts - this is what lets a figure
// caption later be matched to the embedded image that came off the SAME PDF page.
let page = 1;
let lines = [];
for (const l of rawLines) {
  const m = l.trim().match(/^--\s*(\d+)\s*of\s*(\d+)\s*--$/);
  if (m) { page = Number(m[1]) + 1; continue; }
  lines.push({ text: l, page });
}

// Every chapter ends with a "Short [and] Objective Questions (SOQs)" self-test bank (a big pile
// of numbered short-answer + lettered multiple-choice items), then a "Reflections" real-world
// case study, then discussion "Questions" about it, then a literal end-of-chapter marker. Trey,
// 2026-09-18: "remove the end of chapter questions from the reader." Confirmed present, with
// spelling drift, in every chapter checked ("Short-Objective Questions (SOQs)" ch1, "Short and
// objective questions (SOQs)" ch2, "Short Objective Questions (SOC)" ch16 - a typo, still caught
// by matching just the "(SO" prefix). This is cut BEFORE section/block parsing even runs, so
// none of it can leak into a section via the same "no heading precedes it" problem that let the
// chapter-3-6 running-title leak happen (see the trap note above) - there is no clean heading to
// rely on for the run of essay questions that FOLLOWS the SOQ line in some chapters either, but
// cutting at the SOQ marker (or the end-marker as a fallback) removes it all in one cut regardless.
// The "(SOQs)" parenthetical is usually there but not always - ch3's is bare "Short Objective
// questions" with no suffix at all, so the phrase itself is the signal, not the acronym.
const soqIdx = lines.findIndex((l) => /Short[\s-]+(and\s+)?Objective\s+Questions/i.test(l.text));
const endIdx = lines.findIndex((l) => /^END\s+MMAHP\s+Ch(?:apter)?\s*\d+/i.test(l.text.trim()));
const cutIdx = soqIdx !== -1 ? soqIdx : endIdx;
if (cutIdx !== -1) {
  lines = lines.slice(0, cutIdx);
} else {
  console.warn(`  ch${NUMBER}: WARNING - no "Short/Objective Questions (SOQs)" or "End MMAHP" marker found; end-of-chapter questions may not have been removed.`);
}

const pageOfIdx = lines.findIndex((l) => /^Page \d+ of \d+$/.test(l.text.trim()));
let runningTitle = pageOfIdx > 0 ? lines[pageOfIdx - 1].text.trim() : null;

// Some headings are "1.1 What is a microbe?" (no trailing period before the title) and others in
// the SAME file are "1.3. The species concept" (trailing period) - both are real, verified in
// chapter 1's own text, so the period before the required whitespace is optional, not a choice.
const HEADING_RE = new RegExp(`^${NUMBER}\\.(\\d+)(\\.\\d+)?\\.?\\s+\\S`);
const FIGURE_RE = /^(Fig(?:ure)?\.?|Table)\s*\d+\.\d+\.?/i;

// Fallback for the chapters that DON'T repeat the title before "Page N of M" at all (verified
// 2026-09-18: chapters 7-16 open with "Page 1 of N" as line 1, no title before it, and don't
// repeat it before later pages either - unlike chapters 1-6). Every chapter DOES print a
// standalone "<chapter number>" line, immediately followed by the title as one or more SHORT
// lines (title-art wraps at ~25-40 chars; real prose wraps close to the full page width, ~100+
// chars) before the long first prose line begins - so collect short lines after that marker
// until hitting one long enough to be prose.
if (!runningTitle) {
  const numIdx = lines.findIndex((l) => l.text.trim() === String(NUMBER));
  if (numIdx !== -1) {
    const parts = [];
    for (let i = numIdx + 1; i < lines.length; i++) {
      const t = lines[i].text.trim();
      if (!t) continue;
      if (t.length >= 70 || HEADING_RE.test(t)) break;
      parts.push(t);
      if (parts.length >= 4) break;
    }
    if (parts.length) runningTitle = parts.join(' ');
  }
}
// Some title-art lines use tab stops between words (centered-text PDF artifact, e.g. ch13/ch14) -
// normalize whatever whitespace survived into single spaces either way.
if (runningTitle) runningTitle = runningTitle.replace(/\s+/g, ' ').trim();
// Keep the UNSTRIPPED running title for noise-filtering (below) - chapters 3-6 repeat this exact
// "MMAHP Ch N: <title>" line on many pages throughout the chapter, not just once at the top. A
// real bug found 2026-09-18: stripping the "MMAHP Ch N:" prefix BEFORE building the noise filter
// meant every later repeat of the (unstripped) header no longer matched `rawRunningTitle`, so it
// leaked into the body as a spurious paragraph - 15-21 times per chapter across ch3-ch6.
const rawRunningTitle = runningTitle;
// Chapters 3-6's own running title already bakes in "MMAHP Ch N:" - redundant once the reader
// prepends its own "Ch N." label, so strip that prefix for the DISPLAYED title only.
if (runningTitle) runningTitle = runningTitle.replace(/^MMAHP\s+Ch(?:apter)?\s*\d+\s*:?\s*/i, '').trim();

const isNoise = (t) => {
  if (!t) return true;
  if (rawRunningTitle && t === rawRunningTitle) return true;
  if (/^Page \d+ of \d+$/.test(t)) return true;
  if (/^\d+$/.test(t)) return true; // bare page-number echo
  return false;
};

const clean = lines.filter((l) => !isNoise(l.text.trim())).map((l) => ({ text: l.text.trim(), page: l.page }));

let bodyStart = 0;
for (let i = 0; i < clean.length; i++) {
  if (HEADING_RE.test(clean[i].text)) { bodyStart = i; break; }
}

/**
 * Turns a run of raw lines into ordered blocks: subheading / figure / paragraph. This is the
 * structural recovery described in the file header - see the three numbered rules there.
 */
const PARA_END_LEN = 95;
const PARA_END_RE = /[.!?]["'”’)\]]?$/;
function toBlocks(runLines) {
  const blocks = [];
  let cur = null; // { type, text: [lines], page }

  const flush = () => {
    if (cur && cur.text.length) blocks.push({ type: cur.type, text: cur.text.join(' ').replace(/\s{2,}/g, ' ').trim(), page: cur.page });
    cur = null;
  };

  for (let i = 0; i < runLines.length; i++) {
    const { text: t, page: p } = runLines[i];
    if (!t) continue;

    if (FIGURE_RE.test(t)) {
      if (!cur || cur.type !== 'figure') { flush(); cur = { type: 'figure', text: [], page: p }; }
      cur.text.push(t);
      if (t.length < PARA_END_LEN && PARA_END_RE.test(t)) flush();
      continue;
    }

    // A mini-subheading: short, not a figure/table line, and the line right after it is a real
    // full-width prose line (the length-gap signal) - never fires mid-paragraph because a
    // paragraph's own short closing line is followed by ANOTHER short line (a new subheading or
    // block start), not a long one.
    const next = runLines[i + 1];
    const looksLikeSubheading = t.length < 45 && !PARA_END_RE.test(t) && next && next.text.length >= PARA_END_LEN
      && !FIGURE_RE.test(next.text);
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
  return blocks;
}

const sections = [];
let current = { heading: null, number: null, lines: [] };
for (let i = bodyStart; i < clean.length; i++) {
  const { text: t, page: p } = clean[i];
  const m = t.match(HEADING_RE);
  if (m) {
    if (current.lines.length) sections.push(current);
    const spaceIdx = t.indexOf(' ');
    current = { number: t.slice(0, spaceIdx).replace(/\.$/, ''), heading: t.slice(spaceIdx + 1).trim(), lines: [] };
  } else {
    current.lines.push({ text: t, page: p });
  }
}
if (current.lines.length) sections.push(current);

// Leading prose before section 1 of this chapter (title-art lines + the chapter intro
// paragraph). Strip a leading repeat of the running title if the wrapped art happens to join
// back into exactly that string - true for ch1, a harmless leftover fragment when it isn't.
let lead = clean.slice(0, bodyStart).map((l) => l.text).join(' ').replace(/\s{2,}/g, ' ').trim();
if (runningTitle) {
  const normTitle = runningTitle.replace(/\s+/g, ' ').trim();
  if (lead.startsWith(normTitle)) lead = lead.slice(normTitle.length).trim();
}

// Every figure/table block across the whole chapter, page-tagged, in reading order - the anchor
// list scripts/buildMmahpReader.mjs zips against pdf-parse's extracted images.
const figures = [];
for (const s of sections) {
  for (const b of toBlocks(s.lines)) {
    if (b.type === 'figure') {
      const num = b.text.match(/^(?:Fig(?:ure)?\.?|Table)\s*(\d+\.\d+)/i);
      figures.push({ number: num ? num[1] : null, caption: b.text, page: b.page, sectionNumber: s.number });
    }
  }
}

const out = {
  id: `ch${String(NUMBER).padStart(2, '0')}`,
  number: NUMBER,
  title: runningTitle || `Chapter ${NUMBER}`,
  sourceFile: path.basename(pdfPath),
  lead,
  sections: sections.map((s) => ({
    number: s.number,
    heading: s.heading,
    blocks: toBlocks(s.lines),
  })),
  figures,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const blockCount = out.sections.reduce((n, s) => n + s.blocks.length, 0);
console.log(`${out.id}: "${out.title}" - ${out.sections.length} sections, ${blockCount} blocks, ${figures.length} figures -> ${OUT}`);
