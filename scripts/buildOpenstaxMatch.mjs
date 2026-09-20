// Matches OpenStax section content onto the MMAHP chapter section it best overlaps with, by
// topic (word-overlap + content-containment, the same scoring approach buildMmahpReader.mjs uses
// for matching lecture-PPT slides to MMAHP sections), and writes the result into the chapter's
// already-built reader JSON as `section.openstax` - a same-shaped sibling to `section.slides`.
//
// Not folded into buildMmahpReader.mjs itself: OpenStax coverage doesn't exist for every chapter
// yet (only 1-5 have a stated equivalence so far), and this step needs BOTH chapter and OpenStax
// PDFs parsed first, so it runs as a second pass over an existing chapter JSON rather than as
// part of that build.
//
// USAGE
//   node scripts/buildOpenstaxMatch.mjs --mmahp ch04 --openstax 7,8
//     Looks up MMAHP ch4's own file list from CHAPTERS below, parses the given OpenStax chapter
//     numbers (from OPENSTAX_FILES), matches, and writes back into
//     courses/micr2060/reader/data/ch04.json.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DATA_DIR = path.join(import.meta.dirname, '../src/pages/theknowledgebase/courses/micr2060/reader/data');
const SRC_DIR = 'G:/My Drive/SupplementalCourseDocs/MICR 2060/files';
const SCRATCH = path.join(import.meta.dirname, '../.openstax-match-tmp');

// Real internal chapter numbers verified against each PDF's own "Chapter N" text - the folder's
// OWN filenames are wrong for two of these (see header note in parseOpenstaxChapter.mjs / the
// 2026-09-19 chat: "OpenStax Micro Ch 7 Acellular Microbes.pdf" is actually chapter 6).
const OPENSTAX_FILES = {
  1: 'Openstax Micro Ch 1- Introduction.pdf',
  2: 'OpenStax Micro Ch 2 Microscopy.pdf',
  3: 'OpenStax Micro Ch 3 The Cell.pdf',
  4: 'OpenStax Micro Ch 4 Prokaryotic Diversity.pdf',
  5: 'OpenStax Micro Ch 5 Eukaryiotic Diversity.pdf',
  6: 'OpenStax Micro Ch 7 Acellular Microbes.pdf', // mislabeled filename, verified real ch6
  7: 'OpenStax Micro Ch 7 Molecules.pdf',
  8: 'OpenStax Micro Ch 8 Metabolism.pdf',
  9: 'OpenStax Micro Ch 9 Microbial Growth.pdf',
  10: 'OpenStax Micro Ch 10 Genomes.pdf',
  11: 'OpenStax Micro Ch 11 DNA RNA Protein.pdf',
  12: 'OpenStax Micro Ch 12 Biotechnology.pdf',
  13: 'OpenStax Micro Ch 13 Controng Growth.pdf',
  14: 'OpenStax Micro Ch 14 Antimicrobials.pdf',
  15: 'OpenStax Micro Ch 15 Pathogenesis.pdf',
  16: 'OpenStax Micro Cha 16 Epidemiology.pdf',
  17: 'OpenStax Mico Ch 17 Innate Immunity.pdf',
  18: 'OpenStax Micro Ch 18 Adaptive Immunity.pdf',
  19: 'OpenStax Micro Ch 19 Diseases of Immune system.pdf',
  20: 'OpenStax Micro Ch 20 Immuno Lab.pdf',
  21: 'OpenStax MIcro Ch 21 Skin & Eye Diseases.pdf',
  22: 'OpenStax Micro Ch 22 Respiratory Diseases.pdf',
  23: 'OpenStax Micro Ch 23 Urinogenital Diseaes.pdf',
  24: 'OpenStax Micro Ch 24 Diestive Diseases.pdf',
  25: 'OpenStax Micro Ch 25 Circulatory Diseases.pdf',
  26: 'OpenStax Mico Ch 26 Nevros Sys diseases.pdf',
};

const argv = process.argv.slice(2);
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : (argv[i + 1] ?? d); };
const mmahpId = arg('--mmahp');
const openstaxNums = (arg('--openstax') || '').split(',').map(Number).filter(Boolean);

if (!mmahpId || !openstaxNums.length) {
  console.error('Usage: node scripts/buildOpenstaxMatch.mjs --mmahp ch04 --openstax 7,8');
  process.exit(1);
}

fs.mkdirSync(SCRATCH, { recursive: true });

