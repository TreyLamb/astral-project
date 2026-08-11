import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { SPECIES_ROWS, officialArtworkUrl } from '../speciesTable';
import { needsCustomCp, REFERENCE_LEVELS, withSpeciesDefaults } from '../pogofiltersConfig';
import { isExcluded } from '../classification';

// The one-time assignment wizard, per DECISION.md's "Queue workflow" section.
// Deliberately NOT part of the matrix: its only job is to get every species
// assigned once, after which it stops being useful and the matrix takes over.
// Everything here is shaped around finishing — small queues with counters that
// tick down, most-impactful species first, and a rapid-fire mode that can be
// driven entirely from the number row.
//
// Same structural rule the matrix enforces: the CP-by-level numbers are PASSIVE
// reference (shaded band, bordered off, muted) and the tier buttons are the
// ACTIVE control. Nothing here ever derives or preselects a tier from the CP
// numbers — Trey picks every one.

const HIGH_CEILING = 1600;

const QUEUES = [
  {
    id: 'custom',
    name: 'Needs custom CP',
    color: 'var(--pgf-warn)',
    sub: 'Even at their level-35 ceiling these sit below your lowest preset, so no tier button can apply to them. Fast, obvious calls — clear this first for a quick win.',
    match: (s) => s.needsCustom && !s.assigned,
  },
  {
    id: 'high',
    name: 'Unassigned · high ceiling',
    color: 'var(--pgf-err)',
    sub: `L25 CP of ${HIGH_CEILING} or more. The highest-leverage decisions in the whole set — one Tyranitar call is worth twenty Caterpies. Do these while you are fresh.`,
    match: (s) => !s.assigned && !s.needsCustom && s.cp[25] >= HIGH_CEILING,
  },
  {
    id: 'rest',
    name: 'Unassigned · the rest',
    color: 'var(--pgf-lit)',
    sub: 'The long tail. Lower stakes per decision, so speed-run it once the high-ceiling queue is empty.',
    match: (s) => !s.assigned && !s.needsCustom && s.cp[25] < HIGH_CEILING,
  },
  {
    id: 'done',
    name: 'Assigned',
    color: 'var(--pgf-ok)',
    sub: 'Already decided. Open it to check or change anything.',
    match: (s) => s.assigned,
  },
];

// Stars on q-w-e-r-t (0★..4★) so they don't collide with the 1-5 tier keys.
const STAR_KEYS = ['q', 'w', 'e', 'r', 't'];

