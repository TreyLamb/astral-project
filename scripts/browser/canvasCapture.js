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

  const me = await soft(() => get(location.origin + '/api/v1/users/self'), 'self');
  if (me) out.user = { id: me.id, name: me.name };

  console.log('Fetching course list...');
  // total_scores adds the running grade to each enrollment (computed_current_score / grade).
  const courses = (await getAll('/courses?enrollment_state=active&include[]=term&include[]=total_scores'))
    .filter((c) => c.name && !c.access_restricted_by_date);

  // Every reply nested under a discussion entry, flattened, so "which of these are mine" is one filter.
  const flatten = (entries, depth = 0) => (entries || []).flatMap((e) => [
    { id: e.id, user_id: e.user_id, created_at: e.created_at, depth, message: e.message },
    ...flatten(e.replies, depth + 1),
  ]);
  console.log(courses.length + ' active course(s)');

  for (const c of courses) {
    console.log('-> ' + (c.course_code || c.id) + ' - ' + c.name);
    const id = c.id;
    const rec = {
      id, name: c.name, course_code: c.course_code,
      // include[]=submission attaches YOUR submission to each assignment (submitted_at, score,
      // workflow_state, missing, late, excused). Without it there is no way to tell a past-due
      // item you finished from one you missed, and a schedule that cannot tell those apart
      // nags about work that is already done.
      assignments: (await soft(() => getAll('/courses/' + id + '/assignments?include[]=submission'), 'assignments')) || [],
      quizzes: (await soft(() => getAll('/courses/' + id + '/quizzes'), 'quizzes')) || [],
      modules: (await soft(() => getAll('/courses/' + id + '/modules?include[]=items'), 'modules')) || [],
      files: (await soft(() => getAll('/courses/' + id + '/files'), 'files')) || [],
      pages: (await soft(() => getAll('/courses/' + id + '/pages'), 'pages')) || [],
      // Calendar entries that are NOT assignments: lectures, review sessions, exam sittings an
      // instructor placed on the calendar without a submission attached. They show on Canvas's own
      // calendar but appear nowhere in /assignments or /quizzes, so without this call they are
      // invisible to us. `type=event` excludes the assignment-backed entries we already have, so
      // nothing is double-counted; all_events skips Canvas's default "next two weeks" window.
      events: (await soft(
        () => getAll('/calendar_events?type=event&all_events=true&context_codes[]=course_' + id),
        'calendar events',
      )) || [],
      syllabus_body: null,
      pageBodies: {},
      // Running grade for this course (the numbers Canvas shows on the Grades tab).
      enrollments: (c.enrollments || []).map((e) => ({
        type: e.type, current_score: e.computed_current_score, current_grade: e.computed_current_grade,
        final_score: e.computed_final_score, final_grade: e.computed_final_grade,
      })),
      // YOUR submissions with the instructor's comments and the rubric points per criterion. The
      // assignments call above only carries score/submitted_at; this is where "why 41/50" lives.
      submissions: (await soft(
        () => getAll('/courses/' + id + '/students/submissions?student_ids[]=self&include[]=submission_comments&include[]=rubric_assessment'),
        'submissions with comments + rubric',
      )) || [],
      discussions: [],
      // Canvas's own stopwatch for every quiz attempt of yours: started_at, finished_at and
      // time_spent (seconds). This is objective "how long did it really take" data for quizzes,
      // OLQs and post-labs, with no self-reporting.
      quizSubmissions: [],
      // Instructor announcements. They OVERRIDE the assignment pages (an instructor can change a
      // requirement by announcement and leave the old assignment text published), so any question
      // about how an item works must be checked against these too.
      announcements: (await soft(
        () => getAll('/announcements?context_codes[]=course_' + id + '&start_date=2026-08-01&end_date=2026-12-31'),
        'announcements',
      )) || [],
    };

    for (const q of rec.quizzes) {
      const r = await soft(() => get(location.origin + '/api/v1/courses/' + id + '/quizzes/' + q.id + '/submissions'), 'quiz submissions ' + q.title);
      for (const s of (r && r.quiz_submissions) || []) {
        if (out.user && s.user_id !== out.user.id) continue;
        rec.quizSubmissions.push({
          quiz_id: q.id, title: q.title, attempt: s.attempt, started_at: s.started_at, finished_at: s.finished_at,
          time_spent: s.time_spent, score: s.score, kept_score: s.kept_score, points_possible: q.points_possible,
          workflow_state: s.workflow_state, attempts_left: s.attempts_left,
        });
      }
    }

    // Discussions: when each topic locks, and which entries are YOURS (with dates). The reply
    // deadline lives in lock_at / due_at; "did I post twice, on which days" lives in `mine`.
    const topics = (await soft(() => getAll('/courses/' + id + '/discussion_topics'), 'discussion topics')) || [];
    for (const t of topics) {
      const view = await soft(() => get(location.origin + '/api/v1/courses/' + id + '/discussion_topics/' + t.id + '/view'), 'discussion ' + t.title);
      const entries = view ? flatten(view.view) : [];
      rec.discussions.push({
        id: t.id, title: t.title, assignment_id: t.assignment_id, posted_at: t.posted_at,
        delayed_post_at: t.delayed_post_at, lock_at: t.lock_at, locked: t.locked, require_initial_post: t.require_initial_post,
        due_at: t.assignment ? t.assignment.due_at : null, points_possible: t.assignment ? t.assignment.points_possible : null,
        last_reply_at: t.last_reply_at, reply_count: t.discussion_subentry_count,
        total_entries: entries.length,
        mine: out.user ? entries.filter((e) => e.user_id === out.user.id) : [],
        message: t.message,
      });
    }

    const full = await soft(() => get(location.origin + '/api/v1/courses/' + id + '?include[]=syllabus_body'), 'syllabus');
    if (full) rec.syllabus_body = full.syllabus_body || null;

    // Instructors very often hide the Files and Pages tabs, which makes /files and /pages return
    // nothing even though the content plainly exists inside the modules. So walk the module items
    // too and resolve anything the tab endpoints missed. (MICR 2060 hid 81 files this way.)
    const items = rec.modules.flatMap((m) => m.items || []);

    const haveFile = new Set(rec.files.map((f) => f.id));
    for (const it of items.filter((i) => i.type === 'File' && i.content_id)) {
      if (haveFile.has(it.content_id)) continue;
      const f = await soft(() => get(location.origin + '/api/v1/courses/' + id + '/files/' + it.content_id), 'file ' + it.title);
      if (f && f.url) { rec.files.push(f); haveFile.add(f.id); }
    }

    const havePage = new Set(rec.pages.map((p) => p.url));
    for (const it of items.filter((i) => i.type === 'Page' && i.page_url)) {
      if (havePage.has(it.page_url)) continue;
      rec.pages.push({ url: it.page_url, title: it.title });
      havePage.add(it.page_url);
    }

    // Page list gives titles only; the body needs a call per page.
    for (const p of rec.pages) {
      const body = await soft(() => get(location.origin + '/api/v1/courses/' + id + '/pages/' + p.url), 'page ' + p.url);
      if (body && body.body) rec.pageBodies[p.url] = body.body;
    }

    console.log('   ' + rec.assignments.length + ' assignments, ' + rec.quizzes.length + ' quizzes, '
      + rec.files.length + ' files, ' + rec.pages.length + ' pages, ' + rec.events.length + ' calendar events');
    out.courses.push(rec);
  }

  // The unattended runner (scripts/canvasAutoCapture.mjs) sets this and reads the result back
  // out of the page instead of triggering a download.
  if (window.__canvasCaptureReturn) {
    window.__canvasCaptureResult = out;
  } else {
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'canvas-capture.json';
    a.click();
  }

  // Canvas gives each quiz a shadow assignment with the same due date, so counting both sides
  // over-reports. Count a quiz only when no assignment already claims it via quiz_id - the same
  // join canvasFetch.mjs's buildSchedule() uses, so the two agree on the total.
  const dated = out.courses.reduce((n, c) => {
    const claimed = new Set(c.assignments.map((a) => a.quiz_id).filter((id) => id != null));
    return n + c.assignments.filter((x) => x.due_at).length
      + c.quizzes.filter((x) => x.due_at && !claimed.has(x.id)).length;
  }, 0);
  console.log('DONE - ' + out.courses.length + ' courses, ' + dated + ' dated items. Saved canvas-capture.json');
})();
