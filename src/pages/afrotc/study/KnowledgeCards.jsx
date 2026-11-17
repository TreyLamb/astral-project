import { useState, useCallback, useMemo } from 'react';
import { useRotc } from './rotcContext';
import { SUBJECTS, SUBJECT_IDS, CARDS, PRESETS, cardsFor, bySubject } from './cardData';
import { addCardFlag, removeCardFlag, isCardFlagged } from './rotcData';
import FlipDeck from '../../shared/FlipDeck';

/**
 * AFROTC knowledge-card drill: mission/values, creeds/oaths/songs, real AF/Space Force officer
 * and enlisted ranks, customs & greetings, org structure, and acronyms.
 *
 * Drawn by the shared FlipDeck (2026-10-30, Trey: the Gemini Notebook layout - a card that flips
 * over a glowing background, with back / ✗ / ✓ / next under it). The ✗/✓ tally is a session count
 * only and is never stored; flagging a card is still the only "come back to this" mechanism.
 *
 * Same settings/selection pattern as RankDrill.jsx (subject checkboxes, presets, persisted
 * selection) but under its own settings key - `settings.afrotcCards` - so it doesn't collide with
 * the rank drill's `settings.afrotc`.
 */

const DEFAULTS = { subjects: SUBJECT_IDS };
// Subjects that existed before `known` was saved. Anything newer is switched ON for a saved
// selection that has never seen it, so a new subject turns up instead of hiding behind settings.
const LEGACY_IDS = ['mission-values', 'mottos-creeds', 'ranks-officer', 'ranks-enlisted', 'customs', 'org', 'admin', 'acronyms'];

const shuffle = (a) => {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function KnowledgeCards() {
  const { progress, updateSettings } = useRotc();

  const saved = useMemo(() => progress?.settings?.afrotcCards ?? {}, [progress]);
  const cfg = useMemo(() => ({ ...DEFAULTS, ...saved }), [saved]);
  const setCfg = useCallback(
    (patch) => updateSettings({ afrotcCards: { ...DEFAULTS, ...saved, ...patch, known: SUBJECT_IDS } }),
    [updateSettings, saved],
  );

  // Same "don't let a stale or empty selection produce an undrawable deck" guard as RankDrill.
  const selected = useMemo(() => {
    const known = cfg.known ?? LEGACY_IDS;
    const fresh = SUBJECT_IDS.filter((id) => !known.includes(id));
    const ids = SUBJECT_IDS.filter((id) => (cfg.subjects ?? []).includes(id) || fresh.includes(id));
    return ids.length >= 1 ? ids : SUBJECT_IDS;
  }, [cfg.subjects, cfg.known]);

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
    <div className="arc-s-drill">
      <div className="arc-s-bar">
        <button
          className={'arc-s-btn arc-s-settings-btn' + (showSettings ? ' arc-s-primary' : '')}
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          Subjects in deck: {selected.length} of {SUBJECTS.length} · {deck.length} card{deck.length === 1 ? '' : 's'}
        </button>
        <button
          type="button"
          className={'arc-s-btn arc-s-flag-toggle' + (flaggedOnly ? ' arc-s-primary' : '')}
          onClick={() => setFlaggedOnly((v) => !v)}
          aria-pressed={flaggedOnly}
          title={flaggedOnly ? 'Show every card again' : 'Study only the cards you’ve flagged'}
        >
          ⚑ Flagged: {flaggedIds.size}
        </button>
      </div>

      {showSettings && (
        <div className="arc-s-settings">
          <h4>Which subjects do you want dealt?</h4>
          <div className="arc-s-presets">
            <button
              className={'arc-s-btn' + (allOn ? ' arc-s-primary' : '')}
              onClick={() => setCfg({ subjects: SUBJECT_IDS })}
            >
              All subjects
              <span className="arc-s-preset-hint">{CARDS.length} cards total</span>
            </button>
            {PRESETS.map((p) => {
              const count = CARDS.filter((c) => p.subjects.includes(c.subject)).length;
              return (
                <button
                  key={p.id}
                  className={'arc-s-btn' + (matchesPreset(p.subjects) ? ' arc-s-primary' : '')}
                  onClick={() => setCfg({ subjects: p.subjects })}
                  title={p.hint}
                >
                  {p.label}
                  <span className="arc-s-preset-hint">{count} cards</span>
                </button>
              );
            })}
          </div>

          <div className="arc-s-checks">
            {SUBJECTS.map((s) => {
              const on = selected.includes(s.id);
              const count = CARDS.filter((c) => c.subject === s.id).length;
              return (
                <label key={s.id} className={'arc-s-check' + (on ? ' on' : '')}>
                  <input type="checkbox" checked={on} onChange={() => toggleSubject(s.id)} />
                  <span className="arc-s-check-txt">
                    <b>{s.label}</b>
                    <span>{s.hint}</span>
                    <em>{count} cards</em>
                  </span>
                </label>
              );
            })}
          </div>

          <p className="arc-s-note">At least one subject must stay selected.</p>
        </div>
      )}

      <DrillRun key={selected.join(',') + ':' + flaggedOnly} deck={deck} />
    </div>
  );
}

function DrillRun({ deck }) {
  const { progress, mutate } = useRotc();
  const [order, setOrder] = useState(() => shuffle(deck));
  const [round, setRound] = useState(0);
  const cards = useMemo(() => order.map((c) => ({ ...c, label: bySubject(c.subject)?.label })), [order]);

  const toggleFlag = useCallback((card) => {
    mutate((p) =>
      isCardFlagged(p, card.id)
        ? removeCardFlag(p, card.id)
        : addCardFlag(p, { id: card.id, subject: card.subject, front: card.front }),
    );
  }, [mutate]);

  const reshuffle = useCallback(() => { setOrder(shuffle(deck)); setRound((r) => r + 1); }, [deck]);

  return (
    <FlipDeck
      key={round}
      cards={cards}
      isFlagged={(id) => isCardFlagged(progress, id)}
      onToggleFlag={toggleFlag}
      onReshuffle={reshuffle}
      emptyText='No cards match the current filters. Try turning off "Flagged only" or selecting another subject.'
    />
  );
}
