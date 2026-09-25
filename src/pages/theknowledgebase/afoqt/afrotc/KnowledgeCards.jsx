import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAfoqt } from '../AfoqtApp';
import { SUBJECTS, SUBJECT_IDS, CARDS, cardsFor, bySubject } from './cardData';
import { addCardFlag, removeCardFlag, isCardFlagged } from '../afoqtStorage';

/**
 * AFROTC knowledge-card drill: mission/values, creeds/oaths/songs, real AF/Space Force officer
 * and enlisted ranks, customs & greetings, org structure, and acronyms.
 *
 * Self-graded, like a physical flashcard deck: front shows the prompt, "Show answer" reveals the
 * back, then the user marks it "Got it" or "Missed it" themselves. Unlike the rank drill's
 * picture-based multiple choice, most of this content is prose (a creed line, a song lyric, a
 * definition) that doesn't reduce to a clean set of wrong-answer options - self-grading is the
 * honest fit for that shape of content, the same way Anki-style tools handle it.
 *
 * Same settings/selection pattern as RankDrill.jsx (subject checkboxes, presets, persisted
 * selection) but under its own settings key - `settings.afrotcCards` - so it doesn't collide with
 * the rank drill's `settings.afrotc`.
 */

const DEFAULTS = { subjects: SUBJECT_IDS };