export default function QueueView() {
  const { species, settings, saveSpecies, showToast } = usePogoFilters();
  // Memoised so the `|| []` fallback doesn't hand a fresh array to the row memo
  // on every render and rebuild all ~936 rows for nothing.
  const presets = useMemo(() => settings?.cpPresets || [], [settings]);

  const [mode, setMode] = useState('hub');
  const [queueId, setQueueId] = useState(null);
  // The run is frozen when rapid-fire opens. Assignments remove a species from
  // the live queue, so walking the live list would shuffle under the cursor and
  // make "34 of 703" meaningless.
  const [run, setRun] = useState([]);
  const [pos, setPos] = useState(0);

  const rows = useMemo(() => SPECIES_ROWS.map((s) => {
    const saved = species[s.dex] || species[String(s.dex)];
    const a = withSpeciesDefaults({ ...saved, dex: s.dex, speciesId: s.id, name: s.name });
    return {
      ...s,
      ...a,
      needsCustom: needsCustomCp(s.maxCp, presets),
      assigned: a.tier !== null || a.customCp !== null,
      starThreshold: a.starThreshold,
      excluded: isExcluded(a, s.dex),
    };
  }), [species, presets]);

  const byDex = useMemo(() => new Map(rows.map((r) => [r.dex, r])), [rows]);

  // Two kinds of species never reach a queue, and both are out of the
  // denominator as well — a queue that can never empty is a broken queue.
  //   excluded  — legendaries and mythicals. Never rated, so never queued.
  //   unchecked — species Trey never wants saved at all.
  const live = useMemo(() => rows.filter((r) => !r.excluded), [rows]);
  const kept = useMemo(() => live.filter((r) => r.tracked), [live]);
  const doneCount = kept.filter((r) => r.assigned).length;
  const neverSaveCount = live.length - kept.length;
  const excludedCount = rows.length - live.length;
  const pct = kept.length ? (doneCount / kept.length) * 100 : 0;

  const queues = useMemo(() => QUEUES.map((q) => ({
    ...q,
    members: kept.filter((s) => q.match(s)).sort((a, b) => b.cp[25] - a.cp[25]),
  })), [kept]);

  const queue = queues.find((q) => q.id === queueId) || null;
  const cur = mode === 'rapid' && pos < run.length ? byDex.get(run[pos]) : null;

  const patch = useCallback((dex, updates) => {
    const row = byDex.get(dex);
    saveSpecies(withSpeciesDefaults({ ...row, ...updates, dex, speciesId: row.id, name: row.name }));
  }, [byDex, saveSpecies]);

  const step = useCallback((d) => {
    setPos((p) => Math.max(0, Math.min(p + d, run.length)));
  }, [run.length]);

  const open = (q, next) => {
    setQueueId(q.id);
    setRun(q.members.map((m) => m.dex));
    setPos(0);
    setMode(next);
  };

  const neverSave = useCallback((row) => {
    patch(row.dex, { tracked: false });
    showToast(`${row.name} — never saved, so it will never be protected in any filter`);
  }, [patch, showToast]);

  useEffect(() => {
    if (mode !== 'rapid' || !cur) return;
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Holding an arrow to fast-forward is wanted; holding "3" and assigning
      // tier 3 to forty species is not.
      if (e.repeat && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = Number(e.key);
      if (n >= 1 && n <= presets.length && !cur.needsCustom) {
        patch(cur.dex, { tier: presets[n - 1], customCp: null });
        step(1);
      } else if (e.key === '0') {
        patch(cur.dex, { tier: null, customCp: null });
      } else if (STAR_KEYS.includes(e.key.toLowerCase())) {
        // Stars sit on q-w-e-r-t so they don't fight the 1-5 tier keys. Set
        // stars first; the tier key is the one that commits and advances.
        patch(cur.dex, { starThreshold: STAR_KEYS.indexOf(e.key.toLowerCase()) });
      } else if (e.key === 'ArrowRight' || e.key === 's' || e.key === 'S') {
        step(1);
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      } else if (e.key === 'x' || e.key === 'X') {
        neverSave(cur);
        step(1);
      } else if (e.key === 'Escape') {
        setMode('hub');
      } else {
        return;
      }
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, cur, presets, patch, step, neverSave]);

  // pgf-btn, not pgf-btn-sm: the shared CSS grows pgf-btn to 38px on a phone,
  // which is the touch-target floor this tool has to clear.
  const backBtn = (
    <button className="pgf-btn" onClick={() => setMode('hub')}>← All queues</button>
  );

  // ------------------------------------------------------------------ hub
  if (mode === 'hub' || !queue) {
    return (
      <div className="pgf-page">
        <div className="pgf-panel" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 20 }}>{doneCount} / {kept.length} assigned</b>
            <span className="pgf-muted">
              {pct.toFixed(1)}% done · {kept.length - doneCount} to go
              {neverSaveCount ? ` · ${neverSaveCount} marked never-save` : ''}
              {excludedCount ? ` · ${excludedCount} legendary/mythical excluded` : ''}
            </span>
          </div>
          <div style={{ height: 12, margin: '10px 0 8px', borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--pgf-line)' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--pgf-ok), var(--pgf-lit))' }} />
          </div>
          <span className="pgf-muted">
            A species counts as assigned once it has a CP tier or a custom CP. Every assignment
            moves one out of a queue for good.
          </span>
        </div>

        {kept.length > 0 && doneCount === kept.length && (
          <div className="pgf-panel" style={{ padding: 20, marginBottom: 18, textAlign: 'center', borderColor: 'var(--pgf-ok)' }}>
            <div style={{ fontSize: 34, lineHeight: 1, color: 'var(--pgf-ok)' }}>✓</div>
            <b style={{ fontSize: 15, display: 'block', margin: '8px 0 4px' }}>
              Every species you keep has a CP tier.
            </b>
            <p className="pgf-sub" style={{ margin: 0 }}>
              This tool has done its job. The species matrix is the daily surface from here.
            </p>
          </div>
        )}

        <div className="pgf-h">Work queues</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 12 }}>
          {queues.map((q) => (
            <div key={q.id} className="pgf-panel" style={{ padding: 14, borderLeft: `4px solid ${q.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{q.name}</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: q.color, fontVariantNumeric: 'tabular-nums' }}>
                  {q.members.length}
                </span>
              </div>
              <p className="pgf-sub" style={{ margin: '8px 0 6px' }}>{q.sub}</p>
              <p className="pgf-muted" style={{ margin: '0 0 4px', lineHeight: 1.5, color: q.members.length ? undefined : 'var(--pgf-ok)' }}>
                {q.members.length
                  ? `${q.members.slice(0, 3).map((m) => m.name).join(', ')}${q.members.length > 3 ? '…' : ''}`
                  : q.id === 'done' ? 'Nothing decided yet.' : '✓ Cleared — nothing left here.'}
              </p>
              <div className="pgf-fcard-row">
                <button
                  className="pgf-btn pgf-btn-primary"
                  style={{ flex: '1 1 auto', justifyContent: 'center' }}
                  disabled={!q.members.length}
                  onClick={() => open(q, 'rapid')}
                >
                  {q.id === 'done' ? 'Review one by one' : 'Rapid-fire'}
                </button>
                <button
                  className="pgf-btn"
                  style={{ flex: '1 1 auto', justifyContent: 'center' }}
                  disabled={!q.members.length}
                  onClick={() => open(q, 'list')}
                >
                  Open list
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- rapid-fire
  if (mode === 'rapid') {
    if (!run.length || !queue.members.length) {
      return (
        <div className="pgf-page">
          {backBtn}
          <div className="pgf-panel" style={{ padding: 32, marginTop: 12, textAlign: 'center', borderColor: 'var(--pgf-ok)' }}>
            <div style={{ fontSize: 40, lineHeight: 1, color: 'var(--pgf-ok)' }}>✓</div>
            <h3 style={{ margin: '10px 0 4px', fontSize: 18 }}>{queue.name} is clear.</h3>
            <p className="pgf-sub">Nothing left in this queue. Pick another one and keep going.</p>
            <button className="pgf-btn pgf-btn-primary" onClick={() => setMode('hub')}>
              ← All queues
            </button>
          </div>
        </div>
      );
    }

    if (!cur) {
      const left = queue.members.length;
      return (
        <div className="pgf-page">
          {backBtn}
          <div className="pgf-panel" style={{ padding: 32, marginTop: 12, textAlign: 'center', borderColor: 'var(--pgf-ok)' }}>
            <div style={{ fontSize: 40, lineHeight: 1, color: 'var(--pgf-ok)' }}>✓</div>
            <h3 style={{ margin: '10px 0 4px', fontSize: 18 }}>End of the run — {run.length} species.</h3>
            <p className="pgf-sub">
              {left} are still in this queue — the ones you skipped. One more pass clears them.
            </p>
            <div className="pgf-fcard-row" style={{ justifyContent: 'center' }}>
              <button className="pgf-btn pgf-btn-primary" onClick={() => open(queue, 'rapid')}>
                Run the remaining {left}
              </button>
              <button className="pgf-btn" onClick={() => setMode('hub')}>← All queues</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pgf-page">
        <div className="pgf-chipbar">
          {backBtn}
          <span className="pgf-h" style={{ margin: 0, color: queue.color }}>{queue.name}</span>
          <span className="pgf-spacer" />
          <span className="pgf-muted">
            {queue.members.length} {queue.id === 'done' ? 'assigned' : 'left'} in this queue
          </span>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ height: 8, marginBottom: 14, borderRadius: 4, overflow: 'hidden', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--pgf-line)' }}>
            <div style={{ width: `${(pos / run.length) * 100}%`, height: '100%', background: queue.color }} />
          </div>

          <div className="pgf-panel" style={{ padding: 20, textAlign: 'center' }}>
            <img
              className="pgf-side-art" alt="" loading="lazy"
              style={{ width: 'min(46vw, 168px)', height: 'min(46vw, 168px)' }}
              src={officialArtworkUrl(cur.dex)}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <div className="pgf-muted">#{String(cur.dex).padStart(3, '0')} · {cur.types.join(' / ')}</div>
            <h3 style={{ fontSize: 'clamp(20px, 7vw, 26px)', fontWeight: 800, margin: '4px 0 0' }}>{cur.name}</h3>

            {/* passive reference — same shaded, bordered-off band as the matrix */}
            <div className="pgf-side-card pgf-side-ref" style={{ textAlign: 'left' }}>
              <div className="pgf-h">Reference — read only · CP at level</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: 10 }}>
                {REFERENCE_LEVELS.map((l) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div className="pgf-muted">L{l}</div>
                    <b style={{
                      fontSize: 'clamp(18px, 6vw, 24px)',
                      fontFamily: '"Consolas", ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                      color: l === 25 ? 'var(--pgf-amber)' : 'var(--pgf-text-dim)',
                    }}>
                      {cur.cp[l]}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            {!cur.tracked && (
              <div className="pgf-side-mixed" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <span style={{ flex: '1 1 auto' }}>⊘ Marked never-save — out of every queue and never protected in any filter.</span>
                <button className="pgf-btn" onClick={() => patch(cur.dex, { tracked: true })}>Keep it after all</button>
              </div>
            )}

            {/* Stars sit above the CP row and outside the needs-custom branch:
                a minimum star rating applies whether the CP bar came from a
                preset or a typed value. The tier key is what advances, so the
                natural order is stars first, then tier. */}
            <div className="pgf-h" style={{ margin: '14px 0 6px' }}>Minimum stars to keep</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`pgf-tierbtn pgf-tierbtn-lg${cur.starThreshold === n ? ' on' : ''}`}
                  style={{ flex: '1 1 56px', height: 44 }}
                  onClick={(ev) => { ev.currentTarget.blur(); patch(cur.dex, { starThreshold: n }); }}
                >
                  {n}★
                  <small style={{ display: 'block', fontSize: 9, opacity: 0.6, marginTop: 3 }}>
                    key {STAR_KEYS[n]}
                  </small>
                </button>
              ))}
            </div>

            {cur.needsCustom ? (
              <div className="pgf-side-mixed" style={{ textAlign: 'left' }}>
                <span className="pgf-needs-tag">NEEDS CUSTOM</span>
                Maxes at {cur.maxCp} CP — below every preset, so every tier button would silently
                mean “keep every one of these”. Type a value, or mark it never-save.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 10px' }}>
                {presets.map((t, i) => (
                  <button
                    key={t}
                    className={`pgf-tierbtn pgf-tierbtn-lg${cur.tier === t ? ' on' : ''}${cur.maxCp < t ? ' unreachable' : ''}`}
                    style={{ flex: '1 1 62px', height: 54 }}
                    title={cur.maxCp < t ? `Unreachable — ${cur.name} maxes at ${cur.maxCp}` : `Keep ${cur.name} at ${t} CP and above`}
                    onClick={(e) => { e.currentTarget.blur(); patch(cur.dex, { tier: t, customCp: null }); step(1); }}
                  >
                    {t}
                    <small style={{ display: 'block', fontSize: 9, fontWeight: 600, opacity: 0.6, marginTop: 4 }}>key {i + 1}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="pgf-fcard-row" style={{ justifyContent: 'center' }}>
              <input
                className="pgf-input"
                style={{ width: 150, height: 44, fontSize: 16, textAlign: 'center' }}
                type="number" inputMode="numeric" placeholder="custom CP…"
                key={cur.dex}
                defaultValue={cur.customCp ?? ''}
                onKeyDown={(e) => {
                  // No blur() here on purpose — advancing changes the key, which
                  // unmounts the input, so onBlur never double-writes the value.
                  if (e.key !== 'Enter') return;
                  const v = e.target.value.trim();
                  patch(cur.dex, { customCp: v === '' ? null : Number(v), tier: null });
                  step(1);
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  const next = v === '' ? null : Number(v);
                  if (next !== cur.customCp) patch(cur.dex, { customCp: next, tier: next === null ? cur.tier : null });
                }}
              />
              <button
                className="pgf-btn pgf-btn-danger"
                style={{ minHeight: 44 }}
                title="I never want this species saved at all — removes it from every queue"
                onClick={() => { neverSave(cur); step(1); }}
              >
                ✕ Never save
              </button>
            </div>

            <div className="pgf-fcard-row">
              <button className="pgf-btn" style={{ flex: '1 1 45%', justifyContent: 'center', minHeight: 44 }} onClick={() => step(-1)}>← Back</button>
              <button className="pgf-btn" style={{ flex: '1 1 45%', justifyContent: 'center', minHeight: 44 }} onClick={() => step(1)}>Skip →</button>
            </div>

            <p className="pgf-muted" style={{ marginTop: 12, lineHeight: 1.7 }}>
              <b style={{ color: 'var(--pgf-text-dim)' }}>{pos + 1} of {run.length}</b> in this run
              <br />
              1–{presets.length} set a tier · 0 clears it · ← → move · S skip · X never save · Esc back
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------- list
  // Frozen the same way the rapid run is: an assignment drops a species out of
  // the live queue, and rows vanishing from under the pointer mid-grind is how
  // the wrong species gets assigned.
  const listRows = run.map((d) => byDex.get(d));

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        {backBtn}
        <span className="pgf-h" style={{ margin: 0, color: queue.color }}>
          {queue.name} — {listRows.length} rows · {queue.members.length} {queue.id === 'done' ? 'assigned' : 'still queued'}
        </span>
        <span className="pgf-spacer" />
        <button className="pgf-btn" disabled={!queue.members.length} onClick={() => open(queue, 'rapid')}>
          Rapid-fire this queue
        </button>
      </div>

      {queue.members.length === 0 ? (
        <div className="pgf-panel" style={{ padding: 32, textAlign: 'center', borderColor: 'var(--pgf-ok)' }}>
          <div style={{ fontSize: 40, lineHeight: 1, color: 'var(--pgf-ok)' }}>✓</div>
          <h3 style={{ margin: '10px 0 4px', fontSize: 18 }}>{queue.name} is clear.</h3>
          <p className="pgf-sub">Nothing left in this queue. Pick another one and keep going.</p>
          <button className="pgf-btn pgf-btn-primary" onClick={() => setMode('hub')}>← All queues</button>
        </div>
      ) : (
        <div className="pgf-matrix-scroll" style={{ height: 'auto', maxHeight: 'calc(62svh / var(--pgf-zoom))', border: '1px solid var(--pgf-line)', borderRadius: 'var(--pgf-radius)' }}>
          <table className="pgf-matrix">
            <thead>
              <tr className="pgf-band">
                <th colSpan={3} />
                <th colSpan={REFERENCE_LEVELS.length} className="pgf-sec-ref pgf-sec-ref-end">
                  Reference — read only
                </th>
                <th className="pgf-sec-sel">Decision</th>
              </tr>
              <tr className="pgf-cols">
                <th style={{ width: 32 }} title="Do you ever want this species saved?">Keep</th>
                <th style={{ width: 44 }}>Dex</th>
                <th style={{ width: 186 }}>Species</th>
                {REFERENCE_LEVELS.map((l, i) => (
                  <th
                    key={l}
                    className={`pgf-sec-ref${i === REFERENCE_LEVELS.length - 1 ? ' pgf-sec-ref-end' : ''}`}
                    style={{ textAlign: 'right' }}
                  >
                    L{l}
                  </th>
                ))}
                <th className="pgf-sec-sel">CP tier — click to set</th>
              </tr>
            </thead>
            <tbody>
              {listRows.map((s) => (
                <tr key={s.dex} className={s.needsCustom ? 'pgf-needs' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.tracked}
                      onChange={(e) => (e.target.checked ? patch(s.dex, { tracked: true }) : neverSave(s))}
                      title="Uncheck if you never want this species saved"
                    />
                  </td>
                  <td className="pgf-mx-dex">{String(s.dex).padStart(3, '0')}</td>
                  <td className="pgf-mx-name">
                    <img
                      className="pgf-mx-sprite" loading="lazy" alt=""
                      src={officialArtworkUrl(s.dex)}
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                    {s.name}
                  </td>
                  {REFERENCE_LEVELS.map((l, i) => (
                    <td
                      key={l}
                      className={`pgf-mx-cp pgf-sec-ref${l === 25 ? ' hi' : ''}${i === REFERENCE_LEVELS.length - 1 ? ' pgf-sec-ref-end' : ''}`}
                    >
                      {s.cp[l]}
                    </td>
                  ))}
                  <td className="pgf-sec-sel">
                    {s.needsCustom
                      ? <span className="pgf-needs-tag" title={`Max ${s.maxCp} CP at L${REFERENCE_LEVELS.at(-1)} — below every preset`}>NEEDS CUSTOM</span>
                      : presets.map((t) => (
                        <button
                          key={t}
                          className={`pgf-tierbtn${s.tier === t ? ' on' : ''}${s.maxCp < t ? ' unreachable' : ''}`}
                          title={s.maxCp < t ? `Unreachable — ${s.name} maxes at ${s.maxCp}` : `Keep at ${t} CP and above`}
                          onClick={() => patch(s.dex, { tier: s.tier === t ? null : t, customCp: null })}
                        >
                          {t}
                        </button>
                      ))}
                    <input
                      className="pgf-customcp"
                      placeholder="custom"
                      defaultValue={s.customCp ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        patch(s.dex, { customCp: v === '' ? null : Number(v), tier: v === '' ? s.tier : null });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
