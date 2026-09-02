// One standard syllabus template, rendered identically for every course.
//
// Trey's ask: "EVERY teacher does their syllabus slightly different. They all fluff it with
// different verbage and warnings etc. I just want one standard template that each syllabus gets
// imported to and the fluff gets kicked out. so it's just real information."
//
// So the SHAPE is fixed (data/syllabi.json) and this view never adapts to the source document.
// A course missing a section shows the section as missing rather than hiding it - "the syllabus
// doesn't say" is itself information, and a silently absent late policy reads as "no penalty".

import { useState } from 'react';
import { Link } from 'react-router-dom';
import SYLLABI from '../data/syllabi.json';
import '../CanvasDash.css';

const COURSE_COLOR = {
  'CHEM 1210': '#0374B5',
  'MICR 2060': '#0B874B',
  'MICR 2065': '#8F3E97',
};

const POLICY_LABELS = {
  attendance: 'Attendance',
  late: 'Late work',
  makeup: 'Makeups',
  retake: 'Retakes',
  drop: 'Dropped / replaced scores',
  materialsAllowed: 'Allowed during assessments',
};

// Skip the `_`-prefixed documentation keys. Filtering on `s.code` alone is NOT enough: `_schema`
// documents its own fields as strings, so `_schema.code` is the truthy string "string - matches
// coursesSeed.js" and the schema block sails through as if it were a course.
const courses = Object.entries(SYLLABI)
  .filter(([k, v]) => !k.startsWith('_') && v && v.code)
  .map(([, v]) => v);

