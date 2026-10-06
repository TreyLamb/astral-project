import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { allChemTemplates } from '../engine/generator';
import { SECTIONS, EXAMS, sectionsFromQuizTitle } from '../syllabusMap';
import { CH1_REAL_ITEMS } from '../ch1Items';
import { useCoursework } from '../../coursework/useCoursework';

// Every CHEM quiz and exam in one place — what it covers, when it is due, how he did, how deep the
// question bank is for it, and one click into practice scoped to exactly its sections.
//
// Trey, 2026-10-06: "organizing and setting up my quizzes for chem" — owner doc
// courses/SCHOOL-OPS.md, workstream 1. Supersedes the never-pushed 09-08 ChemScheduleView.
//
// Status and check-offs come from the shared coursework model, so ticking a quiz off here ticks it
// off on /MFT/school and the MFT calendar too. Section spans come from the quiz TITLE, which the
// syllabus says "names exactly which practice problems it covers".

const THIN = 3; // fewer templates than this for a section an upcoming quiz covers = build more first

const quizNumber = (name) => {
  const m = /Quiz\s+(\d+|Zero)/i.exec(name);
  if (!m) return null;
  return /zero/i.test(m[1]) ? 0 : Number(m[1]);
};

// Which quizzes already have his REAL questions in the bank (from his exported attempt PDFs).
const REAL_BY_QUIZ = CH1_REAL_ITEMS.reduce((acc, it) => {
  const n = quizNumber(it.provenance ?? '');
  if (n != null) acc[n] = (acc[n] ?? 0) + 1;
  return acc;
}, {});

const sectionTitle = (s) => SECTIONS.find((x) => x.section === s)?.title ?? '';

