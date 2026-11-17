import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRotc } from './rotcContext';
import { SECTIONS, SECTION_IDS, LIST_DATE, sectionById, cardsFor, sequenceFor, initials } from './knowledgeListData';
import { addCardFlag, removeCardFlag, isCardFlagged } from './rotcData';
import FlipDeck from '../../shared/FlipDeck';

/**
 * Review for the knowledge list Trey was handed on 28 Oct 2026, built from knowledgeListData.js.
 *
 * Three ways through the same list:
 *   Sheet    - the list in its own order with every answer covered, tap to uncover (the paper method)
 *   Cards    - shuffled flashcards, both directions where a reverse question makes sense
 *   In order - recite one list top to bottom, uncovering one line at a time
 *
 * Cards use the shared FlipDeck (the Gemini Notebook layout, 2026-10-30) like KnowledgeCards.jsx; its ✗/✓
 * tally is a session count only, never stored. Flags share the store's flaggedCards map; ids are
 * prefixed kl- so they never collide with the knowledge-card deck. Settings live under
 * settings.afrotcList.
 */

const DEFAULTS = { mode: 'sheet', sections: SECTION_IDS, hide: true, dir: 'both', det: true, seq: 'chain', prompt: true };
const MODES = [
  { id: 'sheet', label: 'Sheet' },
  { id: 'cards', label: 'Cards' },
  { id: 'order', label: 'In order' },
];

const shuffle = (a) => {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const typing = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

export default function KnowledgeList({ onGoTo }) {
  const { progress, updateSettings } = useRotc();
  const saved = useMemo(() => progress?.settings?.afrotcList ?? {}, [progress]);
  const cfg = useMemo(() => ({ ...DEFAULTS, ...saved }), [saved]);
  const setCfg = useCallback(
    (patch) => updateSettings({ afrotcList: { ...DEFAULTS, ...saved, ...patch } }),
    [updateSettings, saved],
  );

  const selected = useMemo(() => {
    const ids = (cfg.sections ?? []).filter((id) => SECTION_IDS.includes(id));
    return ids.length ? ids : SECTION_IDS;
  }, [cfg.sections]);

  const toggleSection = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (!next.length) return;
    setCfg({ sections: SECTION_IDS.filter((x) => next.includes(x)) });
  };
  const allOn = selected.length === SECTION_IDS.length;

  return (
    <div className="arc-s-sheet arc-s-kl">
      <header className="arc-s-mast">
        <p className="arc-s-eyebrow">Det 855 knowledge list · {LIST_DATE}</p>
        <h2>Knowledge list</h2>
        <p className="arc-s-sub">
          Everything on the list you were handed, in its order. Cover the answers and test yourself,
          flip it as cards, or recite each list top to bottom.
        </p>
      </header>

      <div className="arc-s-bar">
        <div className="arc-s-seg" role="group" aria-label="How to review">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={cfg.mode === m.id ? 'on' : ''} aria-pressed={cfg.mode === m.id} onClick={() => setCfg({ mode: m.id })}>
              {m.label}
            </button>
          ))}
        </div>
        <label className="arc-s-kl-opt">
          <input type="checkbox" checked={cfg.det} onChange={(e) => setCfg({ det: e.target.checked })} />
          Include Det 855 names
        </label>
      </div>

      <div className="arc-s-kl-chips" role="group" aria-label="Sections to review">
        <span className="arc-s-kl-lbl">Sections</span>
        <button type="button" className={allOn ? 'on' : ''} aria-pressed={allOn} onClick={() => setCfg({ sections: SECTION_IDS })}>
          Whole list
        </button>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" className={selected.includes(s.id) ? 'on' : ''} aria-pressed={selected.includes(s.id)} onClick={() => toggleSection(s.id)}>
            {s.title}
          </button>
        ))}
      </div>

      {cfg.mode === 'sheet' && <Sheet cfg={cfg} setCfg={setCfg} selected={selected} onGoTo={onGoTo} />}
      {cfg.mode === 'cards' && <Cards cfg={cfg} setCfg={setCfg} selected={selected} />}
      {cfg.mode === 'order' && <InOrder cfg={cfg} setCfg={setCfg} selected={selected} />}
    </div>
  );
}

