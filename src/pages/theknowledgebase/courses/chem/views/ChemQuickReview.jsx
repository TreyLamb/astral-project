import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHEM_CHAPTERS } from '../curriculum';
import { mentalChemTemplates, generateChemInstance } from '../engine/generator';

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

  const [chapterId, setChapterId] = useState('all');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [picked, setPicked] = useState(null);
  const [tally, setTally] = useState({ right: 0, seen: 0, streak: 0, best: 0 });

  const pool = useMemo(
    () => mentalChemTemplates().filter((t) => chapterId === 'all' || t.chapterId === chapterId),
    [chapterId],
  );

  // Chapters with nothing calculation-free in them are disabled rather than hidden — a missing
  // option reads as a bug, a disabled one with a count reads as an honest empty shelf.
  const perChapter = useMemo(() => {
    const all = mentalChemTemplates();
    return Object.fromEntries(CHEM_CHAPTERS.map((c) => [c.id, all.filter((t) => t.chapterId === c.id).length]));
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

  const chapterTitle = chapterId === 'all'
    ? 'every chapter'
    : CHEM_CHAPTERS.find((c) => c.id === chapterId)?.title ?? chapterId;

  return (
    <div className="chq-quick">
      <header className="chq-quick-top">
        <button className="chq-btn chq-ghost" onClick={() => navigate('/TKB/courses/chem')}>← Chem</button>
        <div className="chq-quick-score">
          <strong>{tally.right}/{tally.seen}</strong>
          {tally.streak > 1 && <span className="chq-quick-streak">{tally.streak} in a row</span>}
        </div>
      </header>

      <div className="chq-quick-filter">
        <label htmlFor="chq-quick-chapter">Pull from</label>
        <select
          id="chq-quick-chapter"
          value={chapterId}
          onChange={(e) => { setChapterId(e.target.value); setPicked(null); setSeed(Math.floor(Math.random() * 0xffffffff)); }}
        >
          <option value="all">Every chapter ({mentalChemTemplates().length})</option>
          {CHEM_CHAPTERS.map((c) => (
            <option key={c.id} value={c.id} disabled={perChapter[c.id] === 0}>
              {c.title} ({perChapter[c.id]})
            </option>
          ))}
        </select>
      </div>

      {!question ? (
        <p className="chq-note">
          Nothing calculation-free in {chapterTitle} yet. Pick another chapter, or use the full
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
        No arithmetic in here — {mentalChemTemplates().length} of the bank's questions are
        recall, naming and classification, which is what actually fits in a spare two minutes.
        Nothing is scored or saved.
      </p>
    </div>
  );
}
