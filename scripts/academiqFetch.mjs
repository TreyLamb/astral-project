// Pull the CHEM 1210 textbook off AcademiQ (learn-ai-danielscott26.replit.app) headlessly, so it
// can be refreshed without Trey pasting anything into a browser console.
//
// WHY A COOKIE AND NOT A PASSWORD (probed 2026-09-02, do not re-derive):
//   GET /api/login   -> 302 https://replit.com/oidc/auth?...   Replit OIDC
//   GET /api/logout  -> 302 https://replit.com/oidc/session/end?...
//   GET /api/auth/login | /api/auth/callback | /api/register -> 404
// The app has NO password endpoint - authentication is delegated to Replit via OIDC. There is no
// AcademiQ password that could be stored, and storing a REPLIT password would (a) expose that
// whole account and (b) still not work, because an OIDC flow needs interactive consent, PKCE/state
// and likely 2FA. The session cookie the app sets after login is the correct artifact: scoped to
// this one origin, revocable by logging out, and exactly what a browser sends anyway.
//
// HOW TO GET THE COOKIE (once, ~30 seconds; repeat whenever it expires)
//   1. Open the book, logged in. F12 -> Network tab.
//   2. Click any request to /api/... -> Headers -> Request Headers -> "Cookie".
//      (document.cookie will NOT show it - the session cookie is httpOnly.)
//   3. Copy the ENTIRE value and put it in a gitignored .env at the repo root:
//        ACADEMIQ_COOKIE=connect.sid=s%3A....; other=value
//   Revoke it any time by logging out of the site.
//
// USAGE
//   npm run academiq              fetch everything
//   npm run academiq -- --check   just verify the cookie is still valid
//   npm run academiq -- --out "<dir>"
//
// HOW THE CONTENT MAY BE USED (Trey, 2026-09-02 - do not re-litigate, do not conflate the two):
//   His GitHub repo and Vercel deployment are BOTH PRIVATE; the audience is himself and people
//   studying with him. So "ruler, not corpus" means do not mirror the book wholesale - it does NOT
//   mean avoid quoting. Exact definitions, exact terminology, formula statements and real quiz
//   questions MUST be reproduced exactly where a study guide needs them; paraphrasing a definition
//   to dodge a quote teaches the wrong wording and is a defect. Full rule: AGENT-PROMPT.md S2.5.
// Bulk output still lands in the Drive folder rather than the repo, for size/diffability reasons.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://learn-ai-danielscott26.replit.app';
const DEFAULT_OUT = 'G:/My Drive/SupplementalCourseDocs/CHEM 1210/_academiq';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f, d = null) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : (argv[i + 1] ?? d);
};

const OUT = arg('--out', DEFAULT_OUT);
const CHECK_ONLY = has('--check');

function readCookie() {
  if (process.env.ACADEMIQ_COOKIE) return process.env.ACADEMIQ_COOKIE.trim();
  for (const name of ['.env.local', '.env']) {
    const f = path.join(REPO, name);
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, 'utf8').match(/^\s*ACADEMIQ_COOKIE\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const COOKIE = readCookie();
if (!COOKIE) {
  console.error('No ACADEMIQ_COOKIE found.\n');
  console.error('AcademiQ authenticates through Replit OIDC - there is no password to store.');
  console.error('Use the session cookie instead:\n');
  console.error('  1. Open the book logged in, F12 -> Network');
  console.error('  2. Click any /api/... request -> Headers -> Request Headers -> Cookie');
  console.error('  3. Put the whole value in a gitignored .env at the repo root:');
  console.error('       ACADEMIQ_COOKIE=connect.sid=s%3A...\n');
  console.error('(document.cookie will not show it - the session cookie is httpOnly.)');
  process.exit(1);
}

let calls = 0;
async function get(pathname) {
  calls++;
  const res = await fetch(BASE + pathname, {
    headers: { Cookie: COOKIE, Accept: 'application/json' },
    redirect: 'manual',
  });
  // An expired session does not 401 here - it 302s to the Replit OIDC login, which would otherwise
  // parse as a confusing HTML/JSON error further down. Name it plainly.
  if (res.status >= 300 && res.status < 400) throw new Error('SESSION_EXPIRED');
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

const soft = async (p, label) => {
  try { return await get(p); } catch (e) {
    if (e.message === 'SESSION_EXPIRED') throw e;
    console.log(`   (skip ${label}: ${e.message})`);
    return null;
  }
};

function expired() {
  console.error('\nSession expired or revoked.');
  console.error('Grab a fresh Cookie header from the Network tab and update ACADEMIQ_COOKIE.');
  console.error('It must come from a request made while ALREADY signed in. A Cookie header');
  console.error('captured during the login redirect only holds the OIDC handshake');
  console.error('(code_verifier, nonce, state) and can never authenticate.');
  process.exitCode = 2;
  throw new Bail();
}

// Wrapped in main() so the exit path can set process.exitCode and return instead of calling
// process.exit() mid-flight. On Windows, process.exit() while a fetch handle is still open
// prints a libuv assertion (UV_HANDLE_CLOSING) AFTER the real error message, which makes an
// ordinary expired-cookie message look like a crash.
class Bail extends Error {}

async function main() {
  let me;
  try {
    me = await get('/api/auth/user');
  } catch (e) {
    if (e.message === 'SESSION_EXPIRED') expired();
    throw e;
  }
  if (!me?.user) expired();

  console.log(`Signed in as ${me.user.email ?? me.user.id ?? 'unknown'}`);
  if (CHECK_ONLY) { console.log('Cookie is valid.'); return; }

  // /api/courses/:id returns the whole book inline as detail.chapters[].sections[].content.
  // Confirmed 2026-09-02: 10 chapters, 55 sections, ~861k chars. An earlier version also chased
  // /api/sections/:id and found nothing, because the ids live under `chapters` rather than under
  // any key matching /section/i. One request per course is the whole job.
  let courses;
  try {
    courses = await get('/api/courses');
  } catch (e) {
    if (e.message === 'SESSION_EXPIRED') expired();
    throw e;
  }
  const list = Array.isArray(courses) ? courses : (courses.courses ?? []);
  console.log(`${list.length} course(s)`);

  const out = { fetchedAt: new Date().toISOString(), user: me.user.email ?? null, courses: [] };
  let chapters = 0, sections = 0, chars = 0;

  try {
    for (const c of list) {
      const id = c.id ?? c.courseId;
      console.log(`-> ${id} ${c.title ?? c.name ?? ''}`);
      const detail = await soft(`/api/courses/${id}`, `course ${id}`);
      out.courses.push({ summary: c, detail });
      for (const ch of detail?.chapters ?? []) {
        chapters++;
        for (const sec of ch.sections ?? []) { sections++; chars += (sec.content ?? '').length; }
      }
    }
  } catch (e) {
    if (e.message === 'SESSION_EXPIRED') expired();
    throw e;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, 'academiq.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');

  console.log(`\n${calls} API calls.`);
  console.log(`${out.courses.length} course(s), ${chapters} chapters, ${sections} sections, ${Math.round(chars / 1000)}k chars`);
  console.log(`Wrote ${dest}`);
  if (sections === 0) {
    console.log('\nNo sections came back. The id keys may not match /section/i — re-run with the');
    console.log('browser snippet (scripts/browser/academiqCapture.js) and send the capture instead.');
  }
  console.log('\nNext:  npm run courses:scan');
}

try {
  await main();
} catch (e) {
  if (!(e instanceof Bail)) throw e;
}
