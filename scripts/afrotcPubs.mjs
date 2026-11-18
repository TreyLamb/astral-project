// Builds the /AFROTC Air Force Library from the publication PDFs on Trey's Drive.
//
//   npm run afrotc:pubs              ingest every publication in pubCatalog.js whose file is on Drive
//   npm run afrotc:pubs -- --only=dafi36-2903
//
// For each one: copies the PDF to public/afrotc/pubs/<slug>.pdf, extracts its text page by page, splits it into
// its numbered paragraphs (3.2.1.) and writes public/afrotc/pubs/<slug>.json. pubStatus.json records what was
// hosted, so the page knows which publications it can open and which still need saving from e-Publishing.
// Re-run after dropping a new PDF into <Drive>\My Drive\SupplementalCourseDocs\AFROTC\Publications.

import fs from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { PUBS } from '../src/pages/afrotc/library/pubCatalog.js';
import { splitPublication } from '../src/pages/afrotc/library/pubText.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'public/afrotc/pubs');
const STATUS = path.join(ROOT, 'src/pages/afrotc/library/pubStatus.json');

// The Drive letter differs per machine (see src/pages/theknowledgebase/CLAUDE.md): find the one that has the folder.
const DRIVE = ['G', 'H', 'I', 'J'].map((d) => `${d}:/My Drive/SupplementalCourseDocs`).find((p) => fs.existsSync(p));
if (!DRIVE) { console.error('No Google Drive with SupplementalCourseDocs is mounted.'); process.exit(1); }

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
fs.mkdirSync(OUT, { recursive: true });
const status = fs.existsSync(STATUS) ? JSON.parse(fs.readFileSync(STATUS, 'utf8')) : {};

for (const pub of PUBS) {
  if (only && pub.slug !== only) continue;
  const src = pub.file ? path.join(DRIVE, pub.file) : pub.local ? path.join(ROOT, 'public', pub.local) : null;
  if (!src || !fs.existsSync(src)) {
    if (pub.file) console.log(`MISSING  ${pub.id}: save it to ${pub.file}`);
    delete status[pub.slug];
    continue;
  }
  const bytes = fs.readFileSync(src);
  if (bytes.subarray(0, 5).toString() !== '%PDF-') {
    // e-Publishing's 403 page saved under a .pdf name has happened before (AFH 1 in the AEROS 110 folder).
    console.log(`BROKEN   ${pub.id}: ${src} is not a PDF (it starts "${bytes.subarray(0, 40).toString().replace(/\s+/g, ' ')}"). Save a real copy.`);
    delete status[pub.slug];
    continue;
  }
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  let res;
  try { res = await parser.getText(); } catch (e) {
    console.log(`BROKEN   ${pub.id}: ${src} is not a readable PDF (${e.message}). Save a fresh copy.`);
    delete status[pub.slug];
    continue;
  } finally { await parser.destroy(); }
  const pages = (res.pages ?? []).map((p) => p.text ?? '');
  const { sections, mode } = splitPublication(pages);
  const chars = pages.reduce((a, t) => a + t.length, 0);
  if (chars < pages.length * 200) console.log(`WARNING  ${pub.id}: only ${chars} characters over ${pages.length} pages; it may be a scan with no text layer.`);

  // Det documents already live in public/ (pub.local); everything else is copied in so the site hosts it.
  const pdfUrl = pub.local ?? `/afrotc/pubs/${pub.slug}.pdf`;
  if (!pub.local) fs.copyFileSync(src, path.join(OUT, `${pub.slug}.pdf`));
  fs.writeFileSync(path.join(OUT, `${pub.slug}.json`), JSON.stringify({ slug: pub.slug, pages: pages.length, sections }));
  status[pub.slug] = { pages: pages.length, sections: sections.length, mode, pdf: pdfUrl, mb: +(fs.statSync(src).size / 1e6).toFixed(1) };
  console.log(`OK       ${pub.id}: ${pages.length} pages, ${sections.length} ${mode === 'paragraphs' ? 'numbered paragraphs' : 'pages of text'}`);
}

const ordered = Object.fromEntries(PUBS.filter((p) => status[p.slug]).map((p) => [p.slug, status[p.slug]]));
fs.writeFileSync(STATUS, `${JSON.stringify(ordered, null, 2)}\n`);
