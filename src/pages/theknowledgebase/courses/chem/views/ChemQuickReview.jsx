import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHEM_CHAPTERS } from '../curriculum';
import { EXAMS, sectionsForExam, currentExamId, isAheadOfClass, STUDIED_THROUGH_CHAPTER } from '../syllabusMap';
import { mentalChemTemplates, generateChemInstance } from '../engine/generator';
import { ChemReferenceContent } from './ChemResources';

// On-the-go review: the chem drills with all the arithmetic taken out, so a phone in a corridor
// is a usable study surface.
//
// Deliberately NOT another ChemDrillRunner mode. A drill is a sitting — fixed length, answers
// banked, a score and an error breakdown at the end, and it feeds gate/mastery state. This is the
// opposite shape on purpose: an endless stream, the answer revealed the instant you tap, one
// thumb, and nothing recorded anywhere. Getting five questions in while the kettle boils should
// not leave a half-finished run in your history or move a mastery number on four data points.
//
// The pool is every template flagged `mental` in the registry (see engine/generator.js). That
// flag is a claim about ARITHMETIC, not difficulty: naming an ionic compound is band 2 and
// mental; a metric prefix conversion is band 1 and is not.
export default function ChemQuickReview() {
  const navigate = useNavigate();

  // DEFAULTS TO THE EXAM HE IS STUDYING FOR, not to everything. Trey, 2026-09-09: "my quick
  // review is asking me a MOLE question. WHY WOULD A MOLE QUESTION BE IN CHAPTER 1-2 REVIEW?"
  // It defaulted to all ten chapters, so it served gas laws and thermochemistry the week of an
  // exam on chapters 1-2. Exam prep had scoping from the start and this never got it.
  //
  // The scope is by BOOK SECTION, like exam prep — the ACS chapter list this page used to filter
  // by does not line up with his course's chapters, so "chapter 1" there is not his chapter 1.
  const [scope, setScope] = useState(currentExamId);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [picked, setPicked] = useState(null);
  const [tally, setTally] = useState({ right: 0, seen: 0, streak: 0, best: 0 });
  // Same drawer as the drill runner. On a phone this is the ONLY way to check the prefix ladder
  // without losing your place, since navigating away drops the streak.
  const [showRef, setShowRef] = useState(false);

  const pool = useMemo(() => {
    const all = mentalChemTemplates();
    if (scope === 'all') return all;
    if (scope.startsWith('exam-') || scope === 'final') {
      const want = new Set(sectionsForExam(scope).map((x) => x.section));
      return all.filter((t) => t.section != null && want.has(t.section));
    }
    return all.filter((t) => t.chapterId === scope);
  }, [scope]);

  // Every option shows its own count, so an empty scope reads as an honest empty shelf rather
  // than as a bug. Options with nothing in them are disabled, not hidden.
  const counts = useMemo(() => {
    const all = mentalChemTemplates();
    const byExam = Object.fromEntries(EXAMS.map((e) => {
      const want = new Set(sectionsForExam(e.id).map((x) => x.section));
      return [e.id, all.filter((t) => t.section != null && want.has(t.section)).length];
    }));
    const byChapter = Object.fromEntries(CHEM_CHAPTERS.map((c) => [c.id, all.filter((t) => t.chapterId === c.id).length]));
    return { byExam, byChapter, all: all.length };
  }, []);

  const question = useMemo(() => {
    if (pool.length === 0) return null;
    const t = pool[seed % pool.length];
    return generateChemInstance(t.id, seed);
  }, [pool, seed]);

  const next = useCallback(() => {
    setPicked(null);
    setSeed(Math.floor(Math.random() * 0xffffffff));
  }, []);

  const answer = useCallback((i) => {
    if (picked !== null || !question) return;
    setPicked(i);
    const correct = i === question.correctIndex;
    setTally((t) => {
      const streak = correct ? t.streak + 1 : 0;
      return { right: t.right + (correct ? 1 : 0), seen: t.seen + 1, streak, best: Math.max(t.best, streak) };
    });
  }, [picked, question]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (picked !== null) { e.preventDefault(); next(); }
        return;
      }
      const i = ['A', 'B', 'C', 'D'].indexOf(e.key.toUpperCase());
      if (i >= 0) { e.preventDefault(); answer(i); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, next, picked]);

  const scopeTitle = scope === 'all'
    ? 'every chapter'
    : EXAMS.find((e) => e.id === scope)?.name
      ?? CHEM_CHAPTERS.find((c) => c.id === scope)?.title
      ?? scope;

  return (
    <div className="chq-quick">
      <header className="chq-quick-top">
        <button className="chq-btn chq-ghost" onClick={() => navigate('/TKB/courses/chem')}>← Chem</button>
        <div className="chq-quick-score">
          <strong>{tally.right}/{tally.seen}</strong>
          {tally.streak > 1 && <span className="chq-quick-streak">{tally.streak} in a row</span>}
          <button
            className={'chq-btn chq-ghost' + (showRef ? ' chq-primary' : '')}
            aria-expanded={showRef}
            onClick={() => setShowRef((v) => !v)}
          >
            {showRef ? 'Close' : '📖 Ref'}
          </button>
        </div>
      </header>

      {showRef && (
        <aside className="chq-ref-drawer">
          <div className="chq-ref-drawer-head">
            <strong>Reference</strong>
            <button className="chq-btn chq-ghost" onClick={() => setShowRef(false)}>Close</button>
          </div>
          <div className="chq-ref-drawer-body"><ChemReferenceContent /></div>
        </aside>
      )}

      <div className="chq-quick-filter">
        <label htmlFor="chq-quick-scope">Pull from</label>
        <select
          id="chq-quick-scope"
          value={scope}
          onChange={(e) => { setScope(e.target.value); setPicked(null); setSeed(Math.floor(Math.random() * 0xffffffff)); }}
        >
          <optgroup label="Your exams (course chapters)">
            {EXAMS.map((e) => (
              <option key={e.id} value={e.id} disabled={counts.byExam[e.id] === 0}>
                {e.name} — Ch {e.chapters[0]}–{e.chapters[e.chapters.length - 1]} ({counts.byExam[e.id]})
                {isAheadOfClass(e.id) ? ' · not covered yet' : ''}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ahead of class — opt in only">
            <option value="all">Every chapter ({counts.all}) · not covered yet</option>
          </optgroup>
          <optgroup label="One ACS chapter (not your course's numbering)">
            {CHEM_CHAPTERS.map((c) => (
              <option key={c.id} value={c.id} disabled={counts.byChapter[c.id] === 0}>
                {c.title} ({counts.byChapter[c.id]})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {!question ? (
        <p className="chq-note">
          Nothing calculation-free in {scopeTitle} yet. Pick another chapter, or use the full
          drill — it asks everything, arithmetic included.
        </p>
      ) : (
        <>
          <div className="chq-quick-card">
            <p className="chq-stem">{question.stem}</p>
            <ol className="chq-choices">
              {question.choices.map((c, i) => {
                const isAnswer = i === question.correctIndex;
                const state = picked === null ? '' : isAnswer ? ' chq-right' : picked === i ? ' chq-wrong' : ' chq-dim';
                return (
                  <li key={i}>
                    <button
                      className={'chq-choice' + state}
                      onClick={() => answer(i)}
                      disabled={picked !== null}
                    >
                      <span className="chq-letter">{['A', 'B', 'C', 'D'][i]}</span>{c}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {picked !== null && (
            <div className="chq-quick-why">
              {/* Labelled "Why that's wrong:" rather than the drill's "You <why>." Distractor
                  `why` strings are not written to one grammar across the bank — some are verb
                  phrases ("divided volume by mass"), some are statements ("covalent bonding
                  overlap involves valence orbitals") — and "You covalent bonding overlap
                  involves..." is what that second kind produces. A neutral label reads correctly
                  either way, without editing 110 templates to one house style. */}
              {picked !== question.correctIndex && question.whys?.[picked] && (
                <p className="chq-miss-mode">Why that's wrong: {question.whys[picked]}.</p>
              )}
              {question.explanation && <p className="chq-miss-why">{question.explanation}</p>}
            </div>
          )}

          <button className="chq-btn chq-primary chq-quick-next" onClick={next} disabled={picked === null}>
            {picked === null ? 'Pick an answer' : 'Next →'}
          </button>
        </>
      )}

      <p className="chq-hint">
        Scoped to <strong>{scopeTitle}</strong> — {pool.length} question{pool.length === 1 ? '' : 's'},
        all of them recall, naming or classification with no arithmetic. Nothing is scored or saved.
        {' '}Defaults to what your class has actually covered (through Ch {STUDIED_THROUGH_CHAPTER});
        anything past that is opt-in and labelled.
      </p>
    </div>
  );
}
