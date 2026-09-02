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
// HOW THE CONTENT MAY BE USED (Trey, 2026-09-02 - do not conflate the two rules):
//   Private repo, private deployment, audience is Trey and his study group. "Ruler, not corpus"
//   forbids mirroring the book wholesale; it does NOT forbid quoting. Exact definitions, exact
//   terminology and real quiz questions MUST stay exact where a study guide needs them.
//   Full rule: courses/AGENT-PROMPT.md S2.5.

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

  // /api/courses/:id returns the WHOLE book inline: detail.chapters[].sections[].content (HTML).
  // Confirmed 2026-09-02 against the real capture - 10 chapters, 55 sections, ~861k chars. An
  // earlier version of this script also chased /api/sections/:id separately and found nothing,
  // because the ids live under `chapters`, not under any key matching /section/i. That call is
  // unnecessary; one request per course is the whole job.
  let chapters = 0, sections = 0, chars = 0;
  for (const c of list) {
    const id = c.id ?? c.courseId;
    console.log('-> course ' + id + ' ' + (c.title || c.name || ''));
    const detail = await soft('/api/courses/' + id, 'course ' + id);
    out.courses.push({ summary: c, detail });
    for (const ch of (detail && detail.chapters) || []) {
      chapters++;
      for (const s of ch.sections || []) { sections++; chars += (s.content || '').length; }
    }
  }
  const n = sections;
  console.log(chapters + ' chapters, ' + sections + ' sections, ' + Math.round(chars / 1000) + 'k chars');

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'academiq-capture.json';
  a.click();

  console.log('DONE — ' + out.courses.length + ' course(s), ' + n + ' sections. Saved academiq-capture.json');
  console.log('Next: hand it to Claude, or run  npm run academiq:import');
  if (n === 0) console.warn('No sections found — tell Claude and paste any red errors above.');
})();
