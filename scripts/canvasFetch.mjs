// Pull course material out of Canvas (UVU runs uvu.instructure.com) into
// SupplementalCourseDocs, so Trey never hand-copies a syllabus, an assignment list, or a slide
// deck again.
//
// TWO WAYS IN. Both produce identical folders; pick whichever your Canvas allows.
//
//   A) BROWSER CAPTURE - no token needed, works even when the school disables token creation.
//      Paste scripts/browser/canvasCapture.js into the Canvas tab's devtools console, let it
//      download canvas-capture.json, then:
//          node scripts/canvasFetch.mjs --from-capture canvas-capture.json
//
//   B) PERSONAL ACCESS TOKEN - only if https://uvu.instructure.com/profile/settings offers
//      "+ New Access Token". Many institutions turn this off for students.
//          $env:CANVAS_TOKEN = "<paste>"        # PowerShell, this terminal only
//          export CANVAS_TOKEN="<paste>"        # bash
//      Or put CANVAS_TOKEN=... in a gitignored .env.local / .env at the repo root.
//      Never pass it as a command argument - that lands in shell history.
//
// USAGE
//   node scripts/canvasFetch.mjs --from-capture <file>   import a browser capture
//   node scripts/canvasFetch.mjs                         (token) list courses + ids
//   node scripts/canvasFetch.mjs --list                  (token) preview, download nothing
//   node scripts/canvasFetch.mjs --all                   (token) every active course
//   node scripts/canvasFetch.mjs --course 637860         (token) one course
//   --no-files    skip attachments      --out "<dir>"    write somewhere else
//   --force       re-download files that already exist
//
// WHERE IT WRITES
//   <out>/<Course Folder>/_canvas/   syllabus.md, schedule.json, schedule.md, modules.md, pages/
//   <out>/<Course Folder>/files/     the actual attachments
//   Everything machine-generated stays under _canvas/ so it never mixes with Trey's own notes.
//   Existing files are skipped unless --force, so re-running is cheap and safe.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_HOST = 'uvu.instructure.com';
const DEFAULT_OUT = 'G:/My Drive/SupplementalCourseDocs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f, d = null) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : (argv[i + 1] ?? d);
};

const HOST = arg('--host', DEFAULT_HOST);
const OUT = arg('--out', DEFAULT_OUT);
const CAPTURE = arg('--from-capture');
const LIST_ONLY = has('--list');
const WANT_FILES = !has('--no-files');
const FORCE = has('--force');

const slug = (s) => String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const when = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : null);

