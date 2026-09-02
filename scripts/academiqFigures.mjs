// Download the AcademiQ book's figures and rewrite the imported markdown to point at local files.
//
//   npm run academiq:figures
//   npm run academiq:figures -- --out "<dir>"   (defaults to the _academiq folder)
//
// The figures turned out to need NO authentication - /api/storage/objects/uploads/<uuid>.<ext>
// answers 200 to an anonymous request (checked 2026-09-02). So this needs no cookie, unlike the
// book text itself. 208 distinct figures across the 10 chapters.
//
// Re-running is cheap: an already-downloaded file is skipped unless --force.

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://learn-ai-danielscott26.replit.app';
const DEFAULT_DIR = 'G:/My Drive/SupplementalCourseDocs/CHEM 1210/_academiq';

const argv = process.argv.slice(2);
const arg = (f, d = null) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : (argv[i + 1] ?? d);
};
const DIR = arg('--out', DEFAULT_DIR);
const FORCE = argv.includes('--force');

if (!fs.existsSync(DIR)) {
  console.error(`Not found: ${DIR}\nRun npm run academiq:import first.`);
  process.exit(1);
}

const mdFiles = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const figDir = path.join(DIR, 'figures');
fs.mkdirSync(figDir, { recursive: true });

// Collect every distinct upload path referenced anywhere in the imported markdown.
const refs = new Set();
for (const f of mdFiles) {
  const text = fs.readFileSync(path.join(DIR, f), 'utf8');
  for (const m of text.matchAll(/\/api\/storage\/objects\/(uploads\/[A-Za-z0-9._-]+)/g)) refs.add(m[1]);
}
console.log(`${refs.size} distinct figure(s) referenced across ${mdFiles.length} chapter file(s)`);

let ok = 0, skipped = 0, failed = 0;
for (const ref of refs) {
  const name = ref.replace(/^uploads\//, '');
  const dest = path.join(figDir, name);
  if (fs.existsSync(dest) && !FORCE) { skipped++; continue; }
  try {
    const res = await fetch(`${BASE}/api/storage/objects/${ref}`);
    if (!res.ok) { failed++; console.log(`   fail ${res.status}: ${name}`); continue; }
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
    if (ok % 25 === 0) console.log(`   ${ok} downloaded…`);
  } catch (e) {
    failed++;
    console.log(`   fail ${e.message}: ${name}`);
  }
}
console.log(`${ok} downloaded, ${skipped} already present${failed ? `, ${failed} failed` : ''}`);

// Point the markdown at the local copies so the chapters read offline.
let rewritten = 0;
for (const f of mdFiles) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(
    /https?:\/\/[^)\s]*\/api\/storage\/objects\/uploads\/([A-Za-z0-9._-]+)/g,
    (_, name) => `figures/${name}`,
  );
  if (after !== before) { fs.writeFileSync(p, after); rewritten++; }
}
console.log(`Rewrote image links in ${rewritten} chapter file(s) -> figures/`);
console.log(`Figures in ${figDir}`);