const STOP = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'in', 'to', 'is', 'are', 'for', 'on', 'with', 'its', 'that', 'this', 'be', 'as', 'by']);
function tokens(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
function headingScore(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const w of ta) if (tb.has(w)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}
/** Fraction of section A's own significant words that occur literally in section B's text. */
function contentScore(textA, textB) {
  const t = [...new Set(tokens(textA))];
  if (!t.length) return 0;
  const body = ' ' + textB.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
  let hits = 0;
  for (const w of t) if (body.includes(' ' + w + ' ')) hits++;
  return hits / t.length;
}

function sectionText(section) {
  return (section.heading || '') + ' ' + section.blocks.map((b) => b.text).join(' ');
}

function similarity(mmahpSection, osSection) {
  const heading = headingScore(mmahpSection.heading, osSection.heading);
  const mText = sectionText(mmahpSection);
  const oText = sectionText(osSection);
  // Symmetric content score - either section's words showing up in the other counts, since a
  // short MMAHP section matched against a long OpenStax section (or vice versa) would otherwise
  // be penalized just for length asymmetry, not topic mismatch.
  const content = Math.max(contentScore(mText, oText), contentScore(oText, mText));
  return Math.max(heading * 0.7, content);
}

// --- parse every requested OpenStax chapter -------------------------------------------------

const osSections = [];
for (const n of openstaxNums) {
  const file = OPENSTAX_FILES[n];
  if (!file) { console.warn(`No known OpenStax file for chapter ${n} - skipping.`); continue; }
  const pdfPath = path.join(SRC_DIR, file);
  if (!fs.existsSync(pdfPath)) { console.warn(`Missing file: ${pdfPath} - skipping.`); continue; }
  const outPath = path.join(SCRATCH, `os${n}.json`);
  execSync(`node "${path.join(import.meta.dirname, 'parseOpenstaxChapter.mjs')}" "${pdfPath}" --number ${n} --out "${outPath}"`, { stdio: 'inherit' });
  const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  for (const s of parsed.sections) osSections.push({ ...s, chapterNumber: n, chapterTitle: parsed.title });
}

// --- match against the already-built MMAHP chapter ------------------------------------------

const mmahpPath = path.join(DATA_DIR, `${mmahpId}.json`);
const mmahp = JSON.parse(fs.readFileSync(mmahpPath, 'utf8'));

// A broad, foundational OpenStax section ("Energy, Matter, and Enzymes") shares enough generic
// vocabulary with nearly every later metabolism topic to win as the "best match" for far more
// MMAHP sections than it's actually specifically about - found 2026-09-19 testing against ch4:
// it won 7 of 17 sections outright. A cap forces weaker candidates to look past it rather than
// every section defaulting to the single broadest one, which reads as lazy/repetitive rather
// than as genuinely finding where the two books cover the SAME narrow topic.
const MIN_SCORE = 0.16;
// Each OpenStax section is attached to AT MOST ONE MMAHP section, full stop - a broad section
// can genuinely be the best real match for several MMAHP subsections (found 2026-09-19: "8.1
// Energy, Matter, and Enzymes" legitimately covers what MMAHP splits across four subsections),
// but its content runs 20-40 blocks. Showing that same block wall two, three, four times over in
// one chapter reintroduces exactly the bloat problem the SOQ/duplicate-slide fixes solved -
// showing nothing for the sections that lose the claim is the safer trade against a real re-bloat.
const MAX_CLAIMS_PER_OS_SECTION = 1;
// The cap above stops repetition, but without a floor it can also push a section toward a weak
// 3rd/4th-best candidate just to fill a slot - a WRONG pairing (lipid catabolism forced onto
// "Photosynthesis" once the real candidates were claimed, found 2026-09-19) is worse than showing
// nothing, since the whole point is trusting that two boxes next to each other are actually about
// the same thing. A pick only survives the cap if it's still a genuinely strong match on its own.
const ACCEPT_AFTER_CAP = 0.35;

const ranked = mmahp.sections.map((section) => {
  const candidates = osSections
    .map((os) => ({ os, score: similarity(section, os) }))
    .filter((c) => c.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
  return { section, candidates };
}).sort((a, b) => (b.candidates[0]?.score ?? 0) - (a.candidates[0]?.score ?? 0));

const claims = new Map(); // osSection identity -> count
const osKey = (os) => `${os.chapterNumber}.${os.number}`;

let matchedCount = 0;
for (const { section, candidates } of ranked) {
  const pick = candidates.find((c) => (claims.get(osKey(c.os)) ?? 0) < MAX_CLAIMS_PER_OS_SECTION && c.score >= ACCEPT_AFTER_CAP);
  if (pick) {
    claims.set(osKey(pick.os), (claims.get(osKey(pick.os)) ?? 0) + 1);
    section.openstax = [{
      chapterNumber: pick.os.chapterNumber,
      chapterTitle: pick.os.chapterTitle,
      number: pick.os.number,
      heading: pick.os.heading,
      blocks: pick.os.blocks,
      matchScore: Math.round(pick.score * 100) / 100,
    }];
    matchedCount++;
    console.log(`  ${mmahp.id} ${section.number} "${section.heading}" <- OS Ch${pick.os.chapterNumber} ${pick.os.number} "${pick.os.heading}" (score ${pick.score.toFixed(2)})`);
  } else {
    section.openstax = [];
  }
}

// Restore original section order - the ranking pass above reordered `mmahp.sections` in place
// via .map/.sort on a derived array, but `section` objects are shared references, so the
// original `mmahp.sections` array itself was never reordered. Nothing to do here; kept as a
// comment so the next reader doesn't have to re-verify it.

fs.writeFileSync(mmahpPath, JSON.stringify(mmahp, null, 2) + '\n');
console.log(`\n${mmahp.id}: ${matchedCount}/${mmahp.sections.length} sections matched to OpenStax content -> ${mmahpPath}`);
fs.rmSync(SCRATCH, { recursive: true, force: true });