// Canvas returns bodies as HTML. Keep it readable without pulling in a parser.
function html2md(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<\s*h1[^>]*>/gi, '\n# ').replace(/<\s*h2[^>]*>/gi, '\n## ').replace(/<\s*h3[^>]*>/gi, '\n### ')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text.replace(/<[^>]+>/g, '').trim()}](${href})`)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Every dated, graded thing in one row shape - this is what SCHEDULE.md is built from. */
function buildSchedule(rec) {
  return [
    ...(rec.assignments ?? []).map((a) => ({
      kind: 'assignment', id: a.id, name: a.name,
      due: when(a.due_at), unlock: when(a.unlock_at), lock: when(a.lock_at),
      points: a.points_possible ?? null, url: a.html_url,
    })),
    ...(rec.quizzes ?? []).map((q) => ({
      kind: 'quiz', id: q.id, name: q.title,
      due: when(q.due_at), unlock: when(q.unlock_at), lock: when(q.lock_at),
      points: q.points_possible ?? null, questions: q.question_count ?? null,
      timeLimit: q.time_limit ?? null, url: q.html_url,
    })),
  ].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
}

/**
 * Write one course's folder. Mode-agnostic: `rec` looks the same whether it came from the live
 * API or from a browser capture, which is the whole reason both paths produce identical output.
 */
async function writeCourse(rec, { downloadFile }) {
  const folder = path.join(OUT, slug(rec.course_code || rec.name));
  const meta = path.join(folder, '_canvas');
  const label = rec.course_code ?? rec.name;
  const schedule = buildSchedule(rec);

  console.log(`\n=== ${label} — ${rec.name}`);
  console.log(`    -> ${folder}`);
  console.log(`    ${(rec.assignments ?? []).length} assignments · ${(rec.quizzes ?? []).length} quizzes · `
    + `${(rec.modules ?? []).length} modules · ${(rec.pages ?? []).length} pages · ${(rec.files ?? []).length} files`);

  if (LIST_ONLY) {
    for (const s of schedule.filter((x) => x.due).slice(0, 12)) {
      console.log(`      ${s.due}  ${s.kind.padEnd(10)} ${String(s.points ?? '-').padStart(5)} pts  ${s.name}`);
    }
    return { course: label, dated: schedule.filter((s) => s.due).length, files: 0 };
  }

  ensure(meta);

  if (rec.syllabus_body) {
    fs.writeFileSync(path.join(meta, 'syllabus.md'),
      `# ${rec.name} — syllabus\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}_\n\n${html2md(rec.syllabus_body)}\n`);
  }

  fs.writeFileSync(path.join(meta, 'schedule.json'), JSON.stringify(schedule, null, 2) + '\n');
  fs.writeFileSync(path.join(meta, 'schedule.md'),
    `# ${label} — dated work\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}. Canvas due dates are authoritative over a printed syllabus._\n\n`
    + '| Due | Kind | Pts | Name |\n|---|---|---|---|\n'
    + schedule.map((s) => `| ${s.due ?? '—'} | ${s.kind} | ${s.points ?? '—'} | ${s.name} |`).join('\n') + '\n');

  if ((rec.modules ?? []).length) {
    fs.writeFileSync(path.join(meta, 'modules.md'),
      `# ${label} — modules\n\n`
      + rec.modules.map((m) => `## ${m.name}\n` + (m.items ?? []).map((i) => `- [${i.type}] ${i.title}`).join('\n')).join('\n\n') + '\n');
  }

  const pageBodies = rec.pageBodies ?? {};
  if ((rec.pages ?? []).length) {
    ensure(path.join(meta, 'pages'));
    for (const p of rec.pages) {
      const body = pageBodies[p.url] ?? (p.body ?? null);
      if (body) fs.writeFileSync(path.join(meta, 'pages', slug(p.title) + '.md'), `# ${p.title}\n\n${html2md(body)}\n`);
    }
  }

  let ok = 0;
  if (WANT_FILES && (rec.files ?? []).length) {
    const fdir = path.join(folder, 'files');
    ensure(fdir);
    let skipped = 0, failed = 0;
    for (const f of rec.files) {
      const r = await downloadFile(f, fdir);
      if (r === 'ok') ok++;
      else if (r === 'skip') skipped++;
      else { failed++; console.log(`      ${r}: ${f.display_name ?? f.filename}`); }
    }
    console.log(`    files: ${ok} downloaded, ${skipped} already present${failed ? `, ${failed} failed` : ''}`);
    if (failed && CAPTURE) {
      console.log('      (capture file URLs are time-limited — re-run the console snippet for a fresh one)');
    }
  }
  return { course: label, dated: schedule.filter((s) => s.due).length, files: ok };
}

// --- capture mode ----------------------------------------------------------

if (CAPTURE) {
  if (!fs.existsSync(CAPTURE)) {
    console.error(`Capture file not found: ${CAPTURE}`);
    console.error('Run scripts/browser/canvasCapture.js in the Canvas tab first — it downloads canvas-capture.json.');
    process.exit(1);
  }
  const cap = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));
  if (!Array.isArray(cap.courses)) {
    console.error('That file is not a canvas capture (no "courses" array).');
    process.exit(1);
  }
  console.log(`Capture from ${cap.host ?? 'canvas'} taken ${cap.capturedAt ?? 'unknown'} — ${cap.courses.length} course(s)\n`);

  // Canvas file URLs carry their own signed verifier, so they download without a session.
  const downloadFile = async (file, dir) => {
    const dest = path.join(dir, slug(file.display_name ?? file.filename));
    if (fs.existsSync(dest) && !FORCE) return 'skip';
    if (!file.url) return 'no url';
    try {
      const res = await fetch(file.url);
      if (!res.ok) return `fail ${res.status}`;
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return 'ok';
    } catch (e) { return `fail ${e.message}`; }
  };

  const summary = [];
  for (const rec of cap.courses) summary.push(await writeCourse(rec, { downloadFile }));
  console.table(summary);
  if (!LIST_ONLY) {
    console.log('\nNext:  npm run courses:scan   then follow courses/AGENT-PROMPT.md §5');
  }
  process.exit(0);
}

// --- token mode ------------------------------------------------------------

