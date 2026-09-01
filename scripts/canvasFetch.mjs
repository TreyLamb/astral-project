// Pull course material out of Canvas (UVU runs uvu.instructure.com) straight into
// SupplementalCourseDocs, so Trey never hand-copies a syllabus, an assignment list, or a slide
// deck again.
//
// AUTH — read this before running:
//   This uses a Canvas **personal access token**, not a password. Generate one at
//     https://uvu.instructure.com/profile/settings  ->  "+ New Access Token"
//   Give it an expiry. It is revocable from that same page at any time, and it only ever grants
//   what your own account can already see. Never paste it as a command argument (it would land
//   in shell history) - put it in the environment:
//
//     $env:CANVAS_TOKEN = "<paste>"        # PowerShell, this terminal only
//     export CANVAS_TOKEN="<paste>"        # bash
//
//   Or drop it in a gitignored .env.local as CANVAS_TOKEN=... and this script will read it.
//
// USAGE
//   node scripts/canvasFetch.mjs --list                 what's there; downloads nothing
//   node scripts/canvasFetch.mjs --course 637860        one course, everything
//   node scripts/canvasFetch.mjs --all                  every active course
//   node scripts/canvasFetch.mjs --all --no-files       metadata only, skip attachments
//   node scripts/canvasFetch.mjs --all --out "<dir>"    somewhere other than the Drive folder
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
const LIST_ONLY = has('--list');
const WANT_FILES = !has('--no-files');
const FORCE = has('--force');

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
  console.error('No CANVAS_TOKEN found.\n');
  console.error('  1. Go to https://' + HOST + '/profile/settings');
  console.error('  2. "+ New Access Token", give it a purpose and an expiry date');
  console.error('  3. $env:CANVAS_TOKEN = "<paste>"   (PowerShell)  — then re-run\n');
  console.error('It is scoped to your own account and revocable from that same page.');
  process.exit(1);
}

const slug = (s) => String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
const ensure = (d) => fs.mkdirSync(d, { recursive: true });

let calls = 0;
async function api(pathname, { raw = false } = {}) {
  const url = pathname.startsWith('http') ? pathname : `https://${HOST}/api/v1${pathname}`;
  calls++;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (res.status === 401) throw new Error('401 - token rejected. Expired or revoked; make a new one.');
  if (res.status === 403) throw new Error('403 - forbidden (this course hides that tab)');
  if (res.status === 404) throw new Error('404 - not found');
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return raw ? res : res.json();
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

const when = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : null);

async function downloadFile(file, dir) {
  const dest = path.join(dir, slug(file.display_name ?? file.filename));
  if (fs.existsSync(dest) && !FORCE) return 'skip';
  const res = await fetch(file.url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) return `fail ${res.status}`;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return 'ok';
}

// --- main ------------------------------------------------------------------

const courses = (await apiAll('/courses?enrollment_state=active&include[]=term'))
  .filter((c) => c.name && !c.access_restricted_by_date);

console.log(`${courses.length} active course(s) on ${HOST}\n`);

const only = arg('--course');
const targets = only ? courses.filter((c) => String(c.id) === String(only)) : courses;

if (!only && !has('--all') && !LIST_ONLY) {
  for (const c of courses) console.log(`  ${String(c.id).padEnd(8)} ${c.course_code ?? ''} — ${c.name}`);
  console.log('\nPick one with --course <id>, or take everything with --all. Add --list to preview.');
  process.exit(0);
}

const summary = [];

