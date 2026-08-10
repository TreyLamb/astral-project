import { useState, useMemo, useCallback } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { detectCpTier, detectStarBand } from '../pogofiltersConfig';
import { terms, findUnusedLabels } from '../filterSyntax';

// Labels down, filters across. Twenty-four near-identical trash filters are
// impossible to audit one at a time — laid out as a grid, the one row with a
// hole in it is the bug, and it is visible without reading a single query.

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

const LABEL_W = 'min(186px, 44vw)';
const COL_W = 30;
const NAME_H = 130;
const HEAD_BG = '#0d0918';

const SORTS = [
  { id: 'usage', label: 'Order: most used' },
  { id: 'listed', label: 'Order: as listed' },
  { id: 'name', label: 'Order: A to Z' },
];

const THRESHOLDS = [0.5, 0.6, 0.75, 0.9];

function cellStyle(cell, color) {
  const base = {
    width: '100%', height: 22, padding: 0, borderRadius: 5, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    font: '800 10px/1 "Consolas", ui-monospace, monospace',
  };
  const edge = cell.exact ? null : '2px solid var(--pgf-warn)';
  if (cell.state === 'negated') {
    return { ...base, color: '#120c1f', background: color, border: edge || `1px solid ${color}` };
  }
  if (cell.state === 'present') {
    return {
      ...base,
      color,
      background: `color-mix(in srgb, ${color} 18%, transparent)`,
      border: edge || `2px solid ${color}`,
    };
  }
  return {
    ...base,
    color: 'var(--pgf-warn)',
    background: cell.flagged ? 'rgba(255, 176, 58, 0.12)' : 'rgba(0, 0, 0, 0.3)',
    border: cell.flagged ? '1px dashed var(--pgf-warn)' : '1px solid var(--pgf-line)',
  };
}

function glyph(cell) {
  if (cell.state === 'absent') return cell.flagged ? '?' : '';
  if (!cell.exact) return '≠';
  return cell.state === 'negated' ? '!' : '+';
}

