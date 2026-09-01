// Incremental ingest ledger for course source material.
//
// The problem this solves: Trey's course docs GROW. `chem1210.docx` gains sections every week.
// Without a ledger, every agent pass re-reads the whole file to discover the handful of new
// paragraphs, which burns the budget on material already turned into questions.
//
// So: hash the EXTRACTED TEXT (not the container bytes - a .docx zip changes on every save even
// when the text is identical), chunk it by paragraph, and record which chunk hashes have already
// been ingested. A later scan reports only what is genuinely new.
//
//   node scripts/courseSourceScan.mjs                  report NEW / CHANGED / UNCHANGED
//   node scripts/courseSourceScan.mjs --show "<path>"  print ONLY the new chunks of one file
//   node scripts/courseSourceScan.mjs --mark           record current state as ingested
//   node scripts/courseSourceScan.mjs --mark "<path>"  ...for one file only
//   node scripts/courseSourceScan.mjs --root "<dir>"   scan somewhere else
//
// Manifest: src/pages/theknowledgebase/courses/SOURCE-MANIFEST.json (committed, so the ledger
// survives sessions and machines).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ROOT = 'G:/My Drive/SupplementalCourseDocs';
const MANIFEST = 'src/pages/theknowledgebase/courses/SOURCE-MANIFEST.json';

// Static reference material (a published PDF, a photo of a periodic table) is hashed whole:
// it is not edited in place, so chunk-level tracking would cost extraction time for no benefit.
const WHOLE_FILE = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']);
const TEXTUAL = new Set(['.md', '.txt', '.docx', '.xlsx', '.pptx', '.csv', '.json']);

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : (process.argv[i + 1] ?? '');
};
const has = (name) => process.argv.includes(name);

const ROOT = arg('--root') || DEFAULT_ROOT;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// --- text extraction -------------------------------------------------------

function zipNames(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) return [];
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  const names = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(off + 28);
    names.push(buf.toString('utf8', off + 46, off + 46 + nameLen));
    off += 46 + nameLen + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
  }
  return names;
}

function unzipEntry(buf, wanted) {
  // Minimal stored/deflated zip reader - avoids adding a dependency for two XML files.
  // Walks the central directory from the End Of Central Directory record backwards.
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) return null;
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  const zlib = require('node:zlib');
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (name === wanted) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? raw : zlib.inflateRawSync(raw);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);

function xmlRuns(xml, blockTag, textTag) {
  const blocks = xml.match(new RegExp(`<${blockTag}[ >][\\s\\S]*?</${blockTag}>`, 'g')) ?? [];
  const textRe = new RegExp(`<${textTag}[^>]*>([\\s\\S]*?)</${textTag}>`, 'g');
  return blocks
    .map((b) => [...b.matchAll(textRe)].map((m) => m[1]).join(''))
    .map((s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
    .filter((s) => s.trim());
}

/** @returns {{ ok: true, chunks: string[] } | { ok: false, reason: string }} */
function extract(file) {
  const ext = path.extname(file).toLowerCase();
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch (e) {
    // A .gdoc is a Drive placeholder, not a file: stat reports a size but every read path
    // (fs, Get-Content, Copy-Item) fails at the OS layer. Verified 2026-08-31.
    const why = ext === '.gdoc'
      ? 'Google Drive placeholder - unreadable by any local tool. Export to .docx or .md.'
      : `unreadable (${e.code})`;
    return { ok: false, reason: why };
  }

  if (buf.length === 0) return { ok: true, chunks: [] };
  if (WHOLE_FILE.has(ext)) return { ok: true, chunks: [sha(buf)], whole: true };

  if (ext === '.docx') {
    const xml = unzipEntry(buf, 'word/document.xml');
    if (!xml) return { ok: false, reason: 'docx has no word/document.xml' };
    return { ok: true, chunks: xmlRuns(xml.toString('utf8'), 'w:p', 'w:t') };
  }

  if (ext === '.pptx') {
    // One chunk per SLIDE, not per text run - a slide is the unit a lecture actually moves in,
    // and per-run chunks would make a re-saved deck look entirely new.
    const slides = zipNames(buf)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    const chunks = [];
    for (const name of slides) {
      const xml = unzipEntry(buf, name);
      if (!xml) continue;
      const text = xmlRuns(xml.toString('utf8'), 'a:p', 'a:t').join(' ').trim();
      if (text) chunks.push(`[slide ${chunks.length + 1}] ${text}`);
    }
    return { ok: true, chunks };
  }

  if (ext === '.xlsx') {
    const shared = unzipEntry(buf, 'xl/sharedStrings.xml');
    const strings = shared ? xmlRuns(shared.toString('utf8'), 'si', 't') : [];
    return { ok: true, chunks: strings };
  }

  const text = buf.toString('utf8');
  return { ok: true, chunks: text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) };
}

// --- walk ------------------------------------------------------------------

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('~$') || e.name.startsWith('.')) continue;
    if (e.name === 'README-FOR-AGENTS.md') continue; // our own instructions, not source material
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// --- main ------------------------------------------------------------------

