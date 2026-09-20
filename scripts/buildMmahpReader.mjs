// Orchestrator: runs parseMmahpChapter.mjs + parseMmahpSlides.mjs across every MICR 2060 MMAHP
// chapter (1-14, 16 - there is no chapter 15 in this course), matches each PPT slide to the
// chapter section it belongs under by heading-text similarity, extracts the PDF's own embedded
// figure images and attaches them to their captions, and writes one combined JSON per chapter to
// the app's committed data folder. This is a one-time build script, re-run only when Trey
// adds/replaces a chapter source file - the app reads the committed JSON, never the PDFs
// (courses/AGENT-PROMPT.md's "no file upload feature" rule: only derived, structured artifacts
// land in the repo).
//
// USAGE
//   node scripts/buildMmahpReader.mjs             build every chapter
//   node scripts/buildMmahpReader.mjs --only 3     build just chapter 3 (fast iteration)

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';

const SRC_DIR = 'G:/My Drive/SupplementalCourseDocs/MICR 2060/files';
const OUT_DIR = path.join(import.meta.dirname, '../src/pages/theknowledgebase/courses/micr2060/reader/data');
const IMG_OUT_DIR = path.join(import.meta.dirname, '../public/mmahp');
const IMG_PUBLIC_BASE = '/mmahp';
const SCRATCH = path.join(import.meta.dirname, '../.mmahp-build-tmp');

// Hand-mapped rather than glob-matched: the folder also holds 26 OpenStax chapter PDFs whose
// filenames collide on "Ch N" patterns, and chapter 5's PPT is the one file in the whole set
// named differently ("MICR 2060 MMAHP Lecture 5.pdf", not "MMAHP Ch 5 PowerPoint..."). A fixed
// table is one file to maintain by hand and never silently grabs the wrong PDF.
const CHAPTERS = [
  { n: 1, chapter: '1 Modern Microbiology for Allied Health Professions An Overview Posted.pdf', ppt: 'MMAHP Ch 1 PowerPoint Lecture Outline.pdf' },
  { n: 2, chapter: '2. Microscopy and the Structure of the Cell.pdf', ppt: 'MMAHP Ch 2 PowerPoint Lecture Outline.pdf' },
  { n: 3, chapter: '3. Diversity of Pathogenic Microbes.pdf', ppt: 'MMAHP Ch 3 PowerPoint Lecture Outline.pdf' },
  { n: 4, chapter: '4 Catabolic reactions.pdf', ppt: 'MMAHP Ch 4 PowerPoint Lecture Outline.pdf' },
  { n: 5, chapter: '5 Micrbail Metabolism Reactions.pdf', ppt: 'MICR 2060 MMAHP Lecture 5.pdf' },
  { n: 6, chapter: '6. Microbial Genetic and Biotechnology.pdf', ppt: 'MMAHP Ch 6 PowerPoint Outlinepdf.pdf' },
  { n: 7, chapter: '7. Microbial Growth & Control.pdf', ppt: 'MMAHP Ch 7 PowerPoint Lecture Outline.pdf' },
  { n: 8, chapter: '8. Antimicrobial Chemothrapy.pdf', ppt: 'MMAHP Ch 8 PowerPoint Lecture Outline.pdf' },
  { n: 9, chapter: '9. The Immune System & Its Effectors.pdf', ppt: 'MMAHP Ch 9 PowerPoint lecture outline.pdf' },
  { n: 10, chapter: '10. Immune Responses and Applied Immunology.pdf', ppt: 'MMAHP Ch 10 PowerPoint Lecture Outline.pdf' },
  { n: 11, chapter: '11 Mechanisms of Microbail pathogenesis copy.pdf', ppt: 'MMAHP Ch 11 PowerPoint Lecture Outline.pdf' },
  { n: 12, chapter: '12. nfectious Diseases in the Populations.pdf', ppt: 'MMAHP Ch 12 PowerPoint Lecture Outline.pdf' },
  { n: 13, chapter: '13. Skin and musculoskeletal.pdf', ppt: 'MMAHP Ch 13 PowerPoint Lecture Outline.pdf' },
  { n: 14, chapter: '14. Infections of the Nervous, Digestive & Resiratory Systems.pdf', ppt: 'MMAHP Ch 14 PowerPoint Lecture Outline.pdf' },
  { n: 16, chapter: '16. Microbial Ecology and Applied microbiology.pdf', ppt: 'MMAHP Ch 16 PowerPoint Lecture Outline.pdf' },
];

const only = process.argv.includes('--only') ? Number(process.argv[process.argv.indexOf('--only') + 1]) : null;

