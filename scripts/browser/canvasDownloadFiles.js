// PASTE THIS INTO THE BROWSER CONSOLE while logged into Canvas, on ANY page of the course.
// ---------------------------------------------------------------------------
// Fixes a real gap canvasCapture.js can't solve by itself: the file URLs it captures
// (`https://uvu.instructure.com/files/<id>/download?download_frd=1`) carry NO signed verifier
// on this Canvas tenant, so canvasFetch.mjs's server-side download (no session, no cookies)
// gets redirected into UVU's SAML login and fails on every single file - confirmed 2026-09-18,
// 76/76 failed on MICR 2060, and it is not a "link expired" issue: 0 of 76 captured URLs had a
// `?verifier=` param to begin with, so a fresh capture would fail identically.
//
// This script instead fetches every file's bytes FROM INSIDE THE BROWSER TAB, where the
// session cookie is present and same-origin requests are authenticated normally - the same
// trick canvasCapture.js already uses for the metadata calls. It zips them client-side (no
// compression - PDFs are already compressed, so this just avoids writing a deflate
// implementation for no size benefit) and downloads ONE .zip.
//
// HOW TO RUN
//   1. Open the course in Canvas (any page - e.g. https://uvu.instructure.com/courses/635327),
//      make sure you're logged in.
//   2. Press F12 -> "Console" tab. Type `allow pasting` first if it warns.
//   3. Edit COURSE_ID below if needed (it defaults to MICR 2060 = 635327), paste, Enter.
//   4. Wait - it prints progress per file, then downloads "<course>-files.zip".
//   5. Drop that zip anywhere and tell Claude; it unzips it into
//      G:\My Drive\SupplementalCourseDocs\<COURSE>\files\ itself.
//
// Re-run with a different COURSE_ID for CHEM 1210 (640153) or MICR 2065 (637860) if those ever
// hit the same wall (as of 2026-09-18 CHEM shows 0 files and MICR 2065 only 1, both fine as-is).

const COURSE_ID = 635327; // MICR 2060

(async () => {
  const parse = (t) => JSON.parse(t.replace(/^while\s*\(1\)\s*;?/, ''));
  async function get(url) {
    const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return parse(await res.text());
  }
  async function getAll(pathname) {
    const sep = pathname.includes('?') ? '&' : '?';
    let next = location.origin + '/api/v1' + pathname + sep + 'per_page=100';
    const rows = [];
    while (next) {
      const res = await fetch(next, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      rows.push(...parse(await res.text()));
      const link = res.headers.get('link') || '';
      const m = link.split(',').find((p) => p.includes('rel="next"'));
      next = m ? m.slice(m.indexOf('<') + 1, m.indexOf('>')) : null;
    }
    return rows;
  }

  const soft = async (fn, label) => {
    try { return await fn(); } catch (e) { console.warn('   skip ' + label + ': ' + e.message); return []; }
  };

  console.log('Listing files for course ' + COURSE_ID + '...');
  // The plain /files listing 403s outright when the instructor hides the Files tab (not just a
  // missing nav link - the endpoint itself refuses), which is exactly MICR 2060's case. Don't
  // let that kill the whole run: fall through to the module-item resolution below, same as
  // canvasCapture.js already does successfully for this same course.
  const files = await soft(() => getAll('/courses/' + COURSE_ID + '/files'), 'files listing (likely hidden tab - falling back to modules)');

  // Same hidden-Files-tab fallback canvasCapture.js uses: walk module items for any file the
  // plain listing missed.
  const modules = await soft(() => getAll('/courses/' + COURSE_ID + '/modules?include[]=items'), 'modules');
  const haveFile = new Set(files.map((f) => f.id));
  for (const it of modules.flatMap((m) => m.items || [])) {
    if (it.type !== 'File' || !it.content_id || haveFile.has(it.content_id)) continue;
    try {
      const f = await get(location.origin + '/api/v1/courses/' + COURSE_ID + '/files/' + it.content_id);
      if (f && f.url) { files.push(f); haveFile.add(f.id); }
    } catch (e) { console.warn('   skip module file ' + it.title + ': ' + e.message); }
  }
  console.log(files.length + ' file(s) total. Downloading bytes (this can take a while for large PDFs)...');

  // ---- minimal STORE-only ZIP writer (no compression, no dependency) ----
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function u16(n) { return [n & 0xff, (n >>> 8) & 0xff]; }
  function u32(n) { return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]; }
  const enc = new TextEncoder();

  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const dosTime = 0, dosDate = 0x21; // fixed placeholder timestamp - exact date doesn't matter here

  function addEntry(name, bytes) {
    const nameBytes = enc.encode(name);
    const crc = crc32(bytes);
    const size = bytes.length;

    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // local file header sig
      20, 0,                   // version needed
      0, 0,                    // flags
      0, 0,                    // method 0 = STORE
      ...u16(dosTime), ...u16(dosDate),
      ...u32(crc), ...u32(size), ...u32(size),
      ...u16(nameBytes.length), 0, 0, // extra len
    ]);
    localParts.push(local, nameBytes, bytes);

    const central = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02, // central dir header sig
      20, 0, 20, 0,
      0, 0, 0, 0,
      ...u16(dosTime), ...u16(dosDate),
      ...u32(crc), ...u32(size), ...u32(size),
      ...u16(nameBytes.length), 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, // internal attrs (2) + external attrs (4) - was 2 bytes short, shifted every offset after entry 1
      ...u32(offset),
    ]);
    centralParts.push(central, nameBytes);

    offset += local.length + nameBytes.length + bytes.length;
  }

  let ok = 0, failed = 0;
  for (const f of files) {
    const name = (f.display_name || f.filename || String(f.id)).replace(/[\\/]/g, '-');
    try {
      const res = await fetch(f.url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(String(res.status));
      const bytes = new Uint8Array(await res.arrayBuffer());
      addEntry(name, bytes);
      ok++;
      console.log('   ok: ' + name + ' (' + (bytes.length / 1024 / 1024).toFixed(1) + ' MB)');
    } catch (e) {
      failed++;
      console.warn('   FAIL ' + name + ': ' + e.message);
    }
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const p of centralParts) centralSize += p.length;

  const end = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    0, 0, 0, 0,
    ...u16(ok), ...u16(ok),
    ...u32(centralSize), ...u32(centralStart),
    0, 0,
  ]);

  const blob = new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'course-' + COURSE_ID + '-files.zip';
  a.click();

  console.log('DONE - ' + ok + ' file(s) zipped, ' + failed + ' failed. Saved course-' + COURSE_ID + '-files.zip'
    + ' (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB)');
})();
