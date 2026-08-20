// Ingests OATTS - the Air Force's own AFOQT/TBAS familiarization courseware.
//
// OATTS is published by AFPC/AETC as a public service and cleared for public release
// (AFRL 2025-4499, 08 Sep 2025), so unlike the commercial calibration books its questions
// MAY ship verbatim as provenance.kind:'real'. See docs/afoqt/QUESTION-DOCTRINE.md.
//
// Repo: https://github.com/af-oatts/content  (~600 MB total - we fetch only what we need)
//
//   node scripts/fetchOatts.mjs --tree              map the course structure only
//   node scripts/fetchOatts.mjs --fetch <outDir>    download + extract answer-key PDFs

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import JSZip from 'jszip';

const RAW = 'https://raw.githubusercontent.com/af-oatts/content/master';
const args = process.argv.slice(2);
const outDir = args[args.indexOf('--fetch') + 1];
const doFetch = args.includes('--fetch');

async function getManifest(cacheDir) {
  const cached = cacheDir && `${cacheDir}/manifest.yml`;
  if (cached && existsSync(cached)) return parse(readFileSync(cached, 'utf8'));
  const txt = await (await fetch(`${RAW}/manifest.yml`)).text();
  if (cached) writeFileSync(cached, txt);
  return parse(txt);
}

// Flatten the course tree, remembering the path of names down to each leaf module.
function walk(nodes, trail, out) {
  for (const n of nodes ?? []) {
    const name = n.name ?? '(unnamed)';
    if (n.children) walk(n.children, [...trail, name], out);
    else out.push({ id: n.id, name, type: n.type, path: [...trail, name] });
  }
}

const cacheDir = outDir ?? '.';
if (doFetch) mkdirSync(outDir, { recursive: true });
const manifest = await getManifest(doFetch ? outDir : null);

const modules = [];
for (const course of manifest.courses ?? []) walk(course.contents, [course.name ?? '(unnamed course)'], modules);

// The course is the subtest; it is always the first element of the trail.
const subtestOf = (m) => m.path[0];

const graded = modules.filter((m) => /answer key|knowledge check/i.test(m.name));

if (!doFetch) {
  const bySubtest = new Map();
  for (const m of modules) {
    const s = subtestOf(m);
    if (!bySubtest.has(s)) bySubtest.set(s, []);
    bySubtest.get(s).push(m);
  }
  for (const [subtest, list] of bySubtest) {
    console.log(`\n## ${subtest}  (${list.length})`);
    console.log('   ' + list.map((m) => m.name).join(' | '));
  }
  console.log(`\nTOTAL modules: ${modules.length}   graded (answer key / knowledge check): ${graded.length}`);
  process.exit(0);
}

let ok = 0;
for (const m of graded) {
  const zipPath = `${outDir}/${m.id}.zip`;
  if (!existsSync(zipPath)) {
    const res = await fetch(`${RAW}/content/${m.id}.zip`);
    if (!res.ok) { console.error(`  MISS ${m.id} ${res.status} (${m.path.join(' > ')})`); continue; }
    writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  }
  const zip = await JSZip.loadAsync(readFileSync(zipPath));
  const pdfs = Object.keys(zip.files).filter((n) => /\.pdf$/i.test(n));
  for (const p of pdfs) {
    const safe = [...m.path, m.name].join('__').replace(/[^\w-]+/g, '_');
    const dest = `${outDir}/pdf/${safe}.pdf`;
    mkdirSync(`${outDir}/pdf`, { recursive: true });
    writeFileSync(dest, await zip.file(p).async('nodebuffer'));
    ok++;
  }
  console.log(`  ${pdfs.length ? 'OK  ' : 'none'} ${m.path.join(' > ')}`);
}
console.log(`\nExtracted ${ok} PDFs to ${outDir}/pdf/`);
