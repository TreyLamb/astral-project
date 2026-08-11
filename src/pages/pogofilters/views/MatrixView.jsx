import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { SPECIES_ROWS, ALL_TYPES, officialArtworkUrl } from '../speciesTable';
import { needsCustomCp, REFERENCE_LEVELS, withSpeciesDefaults, isAssigned } from '../pogofiltersConfig';
import { categoriesFor, CATEGORY_SHORT, CATEGORY_LABEL } from '../classification';
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
  const { species, saveSpeciesBulk, settings, labels, showToast } = usePogoFilters();
  // Memoised so the `|| []` fallback doesn't hand a fresh array to the row
  // memo on every render and rebuild all ~936 rows for nothing.
  const presets = useMemo(() => settings?.cpPresets || [], [settings]);

  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('all');
  const [cpMin, setCpMin] = useState('');
  const [cpMax, setCpMax] = useState('');
  const [showUnchecked, setShowUnchecked] = useState(false);

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
    };
  }), [species, presets]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const mn = cpMin === '' ? -Infinity : Number(cpMin);
    const mx = cpMax === '' ? Infinity : Number(cpMax);
    return rows.filter((s) => {
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
  }, [rows, q, type, status, cpMin, cpMax, showUnchecked]);

  const visibleDex = useMemo(() => visible.map((s) => s.dex), [visible]);

  const counts = useMemo(() => ({
    tracked: rows.filter((s) => s.tracked).length,
    unchecked: rows.filter((s) => !s.tracked).length,
    assigned: rows.filter((s) => s.tracked && isAssigned(s)).length,
    needsCustom: rows.filter((s) => s.tracked && s.needsCustom).length,
  }), [rows]);

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
                <th colSpan={2} />
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
                <th style={{ width: 250 }}>Labels</th>
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
                    className={`${s.needsCustom ? 'pgf-needs ' : ''}${isCursor ? 'pgf-cursor ' : ''}${isPicked ? 'pgf-picked' : ''}`}
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
                              ? `${CATEGORY_LABEL[c]} — can't be mass-transferred, so a CP tier here is mostly decoration`
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
                    </td>
                    <td className={`pgf-stars${s.starThreshold === null ? ' inherit' : ''}`}>
                      {[1, 2, 3, 4].map((n) => (
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
        onPatch={(updates) => patch(selectedRows.map((r) => r.dex), updates)}
      />
    </div>
  );
}