fs.mkdirSync(SCRATCH, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const STOP = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'in', 'to', 'is', 'are', 'for', 'on', 'with', 'its']);
function tokens(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
}
function headingScore(title, heading) {
  const ta = new Set(tokens(title));
  const tb = new Set(tokens(heading));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const w of ta) if (tb.has(w)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}
/**
 * A slide title's real content words (named people, specific terms) usually show up literally
 * INSIDE the matching section's prose even when they share no words with that section's short
 * heading - "Louis Pasteur (1822-1895)" as a slide title matches section 1.6 ("The formative
 * years of microbiology") only because Pasteur is discussed there at length, not because the
 * heading mentions him. This is the stronger of the two signals for exactly that reason: prose
 * is much richer than a heading, so score on fraction of title tokens literally present in the
 * section body.
 */
function contentScore(title, sectionText) {
  const t = tokens(title);
  if (!t.length) return 0;
  const body = ' ' + sectionText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
  let hits = 0;
  for (const w of t) if (body.includes(' ' + w + ' ')) hits++;
  return hits / t.length;
}
function similarity(title, section) {
  const text = section.blocks.map((b) => b.text).join(' ');
  return Math.max(headingScore(title, section.heading), contentScore(title, text) * 0.9);
}

/**
 * Extracts every embedded raster image from a PDF (pdf-parse's getImage(), verified 2026-09-18 to
 * return real, clean, already-isolated figure images - no manual page-screenshot cropping
 * needed), resizes/recompresses each with sharp (originals run up to ~4MB at full page-print
 * resolution, which is far more than a screen needs and would balloon Vercel deployment storage
 * across ~150 figures), and returns them grouped by PDF page number for the caption-matcher below.
 */
async function extractImages(pdfPath) {
  const data = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(data) });
  const result = await parser.getImage({ imageBuffer: true });
  await parser.destroy();
  const byPage = new Map();
  for (const page of result.pages ?? []) {
    const imgs = (page.images ?? []).filter((im) => im.width >= 120 && im.height >= 120); // drop tiny decorative bits
    if (imgs.length) byPage.set(page.pageNumber, imgs);
  }
  return byPage;
}

/**
 * Zips figure-type blocks (page-tagged, in reading order) against the extracted images (also
 * page-tagged). A figure's real image almost always sits on the SAME pdf page as its caption, or
 * the very next page (book layout can push an image to the top of the following page) - so each
 * figure claims the nearest unclaimed image within that window, never further, and never
 * fabricates a placeholder when nothing is close enough.
 */