for (const course of targets) {
  const folder = path.join(OUT, slug(course.course_code || course.name));
  const meta = path.join(folder, '_canvas');
  console.log(`\n=== ${course.course_code ?? course.id} — ${course.name}`);
  console.log(`    -> ${folder}`);

  const assignments = (await soft(() => apiAll(`/courses/${course.id}/assignments`), 'assignments')) ?? [];
  const quizzes = (await soft(() => apiAll(`/courses/${course.id}/quizzes`), 'quizzes')) ?? [];
  const modules = (await soft(() => apiAll(`/courses/${course.id}/modules?include[]=items`), 'modules')) ?? [];
  const files = WANT_FILES ? ((await soft(() => apiAll(`/courses/${course.id}/files`), 'files')) ?? []) : [];
  const pages = (await soft(() => apiAll(`/courses/${course.id}/pages`), 'pages')) ?? [];
  const full = await soft(() => api(`/courses/${course.id}?include[]=syllabus_body`), 'syllabus');

  // Every dated, graded thing in one row shape - this is what SCHEDULE.md is built from.
  const schedule = [
    ...assignments.map((a) => ({
      kind: 'assignment', id: a.id, name: a.name,
      due: when(a.due_at), unlock: when(a.unlock_at), lock: when(a.lock_at),
      points: a.points_possible ?? null, url: a.html_url,
    })),
    ...quizzes.map((q) => ({
      kind: 'quiz', id: q.id, name: q.title,
      due: when(q.due_at), unlock: when(q.unlock_at), lock: when(q.lock_at),
      points: q.points_possible ?? null, questions: q.question_count ?? null,
      timeLimit: q.time_limit ?? null, url: q.html_url,
    })),
  ].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));

  console.log(`    ${assignments.length} assignments · ${quizzes.length} quizzes · ${modules.length} modules · ${pages.length} pages · ${files.length} files`);
  summary.push({ course: course.course_code ?? course.name, dated: schedule.filter((s) => s.due).length, files: files.length });

  if (LIST_ONLY) {
    for (const s of schedule.filter((x) => x.due).slice(0, 12)) {
      console.log(`      ${s.due}  ${s.kind.padEnd(10)} ${String(s.points ?? '-').padStart(5)} pts  ${s.name}`);
    }
    continue;
  }

  ensure(meta);

  if (full?.syllabus_body) {
    fs.writeFileSync(path.join(meta, 'syllabus.md'),
      `# ${course.name} — syllabus\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}_\n\n${html2md(full.syllabus_body)}\n`);
  }

  fs.writeFileSync(path.join(meta, 'schedule.json'), JSON.stringify(schedule, null, 2) + '\n');
  fs.writeFileSync(path.join(meta, 'schedule.md'),
    `# ${course.course_code ?? course.name} — dated work\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}. Canvas due dates are authoritative over a printed syllabus._\n\n`
    + '| Due | Kind | Pts | Name |\n|---|---|---|---|\n'
    + schedule.map((s) => `| ${s.due ?? '—'} | ${s.kind} | ${s.points ?? '—'} | ${s.name} |`).join('\n') + '\n');

  if (modules.length) {
    fs.writeFileSync(path.join(meta, 'modules.md'),
      `# ${course.course_code ?? course.name} — modules\n\n`
      + modules.map((m) => `## ${m.name}\n` + (m.items ?? []).map((i) => `- [${i.type}] ${i.title}`).join('\n')).join('\n\n') + '\n');
  }

  if (pages.length) {
    ensure(path.join(meta, 'pages'));
    for (const p of pages) {
      const body = await soft(() => api(`/courses/${course.id}/pages/${p.url}`), `page ${p.url}`);
      if (body?.body) fs.writeFileSync(path.join(meta, 'pages', slug(p.title) + '.md'), `# ${p.title}\n\n${html2md(body.body)}\n`);
    }
  }

  if (files.length) {
    const fdir = path.join(folder, 'files');
    ensure(fdir);
    let ok = 0, skipped = 0;
    for (const f of files) {
      const r = await downloadFile(f, fdir);
      if (r === 'ok') ok++; else if (r === 'skip') skipped++; else console.log(`      ${r}: ${f.display_name}`);
    }
    console.log(`    files: ${ok} downloaded, ${skipped} already present`);
  }
}

console.log(`\n${calls} API calls.`);
if (!LIST_ONLY) {
  console.log('\nNext:');
  console.log('  npm run courses:scan          see what the ledger considers new');
  console.log('  Then follow courses/AGENT-PROMPT.md §5 to turn it into study tools.');
}
console.table(summary);
