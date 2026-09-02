// Pull course material out of Canvas (UVU runs uvu.instructure.com) into
// SupplementalCourseDocs, so Trey never hand-copies a syllabus, an assignment list, or a slide
// deck again.
//
// TWO WAYS IN. Both produce identical folders; pick whichever your Canvas allows.
//
//   A) BROWSER CAPTURE - no token needed, works even when the school disables token creation.
//      Paste scripts/browser/canvasCapture.js into the Canvas tab's devtools console, let it
//      download canvas-capture.json, then:
//          npm run canvas -- --from-capture canvas-capture.json
//
//   B) PERSONAL ACCESS TOKEN - only if https://uvu.instructure.com/profile/settings offers
//      "+ New Access Token". Many institutions turn this off for students.
//          $env:CANVAS_TOKEN = "<paste>"        # PowerShell, this terminal only
//          export CANVAS_TOKEN="<paste>"        # bash
//      Or put CANVAS_TOKEN=... in a gitignored .env.local / .env at the repo root.
//      Never pass it as a command argument - that lands in shell history.
//
// USAGE — use `npm run canvas`, which works from ANY folder in the repo (npm starts scripts at
// the package root). A bare `node scripts/canvasFetch.mjs` only works from the repo root itself.
// The `--` is what passes flags through npm; without it npm eats them.
//
//   npm run canvas -- --from-capture canvas-capture.json   import a browser capture
//   npm run canvas                                         (token) list courses + ids
//   npm run canvas -- --list                               (token) preview, download nothing
//   npm run canvas -- --all                                (token) every active course
//   npm run canvas -- --course 637860                      (token) one course
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
import { fileURLToPath } from 'node:url';

// Repo root, not the caller's cwd - `npm run` always starts at the package root, but a direct
// `node path/to/this.mjs` can be launched from anywhere. Env files are looked up here.
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_HOST = 'uvu.instructure.com';
const DEFAULT_OUT = 'G:/My Drive/SupplementalCourseDocs';

// The Drive folder is outside the repo, so the React dashboard cannot read it at runtime. Same
// call as the worksheets feature: the derived, structured data gets committed, never the source.
const SNAPSHOT = path.join(REPO, 'src/pages/theknowledgebase/courses/data/canvasSchedule.json');

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

/**
 * Folder name for a course. UVU stuffs the section AND the term into course_code
 * ("CHEM 1210 004 | 2026 Fall - Full Term"), which makes a filthy folder name and stops the
 * folder matching the course codes in coursesSeed.js. Reduce it to just "CHEM 1210".
 */
function courseFolder(rec) {
  const raw = String(rec.course_code || rec.name || 'course').split('|')[0].trim();
  const m = raw.match(/^([A-Z]{2,5})\s*(\d{3,4}[A-Z]?)\b/i);
  return slug(m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : raw);
}
const ensure = (d) => fs.mkdirSync(d, { recursive: true });
// Canvas stores due_at in UTC. A deadline of 11:59pm Denver is 05:59Z the NEXT DAY, so
// formatting in UTC reports almost every deadline one day late - which for a scheduling tool is
// the worst possible direction to be wrong in. Format in the course's actual timezone.
const TZ = arg('--tz', 'America/Denver');
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

const when = (iso) => (iso ? dateFmt.format(new Date(iso)) : null);
/** "11:59 PM" - a date alone cannot tell you whether something is due tonight or tomorrow morning. */
const atTime = (iso) => (iso ? timeFmt.format(new Date(iso)) : null);

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

/**
 * Every dated, graded thing in one row shape - this is what SCHEDULE.md is built from.
 *
 * Canvas gives every quiz a shadow ASSIGNMENT carrying the same name, due date and points, so a
 * naive concat lists each quiz twice (MICR 2060 came back 28+21 for 28 real items). The shadow
 * links back via `assignment.quiz_id`, which is the only reliable join - titles get edited apart.
 * We keep the assignment row (it owns the due date the gradebook honours) and fold the quiz's
 * extra fields into it, so a quiz contributes exactly one row either way.
 *
 * Do NOT "simplify" this to dropping every assignment with a quiz_id: CHEM 1210's quizzes
 * endpoint returned 0 rows (New Quizzes lives behind a different API), so its 29 quiz-backed
 * assignments are the ONLY record of those items and dropping them loses the whole course.
 */
/**
 * Turn Canvas's submission blob into one word. Canvas spreads this across four fields that
 * disagree: `missing` is only set once the grader notices, `workflow_state` says 'unsubmitted'
 * for anything never opened including work not yet due, and `excused` overrides both.
 * Order matters here - excused beats graded beats submitted beats overdue.
 */
function statusOf(sub, dueAt) {
  if (!sub) return 'unknown';
  if (sub.excused) return 'excused';
  if (sub.submitted_at) return sub.workflow_state === 'graded' ? 'graded' : 'submitted';
  if (sub.missing) return 'missing';
  if (dueAt && new Date(dueAt) < new Date()) return 'overdue';
  return 'todo';
}