const shuffle = (a) => {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function KnowledgeCards() {
  const { progress, updateSettings } = useAfoqt();

  const saved = useMemo(() => progress?.settings?.afrotcCards ?? {}, [progress]);
  const cfg = useMemo(() => ({ ...DEFAULTS, ...saved }), [saved]);
  const setCfg = useCallback(
    (patch) => updateSettings({ afrotcCards: { ...DEFAULTS, ...saved, ...patch } }),
    [updateSettings, saved],
  );

  // Same "don't let a stale or empty selection produce an undrawable deck" guard as RankDrill.
  const selected = useMemo(() => {
    const ids = (cfg.subjects ?? []).filter((id) => SUBJECT_IDS.includes(id));
    return ids.length >= 1 ? ids : SUBJECT_IDS;
  }, [cfg.subjects]);

  const [showSettings, setShowSettings] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Flags live in progress.flaggedCards (afoqtStorage.js), keyed by card id - a manual "come
  // back to this" marker independent of subject selection or how the round is going. The
  // "Flagged" toggle here filters the deck down to just those, same idea as the AFOQT question
  // flag / FlaggedQuestions.jsx, kept as its own namespace since a knowledge-card id is a stable
  // string, not a (templateId, seed) pair.
  const flaggedIds = useMemo(() => new Set(Object.keys(progress?.flaggedCards ?? {})), [progress]);
  const baseDeck = useMemo(() => cardsFor(selected), [selected]);
  const deck = useMemo(
    () => (flaggedOnly ? baseDeck.filter((c) => flaggedIds.has(c.id)) : baseDeck),
    [baseDeck, flaggedOnly, flaggedIds],
  );

  const toggleSubject = (id) => {
    const has = selected.includes(id);
    const next = has ? selected.filter((x) => x !== id) : [...selected, id];
    if (next.length < 1) return;
    setCfg({ subjects: SUBJECT_IDS.filter((x) => next.includes(x)) });
  };

  const allOn = selected.length === SUBJECT_IDS.length;

  return (
    <div className="afq-rotc-drill">
      <div className="afq-rotc-bar">
        <button
          className={'afq-btn afq-rotc-settings-btn' + (showSettings ? ' afq-primary' : '')}
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          Subjects in deck: {selected.length} of {SUBJECTS.length} · {deck.length} card{deck.length === 1 ? '' : 's'}
        </button>
        <button
          type="button"
          className={'afq-btn afq-rotc-flag-toggle' + (flaggedOnly ? ' afq-primary' : '')}
          onClick={() => setFlaggedOnly((v) => !v)}
          aria-pressed={flaggedOnly}
          title={flaggedOnly ? 'Show every card again' : 'Study only the cards you’ve flagged'}
        >
          ⚑ Flagged: {flaggedIds.size}
        </button>
      </div>

      {showSettings && (
        <div className="afq-rotc-settings">
          <h4>Which subjects do you want dealt?</h4>
          <div className="afq-rotc-presets">
            <button
              className={'afq-btn' + (allOn ? ' afq-primary' : '')}
              onClick={() => setCfg({ subjects: SUBJECT_IDS })}
            >
              All subjects
              <span className="afq-rotc-preset-hint">{CARDS.length} cards total</span>
            </button>
          </div>

          <div className="afq-rotc-checks">
            {SUBJECTS.map((s) => {
              const on = selected.includes(s.id);
              const count = CARDS.filter((c) => c.subject === s.id).length;
              return (
                <label key={s.id} className={'afq-rotc-check' + (on ? ' on' : '')}>
                  <input type="checkbox" checked={on} onChange={() => toggleSubject(s.id)} />
                  <span className="afq-rotc-check-txt">
                    <b>{s.label}</b>
                    <span>{s.hint}</span>
                    <em>{count} cards</em>
                  </span>
                </label>
              );
            })}
          </div>

          <p className="afq-note">At least one subject must stay selected.</p>
        </div>
      )}

      <DrillRun key={selected.join(',') + ':' + flaggedOnly} deck={deck} />
    </div>
  );
}

function makeRun(deck) {
  const queue = shuffle(deck);
  return { queue, i: 0, revealed: false, graded: null, firstTry: {}, missed: [], right: 0, wrong: 0, done: false };
}

function DrillRun({ deck }) {
  const { progress, mutate } = useAfoqt();
  const [run, setRun] = useState(() => makeRun(deck));
  const cur = run.done ? null : run.queue[run.i];

  const restart = useCallback(() => setRun(makeRun(deck)), [deck]);

  const toggleFlag = useCallback(() => {
    if (!cur) return;
    mutate((p) =>
      isCardFlagged(p, cur.id)
        ? removeCardFlag(p, cur.id)
        : addCardFlag(p, { id: cur.id, subject: cur.subject, front: cur.front }),
    );
  }, [cur, mutate]);

  const reveal = useCallback(() => setRun((s) => ({ ...s, revealed: true })), []);

  const next = useCallback(() => {
    setRun((s) => {
      const i = s.i + 1;
      if (i < s.queue.length) {
        return { ...s, i, revealed: false, graded: null };
      }
      if (s.missed.length) {
        const queue = shuffle(s.missed);
        return { ...s, queue, missed: [], i: 0, revealed: false, graded: null };
      }
      return { ...s, done: true };
    });
  }, []);

  // Scored on the first look at each card, same reasoning as RankDrill: a re-dealt card still has
  // to be cleared, but grading it again must not move the counters or the percentage stops
  // meaning anything.
  const grade = useCallback((ok) => {
    setRun((s) => {
      if (s.graded !== null || s.done) return s;
      const c = s.queue[s.i];
      const firstTry = { ...s.firstTry };
      let { right, wrong } = s;
      if (!(c.id in firstTry)) {
        firstTry[c.id] = ok;
        if (ok) right++; else wrong++;
      }
      const missed = !ok && !s.missed.some((m) => m.id === c.id) ? [...s.missed, c] : s.missed;
      return { ...s, graded: ok ? 'got' : 'missed', firstTry, right, wrong, missed };
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') { restart(); return; }
      if (run.done) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFlag(); return; }

      if (!run.revealed) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); }
        return;
      }
      if (run.graded === null) {
        if (e.key === 'g' || e.key === 'G') { e.preventDefault(); grade(true); }
        else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); grade(false); }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, reveal, grade, next, restart, toggleFlag]);

  if (!deck.length) {
    return (
      <p className="afq-note">
        No cards match the current filters. Try turning off "Flagged only" or selecting another
        subject.
      </p>
    );
  }

  return (
    <>
      <p className="afq-rotc-score">
        <b className="ok">{run.right}</b> right · <b className="no">{run.wrong}</b> missed
      </p>

      <div className="afq-rotc-prog">
        <i style={{ width: run.done ? '100%' : `${(run.i / run.queue.length) * 100}%` }} />
      </div>
      <div className="afq-rotc-prog-txt">
        <span>{run.done ? 'Deck complete' : `Card ${run.i + 1} of ${run.queue.length}`}</span>
        <span>{run.done ? '' : bySubject(cur.subject)?.label}</span>
      </div>

      {run.done ? (
        <Done run={run} deck={deck} onAgain={restart} />
      ) : (
        <div className="afq-rotc-stage">
          <p className="afq-rotc-prompt">{bySubject(cur.subject)?.label}</p>
          <div className="afq-rotc-kc-card">
            <button
              type="button"
              className={'afq-rotc-flag-btn' + (isCardFlagged(progress, cur.id) ? ' on' : '')}
              onClick={toggleFlag}
              aria-pressed={isCardFlagged(progress, cur.id)}
              title={isCardFlagged(progress, cur.id) ? 'Remove flag (F)' : 'Flag this card (F)'}
            >
              ⚑
            </button>
            <p className="afq-rotc-kc-front">{cur.front}</p>
            {run.revealed && (
              <>
                <hr className="afq-rotc-kc-rule" />
                <p className="afq-rotc-kc-back">{cur.back}</p>
                {cur.note && <p className="afq-note afq-rotc-kc-note">{cur.note}</p>}
              </>
            )}
          </div>

          <div className="afq-rotc-actions">
            {!run.revealed ? (
              <button className="afq-btn afq-primary" onClick={reveal}>Show answer <kbd>Space</kbd></button>
            ) : run.graded === null ? (
              <>
                <button className="afq-btn afq-rotc-grade-miss" onClick={() => grade(false)}>Missed it <kbd>M</kbd></button>
                <button className="afq-btn afq-rotc-grade-got afq-primary" onClick={() => grade(true)}>Got it <kbd>G</kbd></button>
              </>
            ) : (
              <button className="afq-btn afq-primary" onClick={next}>Next <kbd>Space</kbd></button>
            )}
          </div>
        </div>
      )}

      <p className="afq-note afq-rotc-help">
        <kbd>Space</kbd> reveal, then next · <kbd>G</kbd> got it · <kbd>M</kbd> missed it ·{' '}
        <kbd>F</kbd> flag · <kbd>R</kbd> reshuffle.
      </p>
    </>
  );
}

function Done({ run, deck, onAgain }) {
  const fumbled = deck.filter((c) => run.firstTry[c.id] === false);
  const pct = deck.length ? Math.round((run.right / deck.length) * 100) : 0;
  return (
    <div className="afq-rotc-stage afq-rotc-done">
      <h3>Round clear</h3>
      <p className="afq-rotc-big">{run.right}<span>/{deck.length}</span></p>
      <p className="afq-note">{pct}% first time. Every card was cleared before the round ended.</p>
      {fumbled.length > 0 && (
        <div className="afq-rotc-missed">
          <strong>Missed first time</strong>
          <ul>{fumbled.map((c) => <li key={c.id}>{c.front}</li>)}</ul>
        </div>
      )}
      <div className="afq-rotc-actions">
        <button className="afq-btn afq-primary" onClick={onAgain}>Run again <kbd>R</kbd></button>
      </div>
    </div>
  );
}
