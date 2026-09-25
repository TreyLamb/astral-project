import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAfoqt } from '../AfoqtApp';
import { SUBJECTS, SUBJECT_IDS, CARDS, PRESETS, cardsFor, bySubject } from './cardData';
import { addCardFlag, removeCardFlag, isCardFlagged } from '../afoqtStorage';

/**
 * AFROTC knowledge-card drill: mission/values, creeds/oaths/songs, real AF/Space Force officer
 * and enlisted ranks, customs & greetings, org structure, and acronyms.
 *
 * Plain flip-through, like a physical flashcard deck: front shows the prompt, "Show answer"
 * reveals the back, "Next" moves on. No self-grading (Trey removed the Got it/Missed it step,
 * 2026-09-25 - not something he asked for) - flagging a card (see toggleFlag below) is the only
 * "come back to this" mechanism, and it's a deliberate marker, not a graded miss.
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
  const matchesPreset = (ids) => selected.length === ids.length && ids.every((id) => selected.includes(id));

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
            {PRESETS.map((p) => {
              const count = CARDS.filter((c) => p.subjects.includes(c.subject)).length;
              return (
                <button
                  key={p.id}
                  className={'afq-btn' + (matchesPreset(p.subjects) ? ' afq-primary' : '')}
                  onClick={() => setCfg({ subjects: p.subjects })}
                  title={p.hint}
                >
                  {p.label}
                  <span className="afq-rotc-preset-hint">{count} cards</span>
                </button>
              );
            })}
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
  return { queue, i: 0, revealed: false, done: false };
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
      if (i < s.queue.length) return { ...s, i, revealed: false };
      return { ...s, done: true };
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

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        run.revealed ? next() : reveal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, reveal, next, restart, toggleFlag]);

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
      <div className="afq-rotc-prog">
        <i style={{ width: run.done ? '100%' : `${(run.i / run.queue.length) * 100}%` }} />
      </div>
      <div className="afq-rotc-prog-txt">
        <span>{run.done ? 'Deck complete' : `Card ${run.i + 1} of ${run.queue.length}`}</span>
        <span>{run.done ? '' : bySubject(cur.subject)?.label}</span>
      </div>

      {run.done ? (
        <Done deck={deck} onAgain={restart} />
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
            ) : (
              <button className="afq-btn afq-primary" onClick={next}>Next <kbd>Space</kbd></button>
            )}
          </div>
        </div>
      )}

      <p className="afq-note afq-rotc-help">
        <kbd>Space</kbd> reveal, then next · <kbd>F</kbd> flag · <kbd>R</kbd> reshuffle.
      </p>
    </>
  );
}

function Done({ deck, onAgain }) {
  return (
    <div className="afq-rotc-stage afq-rotc-done">
      <h3>Deck complete</h3>
      <p className="afq-note">Went through all {deck.length} card{deck.length === 1 ? '' : 's'}.</p>
      <div className="afq-rotc-actions">
        <button className="afq-btn afq-primary" onClick={onAgain}>Run again <kbd>R</kbd></button>
      </div>
    </div>
  );
}