function buildSchedule(rec) {
  const quizzes = rec.quizzes ?? [];
  const byId = new Map(quizzes.map((q) => [q.id, q]));
  const claimed = new Set();

  const rows = (rec.assignments ?? []).map((a) => {
    const q = a.quiz_id != null ? byId.get(a.quiz_id) : null;
    if (q) claimed.add(q.id);
    const sub = a.submission ?? null;
    return {
      kind: q || a.quiz_id != null ? 'quiz' : 'assignment',
      id: a.id, quizId: a.quiz_id ?? null, name: a.name,
      due: when(a.due_at), dueTime: atTime(a.due_at), dueAt: a.due_at ?? null,
      unlock: when(a.unlock_at), lock: when(a.lock_at),
      points: a.points_possible ?? null,
      questions: q?.question_count ?? null,
      timeLimit: q?.time_limit ?? null,
      status: statusOf(sub, a.due_at),
      score: sub?.score ?? null,
      submittedAt: sub?.submitted_at ?? null,
      late: !!sub?.late,
      url: a.html_url,
    };
  });

  // A quiz with no shadow assignment (unpublished, or the assignment call was blocked) still counts.
  for (const q of quizzes) {
    if (claimed.has(q.id)) continue;
    rows.push({
      kind: 'quiz', id: q.id, quizId: q.id, name: q.title,
      due: when(q.due_at), dueTime: atTime(q.due_at), dueAt: q.due_at ?? null,
      unlock: when(q.unlock_at), lock: when(q.lock_at),
      points: q.points_possible ?? null, questions: q.question_count ?? null,
      timeLimit: q.time_limit ?? null,
      status: 'unknown', score: null, submittedAt: null, late: false,
      url: q.html_url,
    });
  }

  return rows.sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999')
    || String(a.name).localeCompare(String(b.name)));
}

/**
 * Write one course's folder. Mode-agnostic: `rec` looks the same whether it came from the live
 * API or from a browser capture, which is the whole reason both paths produce identical output.
 */
async function writeCourse(rec, { downloadFile }) {
  const folder = path.join(OUT, courseFolder(rec));
  const meta = path.join(folder, '_canvas');
  const label = courseFolder(rec);
  const schedule = buildSchedule(rec);

  console.log(`\n=== ${label} — ${rec.name}`);
  console.log(`    -> ${folder}`);
  console.log(`    ${(rec.assignments ?? []).length} assignments · ${(rec.quizzes ?? []).length} quizzes · `
    + `${(rec.modules ?? []).length} modules · ${(rec.pages ?? []).length} pages · ${(rec.files ?? []).length} files`);

  if (LIST_ONLY) {
    for (const s of schedule.filter((x) => x.due).slice(0, 12)) {
      console.log(`      ${s.due}  ${s.kind.padEnd(10)} ${String(s.points ?? '-').padStart(5)} pts  ${s.name}`);
    }
    return { course: label, name: rec.name, dated: schedule.filter((s) => s.due).length, files: 0, schedule };
  }

  ensure(meta);

  if (rec.syllabus_body) {
    fs.writeFileSync(path.join(meta, 'syllabus.md'),
      `# ${rec.name} — syllabus\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}_\n\n${html2md(rec.syllabus_body)}\n`);
  }

  fs.writeFileSync(path.join(meta, 'schedule.json'), JSON.stringify(schedule, null, 2) + '\n');
  fs.writeFileSync(path.join(meta, 'schedule.md'),
    `# ${label} — dated work\n_Pulled from Canvas ${new Date().toISOString().slice(0, 10)}. All times ${TZ}. Canvas due dates are authoritative over a printed syllabus._\n\n`
    + '| Due | Time | Kind | Pts | Name |\n|---|---|---|---|---|\n'
    + schedule.map((s) => `| ${s.due ?? '—'} | ${s.dueTime ?? '—'} | ${s.kind} | ${s.points ?? '—'} | ${s.name} |`).join('\n') + '\n');

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
  return { course: label, name: rec.name, dated: schedule.filter((s) => s.due).length, files: ok, schedule };
}

/**
 * Commit a combined snapshot the React dashboard imports. Written from whatever this run
 * produced, and merged over any course this run did not touch, so importing one course does not
 * wipe the other two out of the dashboard.
 */
function writeSnapshot(results) {
  if (LIST_ONLY) return;
  ensure(path.dirname(SNAPSHOT));
  const prev = fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) : { courses: {} };
  const courses = { ...(prev.courses ?? {}) };
  for (const r of results) {
    courses[r.course] = { code: r.course, name: r.name, schedule: r.schedule };
  }
  fs.writeFileSync(SNAPSHOT, JSON.stringify({
    generatedAt: new Date().toISOString(), timezone: TZ, courses,
  }, null, 2) + '\n');
  console.log(`\nDashboard snapshot: ${path.relative(REPO, SNAPSHOT).split(path.sep).join('/')}`);
}

// --- capture mode ----------------------------------------------------------

if (CAPTURE) {
  // Accept the path relative to wherever the user is standing OR to the repo root, so this
  // works the same whether it was launched by npm (cwd = repo root) or by hand from a subfolder.
  const found = [CAPTURE, path.join(REPO, CAPTURE)].find((p) => fs.existsSync(p));
  if (!found) {
    console.error(`Capture file not found: ${CAPTURE}`);
    console.error(`Looked in ${path.resolve(CAPTURE)} and ${path.join(REPO, CAPTURE)}`);
    console.error('\nRun scripts/browser/canvasCapture.js in the Canvas tab first — it downloads canvas-capture.json.');
    process.exit(1);
  }
  const cap = JSON.parse(fs.readFileSync(found, 'utf8'));
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
  writeSnapshot(summary);
  console.table(summary.map(({ schedule, ...r }) => r));
  if (!LIST_ONLY) {
    console.log('\nNext:  npm run courses:scan   then follow courses/AGENT-PROMPT.md §5');
  }
  process.exit(0);
}

// --- token mode ------------------------------------------------------------

function readToken() {
  if (process.env.CANVAS_TOKEN) return process.env.CANVAS_TOKEN.trim();
  for (const name of ['.env.local', '.env']) {
    const f = path.join(REPO, name);
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
  console.error('  3. npm run canvas -- --from-capture canvas-capture.json\n');
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
writeSnapshot(summary);
console.table(summary.map(({ schedule, ...r }) => r));
