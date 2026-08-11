import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { SPECIES_ROWS, ALL_TYPES, officialArtworkUrl } from '../speciesTable';
import {
  needsCustomCp, REFERENCE_LEVELS, withSpeciesDefaults, isAssigned, SPECIES_STAR_CHOICES,
} from '../pogofiltersConfig';
import { categoriesFor, CATEGORY_SHORT, CATEGORY_LABEL, isExcluded } from '../classification';
import { indexSpeciesMentions } from '../applyEngine';
import SpeciesPanel from './SpeciesPanel';

// The species CP matrix. Design A's dense table with Design C's top bar and
// side panel, per PogoFilters/designs/DECISION.md.
//
// The two column groups are deliberately different things and are styled as
// such: the CP-by-level band is passive reference (shaded, bordered off, muted)
// and the tier buttons are the live control. The tool never derives a tier from
// the CP numbers — Trey picks it.

const STATUS = [
  { id: 'all', label: 'All' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'needscustom', label: 'Needs custom' },
];

export default function MatrixView() {
  const { species, saveSpeciesBulk, settings, labels, filters, showToast } = usePogoFilters();
  // "What already knows about this Pokémon?" — every filter that names it, not
  // just the ones the matrix maintains. An `easy evolves` filter listing pidgey
  // is precisely what's worth seeing on the pidgey row even though the matrix
  // will never touch that filter.
  const mentions = useMemo(() => indexSpeciesMentions(filters, SPECIES_ROWS), [filters]);
  // Memoised so the `|| []` fallback doesn't hand a fresh array to the row
  // memo on every render and rebuild all ~936 rows for nothing.
  const presets = useMemo(() => settings?.cpPresets || [], [settings]);

  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('all');
  const [cpMin, setCpMin] = useState('');
  const [cpMax, setCpMax] = useState('');
  const [showUnchecked, setShowUnchecked] = useState(false);
  // Legendaries and mythicals are out of this tool entirely. The toggle exists
  // so nothing is silently missing, not because it's meant to be used.
  const [showExcluded, setShowExcluded] = useState(false);

  const [selected, setSelected] = useState(() => new Set());
  const [cursor, setCursor] = useState(null);
  const anchorRef = useRef(null);
  const scrollRef = useRef(null);

  // Merge the static species table with whatever assignments exist. Untouched
  // species fall back to defaults, so `tracked` reads true for all ~936 without
  // needing a stored row for each.
  const rows = useMemo(() => SPECIES_ROWS.map((s) => {
    const saved = species[s.dex] || species[String(s.dex)];
    const a = withSpeciesDefaults({ ...saved, dex: s.dex, speciesId: s.id, name: s.name });
    return {
      ...s, ...a,
      needsCustom: needsCustomCp(s.maxCp, presets),
      categories: categoriesFor(s.dex),
      excluded: isExcluded(a, s.dex),
    };
  }), [species, presets]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const mn = cpMin === '' ? -Infinity : Number(cpMin);
    const mx = cpMax === '' ? Infinity : Number(cpMax);
    return rows.filter((s) => {
      // Legendaries and mythicals are never rated, so they are not in this list
      // at all. Every managed filter already carries !legendary and !mythical.
      if (s.excluded && !showExcluded) return false;
      // An unchecked species is one Trey never wants saved. It leaves the list
      // entirely unless he asks to see them.
      if (!s.tracked && !showUnchecked) return false;
      if (needle && !(s.name.toLowerCase().includes(needle)
        || String(s.dex).padStart(3, '0').includes(needle))) return false;
      if (type && !s.types.includes(type)) return false;
      if (status === 'unassigned' && isAssigned(s)) return false;
      if (status === 'assigned' && !isAssigned(s)) return false;
      if (status === 'needscustom' && !s.needsCustom) return false;
      const l25 = s.cp[25];
      if (l25 < mn || l25 > mx) return false;
      return true;
    });
  }, [rows, q, type, status, cpMin, cpMax, showUnchecked, showExcluded]);

  const visibleDex = useMemo(() => visible.map((s) => s.dex), [visible]);

  // Excluded species are out of every count too — they are not work to be done,
  // so they must not sit in a denominator making the job look unfinished.
  const counts = useMemo(() => {
    const live = rows.filter((s) => !s.excluded);
    return {
      unchecked: live.filter((s) => !s.tracked).length,
      excluded: rows.length - live.length,
      assigned: live.filter((s) => s.tracked && isAssigned(s)).length,
      needsCustom: live.filter((s) => s.tracked && s.needsCustom).length,
    };
  }, [rows]);

  const selectRow = useCallback((dex, e) => {
    const i = visibleDex.indexOf(dex);
    if (e?.shiftKey && anchorRef.current != null) {
      const a = visibleDex.indexOf(anchorRef.current);
      if (a !== -1 && i !== -1) {
        const next = new Set(selected);
        for (let k = Math.min(a, i); k <= Math.max(a, i); k++) next.add(visibleDex[k]);
        setSelected(next);
        setCursor(dex);
        return;
      }
    }
    if (e?.ctrlKey || e?.metaKey) {
      const next = new Set(selected);
      if (next.has(dex)) next.delete(dex); else next.add(dex);
      setSelected(next);
      anchorRef.current = dex;
      setCursor(dex);
      return;
    }
    setSelected(new Set([dex]));
    anchorRef.current = dex;
    setCursor(dex);
  }, [visibleDex, selected]);

  // Arrow keys move the cursor across the whole list and the side panel
  // follows, so a run of species can be worked through without the mouse.
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      if (!visibleDex.length) return;
      const i = cursor == null ? -1 : visibleDex.indexOf(cursor);
      const nextI = e.key === 'ArrowDown'
        ? Math.min(i + 1, visibleDex.length - 1)
        : Math.max(i - 1, 0);
      const dex = visibleDex[nextI < 0 ? 0 : nextI];
      setCursor(dex);
      setSelected(new Set([dex]));
      anchorRef.current = dex;
      scrollRef.current?.querySelector(`tr[data-dex="${dex}"]`)?.scrollIntoView({ block: 'nearest' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cursor, visibleDex]);

  const patch = useCallback((dexList, updates) => {
    const entries = dexList.map((dex) => {
      const row = rows.find((r) => r.dex === dex);
      return withSpeciesDefaults({ ...row, ...updates, dex, speciesId: row.id, name: row.name });
    });
    saveSpeciesBulk(entries);
    return entries;
  }, [rows, saveSpeciesBulk]);

  const setTier = useCallback((dex, tier) => {
    const row = rows.find((r) => r.dex === dex);
    patch([dex], { tier: row?.tier === tier ? null : tier, customCp: null });
  }, [rows, patch]);

  const toggleTracked = useCallback((dex, next) => {
    patch([dex], { tracked: next });
    if (!next) {
      setSelected((prev) => { const s = new Set(prev); s.delete(dex); return s; });
      showToast('Unchecked — never saved, so it will never be protected in any filter');
    }
  }, [patch, showToast]);

  const selectAllMatching = useCallback(() => {
    setSelected(new Set(visibleDex));
    if (visibleDex.length) { setCursor(visibleDex[0]); anchorRef.current = visibleDex[0]; }
  }, [visibleDex]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.dex)),
    [rows, selected],
  );

  return (
    <div className="pgf-matrix-layout">
      <div className="pgf-matrix-main">
        {/* Design C's control bar */}
        <div className="pgf-matrix-bar">
          <input
            className="pgf-input" style={{ width: 170 }}
            placeholder="🔍 name or dex…" value={q} onChange={(e) => setQ(e.target.value)}
          />
          <select className="pgf-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {ALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="pgf-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <span className="pgf-muted">L25 CP</span>
          <input className="pgf-input" style={{ width: 74 }} type="number" placeholder="min"
            value={cpMin} onChange={(e) => setCpMin(e.target.value)} />
          <input className="pgf-input" style={{ width: 74 }} type="number" placeholder="max"
            value={cpMax} onChange={(e) => setCpMax(e.target.value)} />

          <button className="pgf-btn pgf-btn-sm" onClick={selectAllMatching}>Select all matching</button>
          <button className="pgf-btn pgf-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>

          <label className="pgf-switch" title="Unchecked species are ones you never want saved — hidden by default">
            <input type="checkbox" checked={showUnchecked} onChange={(e) => setShowUnchecked(e.target.checked)} />
            <span className="pgf-switch-track" />
            Show unchecked ({counts.unchecked})
          </label>

          <label
            className="pgf-switch"
            title="Legendaries and mythicals are never rated here — every managed filter carries !legendary and !mythical instead. Hidden by default."
          >
            <input type="checkbox" checked={showExcluded} onChange={(e) => setShowExcluded(e.target.checked)} />
            <span className="pgf-switch-track" />
            Show legendary/mythical ({counts.excluded})
          </label>

          <span className="pgf-spacer" />
          <span className="pgf-muted">
            {visible.length} shown · {counts.assigned} assigned · {counts.needsCustom} need custom
          </span>
        </div>

        <div className="pgf-matrix-scroll" ref={scrollRef}>
          <table className="pgf-matrix">
            <thead>
              <tr className="pgf-band">
                <th colSpan={3} />
                <th colSpan={REFERENCE_LEVELS.length} className="pgf-sec-ref pgf-sec-ref-end">
                  Reference — read only
                </th>
                <th className="pgf-sec-sel">Selection</th>
                <th colSpan={3} />
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
                <th className="pgf-sec-sel">CP tier</th>
                <th style={{ width: 84 }}>Stars</th>
                <th style={{ width: 200 }}>Labels</th>
                <th style={{ width: 230 }} title="Filters that already name this species. Bright ones are specific filters the matrix never touches.">
                  In filters
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const isCursor = cursor === s.dex;
                const isPicked = selected.has(s.dex);
                return (
                  <tr
                    key={s.dex}
                    data-dex={s.dex}
                    className={`${s.excluded ? 'pgf-excluded ' : ''}${s.needsCustom ? 'pgf-needs ' : ''}${isCursor ? 'pgf-cursor ' : ''}${isPicked ? 'pgf-picked' : ''}`}
                    onClick={(e) => selectRow(s.dex, e)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={s.tracked}
                        onChange={(e) => toggleTracked(s.dex, e.target.checked)}
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
                      {s.categories.map((c) => (
                        <span
                          key={c}
                          className="pgf-cat"
                          data-cat={c}
                          title={
                            c === 'legendary' || c === 'mythical'
                              ? `${CATEGORY_LABEL[c]} — excluded from this tool. Covered by the !legendary / !mythical terms on every managed filter instead.`
                              : CATEGORY_LABEL[c]
                          }
                        >
                          {CATEGORY_SHORT[c]}
                        </span>
                      ))}
                    </td>
                    {REFERENCE_LEVELS.map((l, i) => (
                      <td
                        key={l}
                        className={`pgf-mx-cp pgf-sec-ref${l === 25 ? ' hi' : ''}${i === REFERENCE_LEVELS.length - 1 ? ' pgf-sec-ref-end' : ''}`}
                      >
                        {s.cp[l]}
                      </td>
                    ))}
                    <td className="pgf-sec-sel" onClick={(e) => e.stopPropagation()}>
                      {/* An excluded species gets no controls at all — offering a
                          tier the engine would then ignore is worse than nothing.
                          The one button here undoes the exclusion. */}
                      {s.excluded ? (
                        <button
                          className="pgf-btn pgf-btn-sm"
                          title={`${s.name} is out of this tool. Every managed filter already carries !legendary and !mythical. Click to bring it in as an ordinary species.`}
                          onClick={() => patch([s.dex], { excluded: false })}
                        >
                          Include in matrix
                        </button>
                      ) : (
                        <>
                          {s.needsCustom
                            ? <span className="pgf-needs-tag" title={`Max ${s.maxCp} CP at L${REFERENCE_LEVELS.at(-1)} — below every preset`}>NEEDS CUSTOM</span>
                            : presets.map((t) => (
                              <button
                                key={t}
                                className={`pgf-tierbtn${s.tier === t ? ' on' : ''}${s.maxCp < t ? ' unreachable' : ''}`}
                                title={s.maxCp < t ? `Unreachable — ${s.name} maxes at ${s.maxCp}` : `Keep at ${t} CP and above`}
                                onClick={() => setTier(s.dex, t)}
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
                              patch([s.dex], { customCp: v === '' ? null : Number(v), tier: v === '' ? s.tier : null });
                            }}
                          />
                        </>
                      )}
                    </td>
                    <td
                      className={`pgf-stars${s.starThreshold === null ? ' inherit' : ''}`}
                      title={s.starThreshold === null
                        ? 'Any star — kept at its CP bar whatever the rating'
                        : `Only kept at its CP bar from ${s.starThreshold}★ up`}
                    >
                      {SPECIES_STAR_CHOICES.filter((n) => n > 0).map((n) => (
                        <span key={n} className={(s.starThreshold ?? 0) >= n ? '' : 'off'}>★</span>
                      ))}
                    </td>
                    <td>
                      {s.labels.map((name) => {
                        const l = labels.find((x) => x.name === name);
                        return (
                          <span key={name} className="pgf-lab" style={{ '--lc': l?.color || '#888' }}>
                            {name}
                          </span>
                        );
                      })}
                    </td>
                    <td className="pgf-mentions">
                      {/* A CP-tier filter naming this species is the matrix's own
                          output, so it's dimmed. A filter with no CP tier is a
                          specific one — the interesting case, kept bright. */}
                      {(mentions.get(s.dex) || []).slice(0, 4).map((m) => (
                        <span
                          key={m.id}
                          className={`pgf-ment${m.cpTier != null ? ' derived' : ''}`}
                          title={`${m.name}${m.cpTier != null
                            ? ` — cp${m.cpTier} trash filter, maintained from this matrix`
                            : ' — a specific filter; the matrix never changes it'}\nappears as ${m.negated ? `!${s.name}` : s.name}`}
                        >
                          {m.negated ? '!' : ''}{m.name}
                        </span>
                      ))}
                      {(mentions.get(s.dex) || []).length > 4 && (
                        <span className="pgf-ment derived">
                          +{(mentions.get(s.dex) || []).length - 4}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {visible.length === 0 && (
            <p className="pgf-muted" style={{ padding: 24, textAlign: 'center' }}>
              Nothing matches these filters.
            </p>
          )}
        </div>
      </div>

      <SpeciesPanel
        rows={selectedRows}
        presets={presets}
        labels={labels}
        mentions={selectedRows.length === 1 ? (mentions.get(selectedRows[0].dex) || []) : []}
        onPatch={(updates) => patch(selectedRows.map((r) => r.dex), updates)}
      />
    </div>
  );
}