async function attachImages(chap, pdfPath, chapterId) {
  const byPage = await extractImages(pdfPath);
  const claimed = new Set(); // `${page}:${index}`
  const outDir = path.join(IMG_OUT_DIR, chapterId);
  let saved = 0;

  const figureBlocks = [];
  for (const s of chap.sections) for (const b of s.blocks) if (b.type === 'figure') figureBlocks.push(b);

  const unresolved = [];
  for (const block of figureBlocks) {
    let best = null;
    for (let dp = 0; dp <= 2 && !best; dp++) {
      for (const candidatePage of dp === 0 ? [block.page] : [block.page + dp, block.page - dp]) {
        const imgs = byPage.get(candidatePage);
        if (!imgs) continue;
        const idx = imgs.findIndex((_, i) => !claimed.has(`${candidatePage}:${i}`));
        if (idx !== -1) { best = { page: candidatePage, idx, img: imgs[idx] }; break; }
      }
    }
    if (best) claimed.add(`${best.page}:${best.idx}`);
    else unresolved.push(block);
    if (best) await saveFigureImage(block, best.img, outDir, chapterId, saved++);
  }

  // Fallback pass: a figure whose caption sits more than 2 pages from its own image (book layout
  // can push a big multi-panel figure further down than that) still deserves SOME image rather
  // than none - claim whatever's left, in the same reading order, rather than leaving it blank
  // just because the window missed it. This is still never a guess about WHICH figure an image
  // is (order-preserving, one pass, first-unclaimed-in-page-order), just a wider net.
  if (unresolved.length) {
    const leftover = [];
    for (const [pageNum, imgs] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
      imgs.forEach((img, i) => { if (!claimed.has(`${pageNum}:${i}`)) leftover.push({ pageNum, i, img }); });
    }
    for (const block of unresolved) {
      const next = leftover.shift();
      if (!next) break;
      claimed.add(`${next.pageNum}:${next.i}`);
      await saveFigureImage(block, next.img, outDir, chapterId, saved++);
    }
  }
  return saved;

  async function saveFigureImage(block, img, dir, chId, ordinal) {
    const num = block.text.match(/^(?:Fig(?:ure)?\.?|Table)\s*(\d+\.\d+)/i);
    const slug = (num ? num[1] : `p${block.page}-${ordinal}`).replace(/\./g, '-');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${slug}.jpg`);
    await sharp(Buffer.from(img.data)).resize({ width: 1100, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(file);
    block.image = `${IMG_PUBLIC_BASE}/${chId}/${slug}.jpg`;
  }
}

async function buildOne({ n, chapter, ppt }) {
  const chapterPdf = path.join(SRC_DIR, chapter);
  const pptPdf = path.join(SRC_DIR, ppt);
  if (!fs.existsSync(chapterPdf)) { console.warn(`ch${n}: MISSING chapter PDF: ${chapter}`); return; }
  if (!fs.existsSync(pptPdf)) { console.warn(`ch${n}: MISSING PPT PDF: ${ppt}`); return; }

  const chapterJsonPath = path.join(SCRATCH, `ch${n}-chapter.json`);
  const pptJsonPath = path.join(SCRATCH, `ch${n}-ppt.json`);
  execSync(`node "${path.join(import.meta.dirname, 'parseMmahpChapter.mjs')}" "${chapterPdf}" --number ${n} --out "${chapterJsonPath}"`, { stdio: 'inherit' });
  execSync(`node "${path.join(import.meta.dirname, 'parseMmahpSlides.mjs')}" "${pptPdf}" --number ${n} --out "${pptJsonPath}"`, { stdio: 'inherit' });

  const chap = JSON.parse(fs.readFileSync(chapterJsonPath, 'utf8'));
  const deck = JSON.parse(fs.readFileSync(pptJsonPath, 'utf8'));

  const imagesSaved = await attachImages(chap, chapterPdf, chap.id);
  console.log(`${chap.id}: ${imagesSaved}/${chap.figures.length} figures got a matched image`);

  // Match each titled slide to its best-scoring section; an untitled slide (a continuation
  // table/image) inherits the previous slide's match, since it's virtually always the same topic
  // spilling onto a second PDF page. A slide whose best score is too low to trust goes to
  // `unmatched` instead of forcing a wrong insertion point - see the matcher's own header note.
  const MIN_SCORE = 0.2;
  let lastMatch = null;
  let skippedNoBullets = 0;
  const bySection = new Map(chap.sections.map((s) => [s.number, []]));
  const unmatched = [];

  for (const slide of deck.slides) {
    // A slide with no real "•" bullets is almost always a wrapped multi-column reference table
    // (see parseMmahpSlides.mjs) that can't be reflowed as clean prose - rendering the raw
    // fragments reads as garbage and was reported as such (2026-09-18: nine such slides, one
    // real classification table split across "(1)" through "(9)", rendered as nine empty-looking
    // boxes once their titles had ALSO collapsed to identical text - a second, compounding bug,
    // now fixed in parseMmahpSlides.mjs). Dropping bullet-less slides here is deliberate: no box
    // is better than a box with nothing useful in it.
    if (!slide.bullets.length) { skippedNoBullets++; continue; }
    let targetNumber = null;
    if (slide.title) {
      let best = { number: null, score: 0 };
      for (const s of chap.sections) {
        const score = similarity(slide.title, s);
        if (score > best.score) best = { number: s.number, score };
      }
      if (best.score >= MIN_SCORE) { targetNumber = best.number; lastMatch = best.number; }
    } else if (lastMatch) {
      targetNumber = lastMatch; // continuation slide
    }
    const entry = { slideIndex: slide.index, title: slide.title, bullets: slide.bullets };
    if (targetNumber && bySection.has(targetNumber)) bySection.get(targetNumber).push(entry);
    else unmatched.push(entry);
  }

  const combined = {
    id: chap.id,
    number: n,
    title: chap.title,
    lead: chap.lead,
    openstaxEquivalent: deck.openstaxEquivalent,
    sources: { chapterPdf: chap.sourceFile, pptPdf: deck.sourceFile },
    sections: chap.sections.map((s) => ({
      number: s.number,
      heading: s.heading,
      blocks: s.blocks,
      slides: bySection.get(s.number) || [],
    })),
    unmatchedSlides: unmatched,
  };

  const outPath = path.join(OUT_DIR, `${chap.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2) + '\n');
  const matched = combined.sections.reduce((sum, s) => sum + s.slides.length, 0);
  console.log(`${chap.id}: ${combined.sections.length} sections, ${matched} slide(s) matched, ${unmatched.length} unmatched, ${skippedNoBullets} skipped (no real bullets) -> ${outPath}`);
}

for (const c of CHAPTERS) {
  if (only && c.n !== only) continue;
  await buildOne(c);
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