export default function LabelMatrixView() {
  const { filters, labels, saveFilter, showToast } = usePogoFilters();

  const [only, setOnly] = useState('all');
  const [sort, setSort] = useState('usage');
  const [threshold, setThreshold] = useState(0.75);
  const [showAllGaps, setShowAllGaps] = useState(false);

  const rows = useMemo(() => {
    const maps = filters.map((f) => {
      const m = new Map();
      for (const t of terms(f.query)) m.set(norm(t.text), t);
      return m;
    });
    return labels.map((l) => {
      const n = norm(l.name);
      // exact matters because in-game matching is case- and space-sensitive:
      // "!evolve me" is detected here as EvolveMe but is a different search.
      const cells = maps.map((m) => {
        const t = m.get(n);
        return t
          ? { state: t.negated ? 'negated' : 'present', exact: t.text === l.name, raw: t.raw.trim() }
          : { state: 'absent', exact: true };
      });
      return {
        label: l,
        cells,
        count: cells.filter((c) => c.state !== 'absent').length,
        inexact: cells.filter((c) => c.state !== 'absent' && !c.exact).length,
        missing: filters.filter((f, i) => cells[i].state === 'absent'),
      };
    });
  }, [filters, labels]);

  // The payoff. A label carried by nearly every filter but absent from three of
  // them is far more likely a copy-paste miss than a decision, so those holes
  // get named rather than left to be found.
  const gapRows = useMemo(() => rows
    .filter((r) => r.count > 0 && r.missing.length > 0 && r.count / filters.length >= threshold)
    .sort((a, b) => a.missing.length - b.missing.length || b.count - a.count),
  [rows, filters.length, threshold]);

  const gapIds = useMemo(() => new Set(gapRows.map((r) => r.label.id)), [gapRows]);
  const unused = useMemo(() => findUnusedLabels(filters, labels), [filters, labels]);
  const unusedIds = useMemo(() => new Set(unused.map((l) => l.id)), [unused]);
  const misspelt = useMemo(() => rows.filter((r) => r.inexact > 0), [rows]);

  const cols = useMemo(() => filters.map((f, i) => ({
    filter: f,
    count: rows.filter((r) => r.cells[i].state !== 'absent').length,
    gaps: gapRows.filter((r) => r.cells[i].state === 'absent').length,
  })), [filters, rows, gapRows]);

  const totals = useMemo(() => ({
    negated: rows.reduce((n, r) => n + r.cells.filter((c) => c.state === 'negated').length, 0),
    present: rows.reduce((n, r) => n + r.cells.filter((c) => c.state === 'present').length, 0),
    inexact: rows.reduce((n, r) => n + r.inexact, 0),
  }), [rows]);

  const visible = useMemo(() => {
    let list = rows;
    if (only === 'gaps') list = rows.filter((r) => gapIds.has(r.label.id));
    if (only === 'unused') list = rows.filter((r) => unusedIds.has(r.label.id));
    if (only === 'spelling') list = rows.filter((r) => r.inexact > 0);
    if (sort === 'usage') list = [...list].sort((a, b) => b.count - a.count || a.label.name.localeCompare(b.label.name));
    if (sort === 'name') list = [...list].sort((a, b) => a.label.name.localeCompare(b.label.name));
    return list;
  }, [rows, only, sort, gapIds, unusedIds]);

  // Same add/remove as FiltersView's toggleLabel: absent becomes "!Label",
  // anything present is removed with its joining operator and nothing else.
  // Returns null when nothing changed, which happens when the query spells the
  // label differently — detection normalises caps and spaces, removal by name
  // cannot.
  const write = useCallback((filter, label) => {
    const present = terms(filter.query).find((t) => norm(t.text) === norm(label.name));
    let next;
    if (!present) {
      next = filter.query.trim() ? `${filter.query.trim()}&!${label.name}` : `!${label.name}`;
    } else {
      const esc = label.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      next = filter.query
        .replace(new RegExp(`&\\s*!?\\s*${esc}(?=[&,)]|$)`, 'i'), '')
        .replace(new RegExp(`^!?\\s*${esc}\\s*&`, 'i'), '')
        .replace(new RegExp(`^!?\\s*${esc}$`, 'i'), '');
    }
    if (next === filter.query) return null;
    return saveFilter({
      ...filter,
      query: next,
      cpTier: detectCpTier(next),
      starBand: detectStarBand(next),
    });
  }, [saveFilter]);

  const clickCell = useCallback((filter, label, cell) => {
    if (write(filter, label)) {
      showToast(cell.state === 'absent'
        ? `Added !${label.name} to "${filter.name}"`
        : `Removed ${label.name} from "${filter.name}"`);
      return;
    }
    showToast(`"${filter.name}" writes this as "${cell.raw}", not "${label.name}". Caps and spaces both matter in game, so fix the spelling on the Filters tab and this cell will toggle.`, 'error');
  }, [write, showToast]);

  const fillGaps = useCallback(async (label, missing) => {
    for (const f of missing) await write(f, label);
    showToast(`Added !${label.name} to ${missing.length} filter${missing.length === 1 ? '' : 's'}`);
  }, [write, showToast]);

  if (!filters.length || !labels.length) {
    return (
      <div className="pgf-page">
        <div className="pgf-panel" style={{ padding: 28, textAlign: 'center' }}>
          <p className="pgf-sub" style={{ margin: 0 }}>
            The matrix needs both filters and labels. Load your filters on the Filters tab and
            define labels on the Labels tab, then come back here.
          </p>
        </div>
      </div>
    );
  }

  const shownGaps = showAllGaps ? gapRows : gapRows.slice(0, 6);

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <button className={`pgf-chip${only === 'all' ? ' on' : ''}`} onClick={() => setOnly('all')}>
          All labels <span className="pgf-chip-n">{labels.length}</span>
        </button>
        <button
          className={`pgf-chip warn${only === 'gaps' ? ' on' : ''}`}
          title="Labels most of your filters carry but a few do not"
          onClick={() => setOnly('gaps')}
        >
          Likely gaps <span className="pgf-chip-n">{gapRows.length}</span>
        </button>
        <button
          className={`pgf-chip warn${only === 'unused' ? ' on' : ''}`}
          title={unused.map((l) => l.name).join(', ') || 'Every label is referenced somewhere'}
          onClick={() => setOnly('unused')}
        >
          Referenced by nothing <span className="pgf-chip-n">{unused.length}</span>
        </button>
        <button
          className={`pgf-chip warn${only === 'spelling' ? ' on' : ''}`}
          title={`${totals.inexact} cells write the label with different caps or spacing than the label itself, so the game matches nothing`}
          onClick={() => setOnly('spelling')}
        >
          Spelled differently <span className="pgf-chip-n">{misspelt.length}</span>
        </button>

        <select className="pgf-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <select
          className="pgf-select"
          value={threshold}
          title="How widespread a label must be before a missing one counts as a gap"
          onChange={(e) => setThreshold(Number(e.target.value))}
        >
          {THRESHOLDS.map((t) => (
            <option key={t} value={t}>Flag gaps at {Math.round(t * 100)}% or more</option>
          ))}
        </select>

        <span className="pgf-spacer" />
        <span className="pgf-muted">
          {labels.length} × {filters.length} = {labels.length * filters.length} cells ·
          {' '}{totals.negated} excluded · {totals.present} required
        </span>
      </div>

      {gapRows.length > 0 && (
        <div className="pgf-panel" style={{ padding: 14, marginBottom: 12, borderLeft: '3px solid var(--pgf-warn)' }}>
          <div className="pgf-h" style={{ marginBottom: 6 }}>
            Likely oversights — {gapRows.length} label{gapRows.length === 1 ? '' : 's'} in most filters, missing from a few
          </div>
          <p className="pgf-sub" style={{ marginBottom: 10 }}>
            A label carried by {Math.round(threshold * 100)}% or more of your filters but absent from the rest is
            usually a copy-paste miss rather than a decision. Click a filter below to add
            <code> !Label</code> to just that one, or add it to every one at once.
          </p>
          {shownGaps.map((r) => (
            <div key={r.label.id} className="pgf-fcard-row" style={{ marginTop: 6 }}>
              <span className="pgf-lab" style={{ '--lc': r.label.color, cursor: 'default' }}>{r.label.name}</span>
              <span className="pgf-muted">
                in {r.count} of {filters.length} · missing from {r.missing.length}:
              </span>
              {r.missing.map((f) => (
                <button
                  key={f.id}
                  className="pgf-chip warn on"
                  title={`Add !${r.label.name} to "${f.name}"`}
                  onClick={() => clickCell(f, r.label, { state: 'absent' })}
                >
                  + {f.name}
                </button>
              ))}
              <span className="pgf-spacer" />
              <button
                className="pgf-btn pgf-btn-sm pgf-btn-primary"
                onClick={() => fillGaps(r.label, r.missing)}
              >
                Add to all {r.missing.length}
              </button>
            </div>
          ))}
          {gapRows.length > 6 && (
            <button
              className="pgf-btn pgf-btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => setShowAllGaps((v) => !v)}
            >
              {showAllGaps ? 'Show fewer' : `Show all ${gapRows.length}`}
            </button>
          )}
        </div>
      )}

      <div className="pgf-chipbar">
        <span className="pgf-muted">Click any cell to add or remove that label in that filter.</span>
        <span className="pgf-spacer" />
        {[
          { cell: { state: 'negated', exact: true }, text: 'excluded' },
          { cell: { state: 'present', exact: true }, text: 'required' },
          { cell: { state: 'absent', exact: true }, text: 'absent' },
          { cell: { state: 'absent', exact: true, flagged: true }, text: 'gap' },
          { cell: { state: 'negated', exact: false }, text: 'spelled differently' },
        ].map((k) => (
          <span key={k.text} className="pgf-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...cellStyle(k.cell, '#c874ff'), width: 22, cursor: 'default' }}>{glyph(k.cell)}</span>
            {k.text}
          </span>
        ))}
      </div>

      <div className="pgf-panel" style={{ overflow: 'auto', maxHeight: '72vh' }}>
        <table className="pgf-matrix" style={{ width: 'auto', minWidth: '100%' }}>
          <thead>
            <tr>
              <th
                title="Click any cell to add or remove that label in that filter"
                style={{
                  position: 'sticky', top: 0, left: 0, zIndex: 30, background: HEAD_BG,
                  width: LABEL_W, minWidth: LABEL_W, verticalAlign: 'bottom',
                  borderRight: '2px solid var(--pgf-line-str)',
                  borderBottom: '2px solid var(--pgf-line-str)',
                }}
              >
                Label \ filter
              </th>
              {cols.map((c) => (
                <th
                  key={c.filter.id}
                  title={`${c.filter.name} — carries ${c.count} of ${labels.length} labels${c.gaps ? `, missing ${c.gaps} that most of your filters have` : ''}`}
                  style={{
                    position: 'sticky', top: 0, zIndex: 20, background: HEAD_BG,
                    width: COL_W, minWidth: COL_W, maxWidth: COL_W, overflow: 'hidden',
                    padding: '6px 2px 4px', textAlign: 'center', verticalAlign: 'bottom',
                    borderBottom: `2px solid ${c.gaps ? 'var(--pgf-warn)' : 'var(--pgf-line-str)'}`,
                    fontSize: 10, fontWeight: 700, letterSpacing: 0, textTransform: 'none',
                    color: c.gaps ? 'var(--pgf-warn)' : 'var(--pgf-text-dim)',
                  }}
                >
                  <span style={{ height: NAME_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span
                      style={{
                        writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap', maxHeight: NAME_H,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {c.filter.name}
                    </span>
                  </span>
                  <span style={{ display: 'block', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>
                    {c.count}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const isGap = gapIds.has(r.label.id);
              const isUnused = unusedIds.has(r.label.id);
              return (
                <tr key={r.label.id}>
                  <td
                    style={{
                      position: 'sticky', left: 0, zIndex: 10,
                      background: i % 2 ? 'var(--pgf-row-b)' : 'var(--pgf-row-a)',
                      width: LABEL_W, minWidth: LABEL_W, maxWidth: LABEL_W,
                      borderRight: '2px solid var(--pgf-line-str)',
                      borderLeft: `3px solid ${isUnused ? 'var(--pgf-err)' : isGap ? 'var(--pgf-warn)' : 'transparent'}`,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                      <span
                        className="pgf-lab"
                        style={{
                          '--lc': r.label.color, cursor: 'default', display: 'inline-block',
                          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                        title={r.label.notes || r.label.name}
                      >
                        {r.label.name}
                      </span>
                      <span
                        className={isUnused ? 'pgf-lint-badge pgf-lint-error' : isGap ? 'pgf-lint-badge pgf-lint-warning' : 'pgf-chip-n'}
                        style={{ marginLeft: 'auto', flexShrink: 0 }}
                        title={isUnused
                          ? 'No filter references this label'
                          : isGap
                            ? `In ${r.count} of ${filters.length} — missing from ${r.missing.map((f) => f.name).join(', ')}`
                            : `In ${r.count} of ${filters.length} filters`}
                      >
                        {r.count}
                      </span>
                    </span>
                  </td>
                  {r.cells.map((c, ci) => {
                    const f = filters[ci];
                    const cell = { ...c, flagged: isGap && c.state === 'absent' };
                    return (
                      <td key={f.id} style={{ padding: '1px 2px', textAlign: 'center' }}>
                        <button
                          style={cellStyle(cell, r.label.color)}
                          aria-label={`${r.label.name} in ${f.name}: ${cell.state}`}
                          title={cell.state === 'absent'
                            ? `${f.name} does not mention ${r.label.name}${cell.flagged ? ', and most of your filters do' : ''}. Click to add !${r.label.name}.`
                            : cell.exact
                              ? `${f.name} has ${cell.raw}. Click to remove it.`
                              : `${f.name} writes it as ${cell.raw}, not ${r.label.name} — different caps or spacing, so in game this matches nothing.`}
                          onClick={() => clickCell(f, r.label, cell)}
                        >
                          {glyph(cell)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="pgf-muted" style={{ padding: 20, textAlign: 'center' }}>
          Nothing to show with this row filter.
        </p>
      )}

      <p className="pgf-sub" style={{ marginTop: 14 }}>
        Detection ignores caps and spaces, so <code>!evolve me</code> is still recognised as
        <code> EvolveMe</code> and marked <b>≠</b>. Anything written back uses the label name exactly
        as stored — in-game matching is case-sensitive, and the two are genuinely different searches.
      </p>
    </div>
  );
}
