// Unpacks a zip produced by scripts/browser/canvasDownloadFiles.js into the matching course's
// files/ folder in SupplementalCourseDocs. Companion to canvasFetch.mjs's --from-capture path -
// that one handles metadata/dated-work; this one handles the actual file bytes when Canvas's
// captured file URLs have no verifier and can't be downloaded server-side (see
// canvasDownloadFiles.js's header for why that happens on this Canvas tenant).
//
// USAGE
//   node scripts/importCanvasZip.mjs <path-to-zip> --course "MICR 2060"
//   node scripts/importCanvasZip.mjs "C:\Users\Trey\Downloads\course-635327-files.zip" --course "MICR 2060"
//
// Existing files are skipped unless --force, matching canvasFetch.mjs's behaviour.

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const argv = process.argv.slice(2);
const zipPath = argv[0];
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : (argv[i + 1] ?? d); };
const COURSE = arg('--course');
const FORCE = argv.includes('--force');
const OUT = arg('--out', 'G:/My Drive/SupplementalCourseDocs');

if (!zipPath || !COURSE) {
  console.error('Usage: node scripts/importCanvasZip.mjs <zip-path> --course "MICR 2060" [--force]');
  process.exit(1);
}
if (!fs.existsSync(zipPath)) {
  console.error('Zip not found: ' + zipPath);
  process.exit(1);
}

const dest = path.join(OUT, COURSE, 'files');
fs.mkdirSync(dest, { recursive: true });

/**
 * Walks local file headers directly off disk, ignoring the central directory entirely, and
 * streams each entry straight to its destination file (no whole-zip buffer in memory - these
 * zips run to ~1GB). This is the recovery path for zips written by an earlier, buggy build of
 * canvasDownloadFiles.js (fixed 2026-09-18: its central directory record was 2 bytes short per
 * entry, which corrupted every relative-offset field after the first and made JSZip refuse the
 * whole archive with "unexpected signature"). The LOCAL file headers were always written
 * correctly - only the index was wrong - so every byte is still recoverable this way. STORE
 * method (0) only, which is all this repo's own zip writer ever produces.
 */
function rawUnzip(zipPath, destDir, force) {
  const fd = fs.openSync(zipPath, 'r');
  const size = fs.fstatSync(fd).size;
  const header = Buffer.alloc(30);
  let pos = 0, ok = 0, skipped = 0;

  while (pos + 30 <= size) {
    fs.readSync(fd, header, 0, 30, pos);
    if (header.readUInt32LE(0) !== 0x04034b50) break; // not a local file header - done

    const method = header.readUInt16LE(8);
    const compSize = header.readUInt32LE(18);
    const nameLen = header.readUInt16LE(26);
    const extraLen = header.readUInt16LE(28);
    const nameBuf = Buffer.alloc(nameLen);
    fs.readSync(fd, nameBuf, 0, nameLen, pos + 30);
    const name = nameBuf.toString('utf8');
    const dataStart = pos + 30 + nameLen + extraLen;

    if (method !== 0) {
      console.warn('  skip ' + name + ': unsupported compression method ' + method);
      pos = dataStart + compSize;
      continue;
    }

    const target = path.join(destDir, name);
    if (fs.existsSync(target) && !force) {
      skipped++;
    } else {
      const outFd = fs.openSync(target, 'w');
      const CHUNK = 8 * 1024 * 1024;
      const buf = Buffer.alloc(CHUNK);
      let remaining = compSize, readPos = dataStart;
      while (remaining > 0) {
        const n = Math.min(CHUNK, remaining);
        const got = fs.readSync(fd, buf, 0, n, readPos);
        fs.writeSync(outFd, buf, 0, got);
        readPos += got;
        remaining -= got;
      }
      fs.closeSync(outFd);
      ok++;
      console.log('  wrote ' + name + ' (' + (compSize / 1024 / 1024).toFixed(1) + ' MB)');
    }
    pos = dataStart + compSize;
  }
  fs.closeSync(fd);
  return { ok, skipped };
}

let ok = 0, skipped = 0;
try {
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const target = path.join(dest, name);
    if (fs.existsSync(target) && !FORCE) { skipped++; continue; }
    fs.writeFileSync(target, await entry.async('nodebuffer'));
    ok++;
    console.log('  wrote ' + name);
  }
} catch (e) {
  console.warn(`JSZip could not read this archive (${e.message}) - falling back to a raw local-header scan.`);
  ({ ok, skipped } = rawUnzip(zipPath, dest, FORCE));
}

console.log(`\n${ok} file(s) written, ${skipped} already present -> ${dest}`);
console.log('Next: npm run courses:scan');