function readToken() {
  if (process.env.CANVAS_TOKEN) return process.env.CANVAS_TOKEN.trim();
  for (const f of ['.env.local', '.env']) {
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, 'utf8').match(/^\s*CANVAS_TOKEN\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const TOKEN = readToken();
if (!TOKEN) {
  console.error('No CANVAS_TOKEN found, and no --from-capture file given.\n');
  console.error('EASIEST (no token needed — works even if your school disables token creation):');
  console.error('  1. Open https://' + HOST + ' logged in, press F12 -> Console');
  console.error('  2. Paste scripts/browser/canvasCapture.js, press Enter, wait for the download');
  console.error('  3. node scripts/canvasFetch.mjs --from-capture canvas-capture.json\n');
  console.error('OR, if https://' + HOST + '/profile/settings offers "+ New Access Token":');
  console.error('  $env:CANVAS_TOKEN = "<paste>"   (PowerShell), then re-run.');
  process.exit(1);
}

let calls = 0;
async function api(pathname) {
  const url = pathname.startsWith('http') ? pathname : `https://${HOST}/api/v1${pathname}`;
  calls++;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (res.status === 401) throw new Error('401 - token rejected. Expired or revoked; make a new one.');
  if (res.status === 403) throw new Error('403 - forbidden (this course hides that tab)');
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Canvas paginates via a Link header; without following it you silently get the first 100 rows. */
async function apiAll(pathname) {
  const sep = pathname.includes('?') ? '&' : '?';
  let next = `https://${HOST}/api/v1${pathname}${sep}per_page=100`;
  const out = [];
  while (next) {
    calls++;
    const res = await fetch(next, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    out.push(...(await res.json()));
    const link = res.headers.get('link') ?? '';
    const m = link.split(',').find((p) => p.includes('rel="next"'));
    next = m ? m.slice(m.indexOf('<') + 1, m.indexOf('>')) : null;
  }
  return out;
}

const soft = async (fn, label) => {
  try { return await fn(); } catch (e) { console.log(`      (skip ${label}: ${e.message})`); return null; }
};

const downloadFile = async (file, dir) => {
  const dest = path.join(dir, slug(file.display_name ?? file.filename));
  if (fs.existsSync(dest) && !FORCE) return 'skip';
  const res = await fetch(file.url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) return `fail ${res.status}`;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return 'ok';
};

const courses = (await apiAll('/courses?enrollment_state=active&include[]=term'))
  .filter((c) => c.name && !c.access_restricted_by_date);
console.log(`${courses.length} active course(s) on ${HOST}\n`);

const only = arg('--course');
if (!only && !has('--all') && !LIST_ONLY) {
  for (const c of courses) console.log(`  ${String(c.id).padEnd(8)} ${c.course_code ?? ''} — ${c.name}`);
  console.log('\nPick one with --course <id>, or take everything with --all. Add --list to preview.');
  process.exit(0);
}

const targets = only ? courses.filter((c) => String(c.id) === String(only)) : courses;
const summary = [];

for (const course of targets) {
  const id = course.id;
  const rec = {
    id, name: course.name, course_code: course.course_code,
    assignments: (await soft(() => apiAll(`/courses/${id}/assignments`), 'assignments')) ?? [],
    quizzes: (await soft(() => apiAll(`/courses/${id}/quizzes`), 'quizzes')) ?? [],
    modules: (await soft(() => apiAll(`/courses/${id}/modules?include[]=items`), 'modules')) ?? [],
    files: WANT_FILES ? ((await soft(() => apiAll(`/courses/${id}/files`), 'files')) ?? []) : [],
    pages: (await soft(() => apiAll(`/courses/${id}/pages`), 'pages')) ?? [],
    pageBodies: {},
    syllabus_body: null,
  };
  const full = await soft(() => api(`/courses/${id}?include[]=syllabus_body`), 'syllabus');
  if (full) rec.syllabus_body = full.syllabus_body ?? null;
  if (!LIST_ONLY) {
    for (const p of rec.pages) {
      const body = await soft(() => api(`/courses/${id}/pages/${p.url}`), `page ${p.url}`);
      if (body?.body) rec.pageBodies[p.url] = body.body;
    }
  }
  summary.push(await writeCourse(rec, { downloadFile }));
}

console.log(`\n${calls} API calls.`);
if (!LIST_ONLY) console.log('Next:  npm run courses:scan   then follow courses/AGENT-PROMPT.md §5');
console.table(summary);