/* ───────────── Sheet: the list with its answers covered ───────────── */

function Sheet({ cfg, setCfg, selected, onGoTo }) {
  const [shown, setShown] = useState(() => new Set());
  const isShown = (key) => !cfg.hide || shown.has(key);
  const flip = (key) => setShown((s) => {
    const n = new Set(s);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });
  const setMany = (keys, on) => setShown((s) => {
    const n = new Set(s);
    keys.forEach((k) => (on ? n.add(k) : n.delete(k)));
    return n;
  });

  const sections = SECTIONS.filter((s) => selected.includes(s.id));

  return (
    <>
      <div className="arc-s-bar">
        <label className="arc-s-kl-opt">
          <input type="checkbox" checked={cfg.hide} onChange={(e) => { setCfg({ hide: e.target.checked }); setShown(new Set()); }} />
          Cover the answers
        </label>
        {cfg.hide && (
          <button type="button" className="arc-s-btn arc-s-ghost" onClick={() => setShown(new Set())}>Cover everything again</button>
        )}
      </div>

      {sections.map((s) => {
        const n = SECTIONS.indexOf(s) + 1;
        const main = s.lines ? s.lines.map((_, i) => `${s.id}:l${i}`) : (s.rows ?? []).map((_, i) => `${s.id}:r${i}`);
        const extra = s.extra && cfg.det ? s.extra.rows.map((_, i) => `${s.id}:x${i}`) : [];
        const keys = [...main, ...extra];
        const allShown = keys.every(isShown);
        return (
          <section key={s.id} className="arc-s-sec" id={`kl-${s.id}`}>
            <div className="arc-s-sec-head">
              <span className="arc-s-sob">{n} of {SECTIONS.length}</span>
              <h3>{s.title}</h3>
              {cfg.hide && (
                <button type="button" className="arc-s-btn arc-s-ghost" onClick={() => setMany(keys, !allShown)}>
                  {allShown ? 'Cover' : 'Uncover all'}
                </button>
              )}
            </div>
            {s.note && <p className="arc-s-fine">{s.note}</p>}

            {s.lines ? (
              <ol className="arc-s-kl-lines">
                {s.lines.map((line, i) => (
                  <li key={i}><Answer show={isShown(`${s.id}:l${i}`)} onFlip={() => flip(`${s.id}:l${i}`)}>{line}</Answer></li>
                ))}
              </ol>
            ) : (
              <RowTable s={s} rows={s.rows ?? []} prefix="r" isShown={isShown} flip={flip} />
            )}

            {s.extra && cfg.det && (
              <>
                <h4>{s.extra.title}</h4>
                <p className="arc-s-fine">{s.extra.note}</p>
                <RowTable s={s} rows={s.extra.rows} prefix="x" isShown={isShown} flip={flip} />
              </>
            )}

            {s.link && onGoTo && (
              <p className="arc-s-fine">
                <button type="button" className="arc-s-inline-link" onClick={() => onGoTo(s.link)}>Open the Song &amp; Creed tab</button>{' '}
                to drill the full songs.
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}

function RowTable({ s, rows, prefix, isShown, flip }) {
  const wide = s.id === 'officers';
  return (
    <div className="arc-s-scroll">
      <table className="arc-s-kl-table">
        <thead>
          <tr>
            {(wide ? s.cols : s.cols.slice(0, 2)).map((c, i) => <th key={i}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = `${s.id}:${prefix}${i}`;
            const show = isShown(key);
            const answer = s.id === 'navy' && r.abbr ? `${r.v} (${r.abbr})` : r.v;
            return (
              <tr key={key} className={r.flag ? 'changed' : ''}>
                <th scope="row">{r.k}</th>
                <td>
                  <Answer show={show} onFlip={() => flip(key)}>{answer}</Answer>
                  {show && (r.flag || r.note) && (
                    <span className={'arc-s-kl-note' + (r.flag ? ' flag' : '')}>{r.flag ?? r.note}</span>
                  )}
                  {show && r.flag && r.note && <span className="arc-s-kl-note">{r.note}</span>}
                </td>
                {wide && ['af', 'army', 'usmc'].map((c) => (
                  <td key={c} className="num">{show ? r[c] : <span className="arc-s-kl-dash">·</span>}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Answer({ show, onFlip, children }) {
  return (
    <button
      type="button"
      className={'arc-s-kl-ans' + (show ? ' on' : '')}
      onClick={onFlip}
      aria-expanded={show}
      title={show ? 'Cover this answer' : 'Uncover this answer'}
    >
      {show ? children : <span className="arc-s-kl-cover">Tap to uncover</span>}
    </button>
  );
}

/* ───────────── Cards: shuffled flip-through ───────────── */

function Cards({ cfg, setCfg, selected }) {
  const { progress } = useRotc();
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const flagged = useMemo(() => new Set(Object.keys(progress?.flaggedCards ?? {}).filter((id) => id.startsWith('kl-'))), [progress]);
  const base = useMemo(() => cardsFor(selected, cfg.dir, cfg.det), [selected, cfg.dir, cfg.det]);
  const deck = useMemo(() => (flaggedOnly ? base.filter((c) => flagged.has(c.id)) : base), [base, flaggedOnly, flagged]);

  return (
    <div className="arc-s-drill">
      <div className="arc-s-bar">
        <div className="arc-s-seg" role="group" aria-label="Card direction">
          {[['both', 'Both ways'], ['forward', 'Question → answer'], ['reverse', 'Answer → question']].map(([id, label]) => (
            <button key={id} type="button" className={cfg.dir === id ? 'on' : ''} aria-pressed={cfg.dir === id} onClick={() => setCfg({ dir: id })}>{label}</button>
          ))}
        </div>
        <button
          type="button"
          className={'arc-s-btn arc-s-flag-toggle' + (flaggedOnly ? ' arc-s-primary' : '')}
          onClick={() => setFlaggedOnly((v) => !v)}
          aria-pressed={flaggedOnly}
          title={flaggedOnly ? 'Show every card again' : 'Study only the cards you’ve flagged'}
        >
          ⚑ Flagged: {flagged.size}
        </button>
        <span className="arc-s-score">{deck.length} card{deck.length === 1 ? '' : 's'}</span>
      </div>
      <CardRun key={`${selected.join(',')}:${cfg.dir}:${cfg.det}:${flaggedOnly}`} deck={deck} />
    </div>
  );
}

function CardRun({ deck }) {
  const { progress, mutate } = useRotc();
  const [order, setOrder] = useState(() => shuffle(deck));
  const [round, setRound] = useState(0);
  const cards = useMemo(() => order.map((c) => ({ ...c, label: sectionById(c.section)?.title })), [order]);
  const toggleFlag = useCallback((card) => {
    mutate((p) => (isCardFlagged(p, card.id) ? removeCardFlag(p, card.id) : addCardFlag(p, { id: card.id, subject: 'knowledge-list', front: card.front })));
  }, [mutate]);
  const reshuffle = useCallback(() => { setOrder(shuffle(deck)); setRound((r) => r + 1); }, [deck]);

  return (
    <FlipDeck
      key={round}
      cards={cards}
      isFlagged={(id) => isCardFlagged(progress, id)}
      onToggleFlag={toggleFlag}
      onReshuffle={reshuffle}
      emptyText='No cards match. Turn off "Flagged" or pick more sections.'
    />
  );
}

/* ───────────── In order: recite a list top to bottom ───────────── */

function InOrder({ cfg, setCfg, selected }) {
  const ordered = SECTIONS.filter((s) => s.order && selected.includes(s.id));
  const seqId = ordered.some((s) => s.id === cfg.seq) ? cfg.seq : ordered[0]?.id;

  if (!seqId) {
    return <p className="arc-s-note">None of the chosen sections is an ordered list. Pick Chain of Command, the rank lists, the Creed, the Core Values, the responses or the MAJCOMs.</p>;
  }

  return (
    <div className="arc-s-drill">
      <div className="arc-s-kl-chips" role="group" aria-label="List to recite">
        <span className="arc-s-kl-lbl">Recite</span>
        {ordered.map((s) => (
          <button key={s.id} type="button" className={seqId === s.id ? 'on' : ''} aria-pressed={seqId === s.id} onClick={() => setCfg({ seq: s.id })}>
            {s.title}
          </button>
        ))}
      </div>
      <SequenceRun key={`${seqId}:${cfg.det}`} id={seqId} withExtra={cfg.det} prompt={cfg.prompt} setPrompt={(v) => setCfg({ prompt: v })} />
    </div>
  );
}

function SequenceRun({ id, withExtra, prompt, setPrompt }) {
  const seq = useMemo(() => sequenceFor(id, withExtra), [id, withExtra]);
  const s = sectionById(id);
  const labelled = !s.lines && !/^\d+$/.test(seq[0]?.label ?? '');
  const [n, setN] = useState(0);
  const [hint, setHint] = useState(false);
  const done = n >= seq.length;

  const forward = useCallback(() => { setN((v) => Math.min(seq.length, v + 1)); setHint(false); }, [seq.length]);
  const back = useCallback(() => { setN((v) => Math.max(0, v - 1)); setHint(false); }, []);
  const restart = useCallback(() => { setN(0); setHint(false); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (typing() || ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button'))) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); forward(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); back(); }
      else if (e.key === 'r' || e.key === 'R') restart();
      else if (e.key === 'h' || e.key === 'H') setHint(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forward, back, restart]);

  const next = seq[n];

  return (
    <>
      <div className="arc-s-prog"><i style={{ width: `${(n / seq.length) * 100}%` }} /></div>
      <div className="arc-s-prog-txt">
        <span>{done ? `All ${seq.length} recited` : `${n} of ${seq.length} uncovered`}</span>
        {labelled && (
          <label className="arc-s-kl-opt">
            <input type="checkbox" checked={prompt} onChange={(e) => setPrompt(e.target.checked)} />
            Show the position as a prompt
          </label>
        )}
      </div>

      <div className="arc-s-stage arc-s-kl-stage">
        <p className="arc-s-prompt">{s.title} · say the next line before you uncover it</p>
        <ol className="arc-s-kl-seq">
          {seq.slice(0, n).map((it) => (
            <li key={it.id}>
              {labelled && <span className="arc-s-kl-seq-k">{it.label}</span>}
              <span className="arc-s-kl-seq-v">{it.text}</span>
            </li>
          ))}
          {!done && (
            <li className="arc-s-kl-next">
              {labelled && <span className="arc-s-kl-seq-k">{prompt ? next.label : '?'}</span>}
              <span className="arc-s-kl-seq-v">{hint ? initials(next.text) : '?'}</span>
            </li>
          )}
        </ol>
        <div className="arc-s-actions">
          {done ? (
            <button type="button" className="arc-s-btn arc-s-primary" onClick={restart}>Again from the top <kbd>R</kbd></button>
          ) : (
            <>
              <button type="button" className="arc-s-btn" onClick={back} disabled={n === 0}>Back</button>
              <button type="button" className="arc-s-btn" onClick={() => setHint(true)} disabled={hint}>Hint <kbd>H</kbd></button>
              <button type="button" className="arc-s-btn arc-s-primary" onClick={forward}>Uncover <kbd>Space</kbd></button>
            </>
          )}
        </div>
      </div>
      <p className="arc-s-note arc-s-help"><kbd>Space</kbd> uncover the next line · <kbd>←</kbd> back · <kbd>H</kbd> first letters · <kbd>R</kbd> start over.</p>
    </>
  );
}
