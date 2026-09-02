// PASTE THIS INTO THE BROWSER CONSOLE while logged into AcademiQ.
// ---------------------------------------------------------------------------
// Pulls Trey's CHEM 1210 textbook (learn-ai-danielscott26.replit.app) out as structured JSON.
//
// WHY THIS WORKS: AcademiQ is a React SPA over a JSON API, and the API authenticates with your
// ordinary session cookie. Probed anonymously 2026-09-02:
//     GET /api/auth/user             -> 200 {"user":null}     (session endpoint)
//     GET /api/courses               -> 401 Unauthorized       (route exists, gated)
//     GET /api/courses/:courseId     -> 401 Unauthorized       (route exists, gated)
//     GET /api/sections/:sectionId   -> 401 Unauthorized       (route exists, gated)
//     GET /api/course/:id  (singular)-> 404 Not found          (wrong form, ruled out)
// A 401 proves the route is real; only the response SHAPE was unknown. So this walks the known
// routes and dumps whatever comes back verbatim rather than assuming field names - it does not
// need to understand the schema to capture it.
//
// HOW TO RUN
//   1. Open the book and make sure you are logged in.
//   2. F12 -> Console. If it warns about pasting, type  allow pasting  and press Enter.
//   3. Paste this whole file, press Enter. It prints progress and may take a minute.
//   4. It downloads "academiq-capture.json". Put it anywhere in the repo and tell Claude.
//
// It only makes GET requests. It changes nothing.
//
// COPYRIGHT: this is Trey's instructor's authored textbook. It is a RULER, NOT A CORPUS - read it
// to set difficulty and extract topic coverage, then GENERATE ORIGINAL questions. The chem module
// deploys publicly to Vercel, so no sentence of this text may ship in it. Same rule the ACS guide
// and the AFOQT calibration books already carry (theknowledgebase/CLAUDE.md).

(async () => {
  const out = { capturedAt: new Date().toISOString(), host: location.host, courses: [], sections: {}, misc: {} };

  async function get(path) {
    const res = await fetch(location.origin + path, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res.json();
  }
  const soft = async (p, label) => {
    try { return await get(p); } catch (e) { console.warn('  skip ' + label + ': ' + e.message); return null; }
  };

  const me = await soft('/api/auth/user', 'auth');
  if (!me || !me.user) {
    console.error('Not logged in — open the book, sign in, then re-run this.');
    return;
  }
  out.misc.user = { id: me.user.id ?? null, email: me.user.email ?? null };
  console.log('Logged in. Fetching courses…');

  const courses = await soft('/api/courses', 'courses');
  if (!courses) { console.error('Could not read /api/courses.'); return; }
  const list = Array.isArray(courses) ? courses : (courses.courses ?? []);
  console.log(list.length + ' course(s)');

  // Section ids can hide under a few plausible key names; collect every uuid-ish id we can see
  // rather than guessing one shape. Dedupe, then fetch each.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sectionIds = new Set();

  function harvest(node, depth = 0) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) { for (const n of node) harvest(n, depth + 1); return; }
    if (typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && UUID.test(v) && /section/i.test(k)) sectionIds.add(v);
      else if (typeof v === 'object') harvest(v, depth + 1);
    }
    // A node that looks like a section itself.
    if (typeof node.id === 'string' && UUID.test(node.id)
        && (node.title || node.name) && !node.courseId === false) sectionIds.add(node.id);
  }

  for (const c of list) {
    const id = c.id ?? c.courseId;
    console.log('-> course ' + id + ' ' + (c.title || c.name || ''));
    const detail = await soft('/api/courses/' + id, 'course ' + id);
    out.courses.push({ summary: c, detail });
    harvest(detail);
    harvest(c);
  }

  console.log(sectionIds.size + ' section id(s) found. Fetching…');
  let n = 0;
  for (const sid of sectionIds) {
    const s = await soft('/api/sections/' + sid, 'section ' + sid);
    if (s) { out.sections[sid] = s; n++; }
    if (n % 10 === 0) console.log('  ' + n + '/' + sectionIds.size);
  }

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'academiq-capture.json';
  a.click();

  console.log('DONE — ' + out.courses.length + ' courses, ' + n + ' sections. Saved academiq-capture.json');
  if (n === 0) {
    console.warn('No sections captured. Open one section of the book, then re-run — the ids may '
      + 'only load with the section view. If it still finds none, tell Claude and paste any red '
      + 'errors above.');
  }
})();