export default function SyllabusView() {
  const [active, setActive] = useState(courses[0]?.code ?? null);
  const s = courses.find((c) => c.code === active);
  const accent = COURSE_COLOR[active] ?? '#6B7780';

  if (!s) return <div className="cdash"><div className="cdash-empty">No syllabi normalized yet.</div></div>;

  const g = s.grading ?? {};
  const hasGrading = (g.components ?? []).length > 0;

  return (
    <div className="cdash">
      <header className="cdash-head">
        <h1>Syllabus</h1>
        <div className="cdash-synced">One template, every course. Fluff removed.</div>
      </header>

      <nav className="syl-tabs">
        {courses.map((c) => (
          <button
            key={c.code}
            className={`syl-tab${c.code === active ? ' syl-tab-on' : ''}`}
            style={c.code === active ? { '--cdash-accent': COURSE_COLOR[c.code] } : undefined}
            onClick={() => setActive(c.code)}
          >
            {c.code}
            {c.status !== 'complete' && <span className="syl-tab-flag">!</span>}
          </button>
        ))}
      </nav>

      {s.status !== 'complete' && (
        <div className="cdash-note">
          <strong>Not yet normalized.</strong> {s.source}
        </div>
      )}

      <div className="syl-title" style={{ borderColor: accent }}>
        <h2 style={{ color: accent }}>{s.code} — {s.title}</h2>
        <div className="syl-facts">
          {s.credits != null && <span>{s.credits} credits</span>}
          {s.meets && <span>{s.meets}</span>}
          {s.location && <span>{s.location}</span>}
        </div>
      </div>

      {s.keyRules?.length > 0 && (
        <section className="syl-block syl-key">
          <h3>What actually changes how you study</h3>
          <ul>{s.keyRules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )}

      {s.conflicts?.length > 0 && (
        <section className="syl-block syl-conflict">
          <h3>⚠ Contradictions in the source ({s.conflicts.length})</h3>
          <p className="syl-conflict-note">
            The syllabus disagrees with itself here. Nothing below silently picks a winner — verify
            with the instructor.
          </p>
          <ul>{s.conflicts.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>
      )}

      <div className="syl-cols">
        <div>
          <section className="syl-block">
            <h3>Grade breakdown</h3>
            {hasGrading ? (
              <>
                <table className="syl-table">
                  <thead>
                    <tr><th>Component</th><th>Pts</th><th>Weight</th></tr>
                  </thead>
                  <tbody>
                    {g.components.map((c) => (
                      <tr key={c.name}>
                        <td>
                          {c.name}
                          {c.note && <div className="syl-sub">{c.note}</div>}
                        </td>
                        <td className="syl-num">{c.points ?? '—'}</td>
                        <td className="syl-num">
                          <span className="syl-bar" style={{ '--w': `${c.weight}%`, background: accent }} />
                          {c.weight != null ? `${c.weight}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>Total</th>
                      <th className="syl-num">{g.totalPoints ?? '—'}</th>
                      <th className="syl-num">
                        {g.components.reduce((n, c) => n + (c.weight ?? 0), 0).toFixed(1)}%
                      </th>
                    </tr>
                  </tfoot>
                </table>
                {g.curved && g.curveNote && <p className="syl-curve">📐 {g.curveNote}</p>}
              </>
            ) : <p className="syl-missing">Not available yet.</p>}
          </section>

          <section className="syl-block">
            <h3>Assessments</h3>
            {s.assessments?.length ? (
              <table className="syl-table">
                <thead><tr><th>What</th><th>Covers</th><th>Pts</th></tr></thead>
                <tbody>
                  {s.assessments.map((a) => (
                    <tr key={a.name}>
                      <td>
                        {a.name}
                        {a.cumulative && <span className="syl-chip">cumulative</span>}
                        {a.format && <div className="syl-sub">{a.format}</div>}
                      </td>
                      <td>{a.covers ?? '—'}</td>
                      <td className="syl-num">{a.points ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="syl-missing">Not available yet.</p>}
          </section>
        </div>

        <div>
          <section className="syl-block">
            <h3>Grading scale</h3>
            {g.scale?.length ? (
              <div className="syl-scale">
                {g.scale.map((r) => (
                  <div className="syl-scale-row" key={r.grade}>
                    <span className="syl-scale-grade">{r.grade}</span>
                    <span className="syl-scale-min">{r.min}%+</span>
                  </div>
                ))}
              </div>
            ) : <p className="syl-missing">Not available yet.</p>}
          </section>

          <section className="syl-block">
            <h3>Instructor</h3>
            {s.instructor?.name ? (
              <dl className="syl-dl">
                <dt>Name</dt><dd>{s.instructor.name}</dd>
                {s.instructor.email && <><dt>Email</dt><dd><a href={`mailto:${s.instructor.email}`}>{s.instructor.email}</a></dd></>}
                {s.instructor.office && <><dt>Office</dt><dd>{s.instructor.office}</dd></>}
                {s.instructor.hours && <><dt>Hours</dt><dd>{s.instructor.hours}</dd></>}
                {s.instructor.phone && <><dt>Phone</dt><dd>{s.instructor.phone}</dd></>}
              </dl>
            ) : <p className="syl-missing">Not available yet.</p>}
          </section>

          <section className="syl-block">
            <h3>Required materials</h3>
            {s.materials?.length ? (
              <ul className="syl-materials">
                {s.materials.map((m) => (
                  <li key={m.item}>
                    <strong>{m.item}</strong>
                    {!m.required && <span className="syl-chip">optional</span>}
                    {m.note && <div className="syl-sub">{m.note}</div>}
                  </li>
                ))}
              </ul>
            ) : <p className="syl-missing">Not available yet.</p>}
          </section>
        </div>
      </div>

      <section className="syl-block">
        <h3>Policies</h3>
        <dl className="syl-dl syl-policies">
          {Object.entries(POLICY_LABELS).map(([k, label]) => (
            <div key={k}>
              <dt>{label}</dt>
              <dd className={s.policies?.[k] ? '' : 'syl-missing'}>
                {s.policies?.[k] ?? 'Not available yet.'}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="cdash-foot">
        <Link to="/TKB/courses/dashboard">← Dashboard</Link>
        <span>Normalized from: {s.source}</span>
      </footer>
    </div>
  );
}
