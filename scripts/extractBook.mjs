// Extracts text from a calibration book (PDF or EPUB) that lives OUTSIDE the repo.
//
// These books are copyrighted commercial material. This script exists so Claude can read
// them to CALIBRATE difficulty bands and extract topic coverage - it must never write
// verbatim question text into the repo. See docs/afoqt/QUESTION-DOCTRINE.md, "Copyright".
//
// Usage:
//   node scripts/extractBook.mjs "<path>" [--pages 1-40] [--out <file>] [--info]

import { readFileSync, writeFileSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';
import JSZip from 'jszip';

const args = process.argv.slice(2);
const file = args[0];
if (!file) {
  console.error('usage: node scripts/extractBook.mjs "<path to .pdf or .epub>" [--pages 1-40] [--out f] [--info]');
  process.exit(1);
}
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] ?? true);
};
const infoOnly = args.includes('--info');
const outPath = flag('out');
const pagesArg = flag('pages');

async function fromPdf(buf) {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const info = await parser.getInfo();
    const total = info.total ?? info.numPages ?? null;
    if (infoOnly) return { meta: { total, info: info.info ?? null }, text: '' };

    const opts = {};
    if (pagesArg && pagesArg !== true) {
      const [a, b] = String(pagesArg).split('-').map(Number);
      opts.first = a;
      opts.last = Number.isFinite(b) ? b : a;
    }
    const res = await parser.getText(opts);
    return { meta: { total }, text: res.text ?? '' };
  } finally {
    await parser.destroy();
  }
}

async function fromEpub(buf) {
  // An epub is just a zip of XHTML. jszip is already a project dependency.
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files)
    .filter((n) => /\.x?html?$/i.test(n))
    .sort();
  let text = '';
  for (const n of names) {
    const raw = await zip.file(n).async('string');
    text += raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n') + '\n\n';
  }
  return { meta: { total: names.length, unit: 'xhtml files' }, text };
}

const buf = readFileSync(file);
const isEpub = /\.epub$/i.test(file);
const { meta, text } = isEpub ? await fromEpub(buf) : await fromPdf(buf);

console.error(`[extractBook] ${file}`);
console.error(`[extractBook] ${meta.unit ?? 'pages'}: ${meta.total}  chars: ${text.length}`);

if (outPath) {
  writeFileSync(outPath, text, 'utf8');
  console.error(`[extractBook] wrote ${outPath}`);
} else if (!infoOnly) {
  console.log(text.slice(0, 3000));
}
