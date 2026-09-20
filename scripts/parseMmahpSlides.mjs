// Parses one MMAHP "PowerPoint Lecture Outline" PDF (one slide per PDF page) into structured
// JSON: a title slide's metadata (chapter number, OpenStax equivalent chapter - stated on every
// title slide, e.g. "Equivalent: OpenStax Microbiology 2nd Ed. Chapter 1") plus an ordered list
// of content slides, each with a title (when the slide has one) and its bullet lines.
//
// USAGE
//   node scripts/parseMmahpSlides.mjs "<pdf path>" --number 1 --out <json path>
//
// Verified against real chapter 1 output (2026-09-18): extractBook.mjs's own "-- N of TOTAL --"
// page-break marker is one slide boundary per PDF page. The block BEFORE the first marker is
// always the title/credits slide, never real lecture content. Every other block's first line is
// its slide title UNLESS that line is itself a bullet or a tab-separated table row, in which
// case the slide has no title of its own (usually a table or image continuing the slide before
// it) - title stays null rather than guessing one. Bullets are lines starting with the literal
// "•"; a nested bullet is "• \t<text>" and is kept as one flat bullet list, not a sub-tree - the
// matcher only needs slide-level text, not outline depth.

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : (argv[i + 1] ?? d); };
const pdfPath = argv[0];
const NUMBER = Number(arg('--number'));
const OUT = arg('--out');

if (!pdfPath || !NUMBER || !OUT) {
  console.error('Usage: node scripts/parseMmahpSlides.mjs "<pdf>" --number <N> --out <json>');
  process.exit(1);
}

const tmpTxt = path.join(path.dirname(OUT), `.tmp-extract-ppt-${NUMBER}.txt`);
execSync(`node "${path.join(import.meta.dirname, 'extractBook.mjs')}" "${pdfPath}" --out "${tmpTxt}"`, { stdio: 'pipe' });
const raw = fs.readFileSync(tmpTxt, 'utf8');
fs.unlinkSync(tmpTxt);

// Split on the page-break marker, keeping only each block's content (the marker line itself is
// dropped, same as parseMmahpChapter.mjs treats it as noise).
const blocks = raw.split(/\n--\s*\d+\s*of\s*\d+\s*--\n/);

function cleanBlock(block) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  // Drop a trailing bare-digit footer (the on-slide slide-number stamp) if present.
  if (lines.length && /^\d+$/.test(lines[lines.length - 1])) lines.pop();
  return lines;
}

const titleBlock = cleanBlock(blocks[0]);
const equivLine = titleBlock.find((l) => /^Equivalent:/i.test(l)) || null;
const chapterTitleLine = titleBlock.find((l) => /^MMAH Chapter \d+/i.test(l));
// The chapter's real title is usually the line right before "MMAH Chapter N" - same title-slide
// layout every time, verified across chapter 1.
const titleIdx = chapterTitleLine ? titleBlock.indexOf(chapterTitleLine) : -1;
const chapterTitle = titleIdx > 0 ? titleBlock[titleIdx - 1] : null;

// A line is title-shaped if it's short, not a bullet, and not a table row. Real bug found
// 2026-09-18: a single tab (2-column row, "Staphylococcus aureus\tSkin, wound...") slipped past
// the old "reject on 2+ tabs" check, and a title that wraps onto a SECOND physical line
// ("Murray et al scheme of grouping pathogenic" / "bacteria (1)") was never rejoined - only the
// first line was kept, so nine slides literally titled "...bacteria (1)" through "...(9)" all
// collapsed to the identical-looking title "...pathogenic" with the differentiating "(N)" lost.
// That silently merged nine DIFFERENT slides into what looked like nine copies of the same one.
function looksLikeTitleLine(l) {
  return !l.startsWith('•') && !/\t/.test(l) && l.length < 70 && !/^\d+$/.test(l);
}

const slides = [];
for (let i = 1; i < blocks.length; i++) {
  const lines = cleanBlock(blocks[i]);
  if (!lines.length) continue;

  const titleParts = [];
  let bodyStart = 0;
  while (bodyStart < lines.length && titleParts.length < 2 && looksLikeTitleLine(lines[bodyStart])) {
    titleParts.push(lines[bodyStart]);
    bodyStart++;
  }
  const title = titleParts.length ? titleParts.join(' ') : null;
  const bodyLines = lines.slice(bodyStart);
  const bullets = bodyLines
    .filter((l) => l.startsWith('•'))
    .map((l) => l.replace(/^•\s*/, '').trim())
    .filter(Boolean);
  // Non-bullet lines that aren't the title either - almost always a wrapped multi-column
  // reference table (cells wrap across several physical lines with no reliable column marker
  // left after extraction), and it can't be reflowed as clean prose. Kept on the record for
  // completeness, but see buildMmahpReader.mjs: a slide with zero real bullets is dropped from
  // the reading view entirely rather than rendered as a garbled table dump, which would fail
  // Trey's readability complaint worse than the box not existing at all.
  const other = bodyLines.filter((l) => !l.startsWith('•'));
  slides.push({ index: i, title, bullets, other });
}

const out = {
  id: `ch${String(NUMBER).padStart(2, '0')}`,
  number: NUMBER,
  chapterTitle: chapterTitle || null,
  openstaxEquivalent: equivLine ? equivLine.replace(/^Equivalent:\s*/i, '').trim() : null,
  sourceFile: path.basename(pdfPath),
  slides,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`${out.id}: ${slides.length} slides (${slides.filter((s) => s.title).length} titled) -> ${OUT}`);