if (!fs.existsSync(ROOT)) {
  console.error(`Source root not found: ${ROOT}`);
  console.error('Pass --root "<dir>" if it moved.');
  process.exit(1);
}

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { root: ROOT, files: {} };
manifest.files ??= {};

const files = walk(ROOT).filter((f) => {
  const ext = path.extname(f).toLowerCase();
  return WHOLE_FILE.has(ext) || TEXTUAL.has(ext) || ext === '.gdoc';
});

const showTarget = has('--show') ? arg('--show') : null;
const markTarget = has('--mark') ? (arg('--mark') || null) : undefined;
const marking = markTarget !== undefined;

const report = { new: [], changed: [], unchanged: [], unreadable: [], empty: [] };

for (const full of files.sort()) {
  const rel = path.relative(ROOT, full).replace(/\\/g, '/');
  const prev = manifest.files[rel];
  const res = extract(full);

  if (!res.ok) {
    report.unreadable.push({ rel, reason: res.reason });
    manifest.files[rel] = { ...(prev ?? {}), unreadable: res.reason, seenAt: new Date().toISOString() };
    continue;
  }
  if (res.chunks.length === 0) {
    report.empty.push({ rel });
    continue;
  }

  const hashes = res.chunks.map(sha);
  const ingested = new Set(prev?.ingestedChunks ?? []);
  const fresh = hashes.filter((h) => !ingested.has(h));

  const entry = {
    chunks: hashes.length,
    whole: !!res.whole,
    ingestedChunks: prev?.ingestedChunks ?? [],
    ingestedAt: prev?.ingestedAt ?? null,
    seenAt: new Date().toISOString(),
  };

  if (!prev || !prev.ingestedAt) report.new.push({ rel, total: hashes.length, fresh: fresh.length });
  else if (fresh.length) report.changed.push({ rel, total: hashes.length, fresh: fresh.length });
  else report.unchanged.push({ rel, total: hashes.length });

  if (showTarget && (rel === showTarget || full.endsWith(showTarget))) {
    console.log(`\n=== NEW CONTENT in ${rel} — ${fresh.length} of ${hashes.length} chunks ===\n`);
    res.chunks.forEach((c, i) => { if (!ingested.has(hashes[i])) console.log(c + '\n'); });
  }

  if (marking && (markTarget === null || rel === markTarget || full.endsWith(markTarget))) {
    entry.ingestedChunks = hashes;
    entry.ingestedAt = new Date().toISOString();
  }
  manifest.files[rel] = entry;
}

if (!showTarget) {
  const line = (label, rows, fmt) => {
    if (!rows.length) return;
    console.log(`\n${label} (${rows.length})`);
    for (const r of rows) console.log('  ' + fmt(r));
  };
  console.log(`Scanned ${files.length} files under ${ROOT}`);
  line('NEW — never ingested', report.new, (r) => `${r.rel}  (${r.total} chunks)`);
  line('CHANGED — has new content since last ingest', report.changed, (r) => `${r.rel}  (+${r.fresh} new of ${r.total})`);
  line('UNCHANGED — fully ingested, SKIP', report.unchanged, (r) => `${r.rel}  (${r.total} chunks)`);
  line('EMPTY — 0 bytes or no extractable text', report.empty, (r) => r.rel);
  line('UNREADABLE — needs action from Trey', report.unreadable, (r) => `${r.rel}\n      ${r.reason}`);

  const work = report.new.length + report.changed.length;
  console.log(`\n${work === 0 ? 'Nothing new to ingest.' : `${work} file(s) need attention.`}`);
  if (work) console.log('Read ONLY the new parts:  node scripts/courseSourceScan.mjs --show "<path>"');
}

if (marking) {
  manifest.root = ROOT;
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nManifest updated: ${MANIFEST}`);
}
