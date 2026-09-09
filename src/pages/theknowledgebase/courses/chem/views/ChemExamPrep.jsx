import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXAMS, COURSE_CHAPTERS, sectionsForExam } from '../syllabusMap';
import { allChemTemplates } from '../engine/generator';

// Practice scoped to a REAL graded event, by the course's own chapter numbers.
//
// Trey, 2026-09-09: "it looked like the only exam was a full exam for the full course and
// nothing for just chapter 1 and 2 for my course." He was right, and it was not a missing
// feature so much as an unwired one — syllabusMap.js has carried EXAMS and sectionsForExam()
// (both tested) since 2026-09-02, and no screen ever called them.
//
// WHY A CHAPTER DROPDOWN COULD NOT HAVE DONE THIS. The chapter list on the curriculum map is
// in ACS order, and his course is not. His Exam 1 covers course chapters 1-2, which straddle
// ACS chapters 0 (Toolbox) and 1 (Atomic Structure) and pick up nomenclature from a third
// place — so "the questions for my chapters 1 and 2" is not any one entry in that list, and
// no combination of them is right either. The book SECTION is the only coordinate that maps
// cleanly onto what an exam covers, which is exactly why syllabusMap.js exists.
//
// His four midterms are ALL CUMULATIVE (syllabi.json) — Exam 2 covers Ch 1-4, not Ch 3-4 —
// so the section list grows with each exam rather than sliding along.
export default function ChemExamPrep() {
  const navigate = useNavigate();
  const [examId, setExamId] = useState('exam-1');
  const [count, setCount] = useState(20);

  const exam = EXAMS.find((e) => e.id === examId) ?? EXAMS[0];

  const { sections, ready, thin, byChapter } = useMemo(() => {
    const secs = sectionsForExam(exam.id);
    const templates = allChemTemplates();
    const rows = secs.map((s) => ({
      ...s,
      n: templates.filter((t) => t.section === s.section).length,
    }));
    return {
      sections: rows.map((r) => r.section),
      ready: rows.reduce((n, r) => n + r.n, 0),
      thin: rows.filter((r) => r.n === 0),
      byChapter: exam.chapters.map((num) => ({
        num,
        title: COURSE_CHAPTERS.find((c) => c.num === num)?.title ?? `Chapter ${num}`,
        rows: rows.filter((r) => Number(String(r.section).split('-')[0]) === num),
      })),
    };
  }, [exam]);

  const start = () => {
    const params = new URLSearchParams({
      count: String(count),
      sections: sections.join(','),
      label: exam.name,
    });
    navigate(`/TKB/courses/chem/drill/run?${params}`);
  };

  return (
    <div className="chq-config">
      <button className="chq-btn chq-ghost chq-back" onClick={() => navigate('/TKB/courses/chem')}>
        ← All chapters
      </button>
      <h2>Exam prep</h2>
      <p className="chq-note">
        Scoped to what an exam actually covers, using your course's chapter numbers — not the
        ACS ordering the chapter list below uses. Straight from the syllabus.
      </p>

      <section>
        <h3>Which exam</h3>
        <div className="chq-row chq-wrap-row">
          {EXAMS.map((e) => (
            <button
              key={e.id}
              className={'chq-btn' + (e.id === exam.id ? ' chq-primary' : '')}
              onClick={() => setExamId(e.id)}
            >
              {e.name}
              <small className="chq-exam-scope">
                Ch {e.chapters.length > 1 ? `${e.chapters[0]}–${e.chapters[e.chapters.length - 1]}` : e.chapters[0]}
              </small>
            </button>
          ))}
        </div>
        <p className="chq-note">
          Every midterm is <strong>cumulative</strong> — Exam 2 covers Ch 1–4, not just the new
          material. The final is the ACS standardized exam.
        </p>
      </section>

      <section>
        <h3>What that covers — {ready} questions available</h3>
        <ul className="chq-exam-cover">
          {byChapter.map((c) => (
            <li key={c.num}>
              <strong>Ch {c.num} · {c.title}</strong>
              <ul>
                {c.rows.map((r) => (
                  <li key={r.section} className={r.n === 0 ? 'chq-exam-empty' : ''}>
                    <code>{r.section}</code> {r.title}
                    <span>{r.n === 0 ? 'nothing yet' : `${r.n} template${r.n === 1 ? '' : 's'}`}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {thin.length > 0 && (
          <p className="chq-note">
            {thin.length} section{thin.length === 1 ? ' has' : 's have'} no questions written yet
            ({thin.map((s) => s.section).join(', ')}) — this run simply won't draw from
            {thin.length === 1 ? ' it' : ' them'}. Said plainly so a short bank doesn't read as
            full coverage.
          </p>
        )}
      </section>

      <section>
        <h3>Questions</h3>
        <div className="chq-row chq-wrap-row">
          {[10, 20, 40].map((c) => (
            <button key={c} className={'chq-btn' + (count === c ? ' chq-primary' : '')} onClick={() => setCount(c)}>{c}</button>
          ))}
        </div>
      </section>

      <button className="chq-btn chq-primary chq-start" onClick={start} disabled={ready === 0}>
        {ready === 0 ? 'No questions for this exam yet' : `Start ${exam.name} practice — ${count} questions`}
      </button>
    </div>
  );
}