function dueText(t) {
  if (!t.due) return 'no date';
  const d = new Date(`${t.due}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${d}${t.dueTime ? ` · ${t.dueTime}` : ''}`;
}

function statusText(t) {
  if (t.state === 'done') return t.score != null ? `done · ${t.score}/${t.points}` : 'done';
  if (t.state === 'missing') return 'missing (0)';
  if (t.state === 'past-unverified') return 'past due · not confirmed';
  if (t.daysLeft === 0) return 'due today';
  if (t.daysLeft === 1) return 'due tomorrow';
  return `in ${t.daysLeft} days`;
}

export default function ChemQuizCenter() {
  const navigate = useNavigate();
  const cw = useCoursework();

  const bank = useMemo(() => {
    const bySection = {};
    for (const t of allChemTemplates()) {
      if (!t.section) continue;
      const b = (bySection[t.section] ||= { total: 0, real: 0, book: 0 });
      b.total += 1;
      if (t.id.startsWith('chem1-real-quiz') || t.id.startsWith('chem1-real-review') || t.id.startsWith('chem1-qz-')) b.real += 1;
      else if (t.name.startsWith('§') || t.id.startsWith('chem1-real-book')) b.book += 1;
    }
    return bySection;
  }, []);

  const quizzes = cw.items
    .filter((t) => t.code === 'CHEM 1210' && t.kind === 'quiz')
    .map((t) => ({ ...t, num: quizNumber(t.name), sections: sectionsFromQuizTitle(t.name) }))
    .sort((a, b) => (a.num ?? 99) - (b.num ?? 99));

  const exams = EXAMS.map((e) => {
    const item = cw.items.find((t) => t.code === 'CHEM 1210' && t.kind === 'exam' && (e.id === 'final' ? /final/i.test(t.name) : t.name === e.name));
    return { ...e, item };
  });

  const next = quizzes.find((q) => q.state === 'upcoming');
  const practice = (q, count = 10) => {
    const qs = new URLSearchParams({ count: String(count), sections: q.sections.join(','), label: `Quiz ${q.num}` });
    navigate(`/TKB/courses/chem/drill/run?${qs}`);
  };
  const depth = (secs) => secs.reduce((n, s) => n + (bank[s]?.total ?? 0), 0);
  const thinSecs = (secs) => secs.filter((s) => (bank[s]?.total ?? 0) < THIN);

  // Taken but none of his real questions captured — the attempt PDF is the ask. "Missing" with a
  // 0 is NOT taken (there is no attempt to export), so only done items count.
  const needExport = quizzes.filter((q) => q.state === 'done' && !REAL_BY_QUIZ[q.num]);
  const upcomingThin = quizzes.filter((q) => q.state === 'upcoming' && thinSecs(q.sections).length > 0);

  return (
    <div className="chq-config chq-qz">
      <button className="chq-btn chq-ghost chq-back" onClick={() => navigate('/TKB/courses/chem')}>← Chem</button>
      <h2>Quizzes &amp; exams</h2>
      <p className="chq-note">
        ~25 quizzes × 8 pts = <strong>18% of the grade</strong>. Each is due <strong>30 minutes before class</strong>,
        closed-note, and its title names exactly which practice problems it covers — so practice below is scoped to
        those sections. Ticking one off here also ticks it off on <Link to="/MFT/school">/MFT/school</Link>.
      </p>

      {next && (
        <section className="chq-qz-next">
          <h3>Next quiz</h3>
          <div className="chq-qz-next-body">
            <div>
              <strong className="chq-qz-next-name">Quiz {next.num} — Sec {next.sections.join(', ')}</strong>
              <div className="chq-qz-next-when">{dueText(next)} · {statusText(next)}</div>
              <ul className="chq-qz-secs">
                {next.sections.map((s) => (
                  <li key={s}>
                    <code>{s}</code> {sectionTitle(s)}
                    <span className={(bank[s]?.total ?? 0) < THIN ? 'thin' : ''}>{bank[s]?.total ?? 0} question types</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="chq-row chq-wrap-row">
              <button className="chq-btn chq-primary" onClick={() => practice(next, 10)}>Practice (10)</button>
              <button className="chq-btn" onClick={() => practice(next, 20)}>Practice (20)</button>
            </div>
          </div>
        </section>
      )}

      <section>
        <h3>Exams</h3>
        <ul className="chq-qz-exams">
          {exams.map((e) => (
            <li key={e.id}>
              <strong>{e.name}</strong>
              <span>Ch {e.chapters[0]}–{e.chapters[e.chapters.length - 1]}</span>
              <span>{e.item?.due ? dueText(e.item) : 'date not announced'}</span>
              <span>{e.item?.state === 'done' && e.item.score != null ? `${e.item.score}/${e.item.points}` : e.item?.points ? `${e.item.points} pts` : ''}</span>
              <button className="chq-btn chq-ghost" onClick={() => navigate('/TKB/courses/chem/exam')}>Exam prep →</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Every quiz</h3>
        <div className="chq-qz-table-wrap">
          <table className="chq-qz-table">
            <thead>
              <tr>
                <th aria-label="Done" />
                <th>Quiz</th>
                <th>Covers</th>
                <th>Due</th>
                <th>Status</th>
                <th>Bank</th>
                <th aria-label="Practice" />
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => {
                const thin = thinSecs(q.sections);
                return (
                  <tr key={q.id} className={`chq-qz-row ${q.state}`}>
                    <td>
                      <button
                        className={`chq-qz-check${q.done ? ' on' : ''}`}
                        onClick={() => cw.actions.setDone(q.id, !q.done)}
                        aria-pressed={q.done}
                        aria-label={q.done ? `Mark Quiz ${q.num} not done` : `Mark Quiz ${q.num} done`}
                      >
                        {q.done ? '✓' : ''}
                      </button>
                    </td>
                    <td className="chq-qz-num">
                      {q.url ? <a href={q.url} target="_blank" rel="noreferrer">Quiz {q.num}</a> : `Quiz ${q.num}`}
                      {REAL_BY_QUIZ[q.num] ? <span className="chq-qz-real" title="Your actual questions from this quiz are in the bank">★ {REAL_BY_QUIZ[q.num]} real</span> : null}
                    </td>
                    <td className="chq-qz-covers">
                      {q.sections.length
                        ? q.sections.map((s) => <span key={s} title={sectionTitle(s)}>{s}</span>)
                        : <span className="chq-qz-dim">intro</span>}
                    </td>
                    <td className="chq-qz-due">{dueText(q)}</td>
                    <td className={`chq-qz-status ${q.state}`}>{statusText(q)}</td>
                    <td className={`chq-qz-bank${thin.length ? ' thin' : ''}`} title={thin.length ? `Thin: ${thin.join(', ')}` : ''}>
                      {depth(q.sections)}{thin.length ? ' ⚠' : ''}
                    </td>
                    <td>
                      {q.sections.length > 0 && (
                        <button className="chq-btn chq-ghost chq-qz-go" onClick={() => practice(q)}>Practice →</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="chq-note">
          Bank = how many question types exist for that quiz&apos;s sections (book exercises, your real quiz items, and
          generated variations). ⚠ = a section with fewer than {THIN} — practice exists but repeats fast.
          Status is from the Canvas capture of {cw.meta.snapshotAt ? new Date(cw.meta.snapshotAt).toLocaleDateString() : '—'} plus your check-offs.
        </p>
      </section>

      {(needExport.length > 0 || upcomingThin.length > 0) && (
        <section className="chq-qz-asks">
          <h3>Open items</h3>
          {needExport.length > 0 && (
            <p>
              <strong>From you:</strong> the attempt-review PDF for{' '}
              {needExport.map((q) => `Quiz ${q.num}`).join(', ')} — your exact questions, and the ones you missed, are the
              best practice there is. Canvas → the quiz → your attempt → Print → Save as PDF → drop it in
              <code> SupplementalCourseDocs/CHEM 1210/</code>.
            </p>
          )}
          {upcomingThin.length > 0 && (
            <p>
              <strong>On me:</strong> thin banks for {upcomingThin.slice(0, 4).map((q) => `Quiz ${q.num} (${thinSecs(q.sections).join(', ')})`).join('; ')}
              {upcomingThin.length > 4 ? ` and ${upcomingThin.length - 4} more` : ''} — to be built from the book before each is due.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
