// PASTE THIS INTO THE BROWSER CONSOLE while logged into Canvas.
// ---------------------------------------------------------------------------
// Use this when Canvas will not issue you a personal access token (many schools
// disable "+ New Access Token" for students). It needs no token: your browser
// session is already authenticated, and Canvas's API accepts that session for
// same-origin requests - which is exactly how the Canvas web UI itself works.
//
// HOW TO RUN
//   1. Open https://uvu.instructure.com and make sure you are logged in.
//   2. Press F12 -> "Console" tab.
//   3. If it warns about pasting, type  allow pasting  and press Enter first.
//   4. Paste this whole file, press Enter, and wait. It prints progress.
//   5. It downloads "canvas-capture.json". Put that anywhere in the repo and
//      tell Claude - `node scripts/canvasFetch.mjs --from-capture <path>` turns
//      it into the same folders the token path would have produced.
//
// It only ever READS (GET requests). It changes nothing in Canvas.

(async () => {
  const out = { capturedAt: new Date().toISOString(), host: location.host, courses: [] };

  // Canvas prefixes API JSON with while(1); to block JSON hijacking - strip it.
  const parse = (t) => JSON.parse(t.replace(/^while\s*\(1\)\s*;?/, ''));

  async function get(url) {
    const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return parse(await res.text());
  }

  // Canvas paginates; without following the Link header you silently get 100 rows.
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
    try { return await fn(); } catch (e) { console.warn('   skip ' + label + ': ' + e.message); return null; }
  };

  console.log('Fetching course list...');
  const courses = (await getAll('/courses?enrollment_state=active&include[]=term'))
    .filter((c) => c.name && !c.access_restricted_by_date);
  console.log(courses.length + ' active course(s)');

  for (const c of courses) {
    console.log('-> ' + (c.course_code || c.id) + ' - ' + c.name);
    const id = c.id;
    const rec = {
      id, name: c.name, course_code: c.course_code,
      assignments: (await soft(() => getAll('/courses/' + id + '/assignments'), 'assignments')) || [],
      quizzes: (await soft(() => getAll('/courses/' + id + '/quizzes'), 'quizzes')) || [],
      modules: (await soft(() => getAll('/courses/' + id + '/modules?include[]=items'), 'modules')) || [],
      files: (await soft(() => getAll('/courses/' + id + '/files'), 'files')) || [],
      pages: (await soft(() => getAll('/courses/' + id + '/pages'), 'pages')) || [],
      syllabus_body: null,
      pageBodies: {},
    };

    const full = await soft(() => get(location.origin + '/api/v1/courses/' + id + '?include[]=syllabus_body'), 'syllabus');
    if (full) rec.syllabus_body = full.syllabus_body || null;

    // Page list gives titles only; the body needs a call per page.
    for (const p of rec.pages) {
      const body = await soft(() => get(location.origin + '/api/v1/courses/' + id + '/pages/' + p.url), 'page ' + p.url);
      if (body && body.body) rec.pageBodies[p.url] = body.body;
    }

    console.log('   ' + rec.assignments.length + ' assignments, ' + rec.quizzes.length + ' quizzes, '
      + rec.files.length + ' files, ' + rec.pages.length + ' pages');
    out.courses.push(rec);
  }

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'canvas-capture.json';
  a.click();

  const dated = out.courses.reduce((n, c) =>
    n + c.assignments.filter((x) => x.due_at).length + c.quizzes.filter((x) => x.due_at).length, 0);
  console.log('DONE - ' + out.courses.length + ' courses, ' + dated + ' dated items. Saved canvas-capture.json');
})();
