import { useState, useMemo } from 'react';

import { Panel, Seg } from '../EftBits';
import { ZONE_MODES } from './eftMapFilters';
import { SPRITE_GLYPHS } from './SpriteMarkerLayer';

// Sidebar UI for the three filter tiers. The tiers themselves are decided in
// eftMapFilters.js, which is pure and tested; nothing here re-implements the
// precedence rules, it only edits the rules those functions read.

/**
 * The source's own icon font, so a filter row matches their sidebar.
 *
 * Their font is missing a glyph for at least one real category (`map_edit`),
 * so the fallback is the category's colour rather than an empty gap — a blank
 * cell reads as a broken row.
 */
export function CatIcon({ icon, color }) {
  const glyph = icon ? SPRITE_GLYPHS[icon] : null;
  if (!glyph) {
    return (
      <span
        className="eft-cat-icon"
        aria-hidden="true"
        style={{
          background: color ? `#${String(color).replace('#', '')}` : 'var(--eft-line-bright)',
          height: 9,
          borderRadius: 1,
        }}
      />
    );
  }
  return (
    <span className="eft-cat-icon" aria-hidden="true">
      {String.fromCharCode(parseInt(glyph, 16))}
    </span>
  );
}

function CategoryPicker({ categories, selected, onChange, onUseCurrent }) {
  const [query, setQuery] = useState('');
  const chosen = useMemo(() => new Set(selected || []), [selected]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => `${c.title} ${c.group}`.toLowerCase().includes(q));
  }, [categories, query]);

  const toggle = (id) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div className="eft-map-filters" style={{ maxHeight: '26vh', marginTop: 6 }}>
      <div className="eft-controls" style={{ marginBottom: 4 }}>
        <input
          className="eft-input"
          placeholder="Filter categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="button" className="eft-btn eft-btn-sm" onClick={onUseCurrent}
          title="Copy whatever the map-wide filters currently show">
          Copy map
        </button>
        <button type="button" className="eft-btn eft-btn-sm" onClick={() => onChange([])}>
          None
        </button>
      </div>
      {shown.map((c) => (
        <label key={c.id} className="eft-checkline eft-map-cat">
          <input type="checkbox" checked={chosen.has(c.id)} onChange={() => toggle(c.id)} />
          <CatIcon icon={c.icon} color={c.color} />
          <span className="eft-line-text">{c.title}</span>
          <span className="eft-note">{c.count}</span>
        </label>
      ))}
      {!shown.length ? <div className="eft-note" style={{ padding: '4px 12px' }}>No match.</div> : null}
    </div>
  );
}

function RuleEditor({ rule, categories, onChange, visibleCats, modes = ZONE_MODES }) {
  const mode = rule?.mode || 'inherit';
  return (
    <>
      <Seg
        value={mode}
        onChange={(v) => onChange({ ...rule, mode: v })}
        options={modes.map((m) => ({ value: m.value, label: m.label, title: m.hint }))}
      />
      <div className="eft-note" style={{ marginTop: 4 }}>
        {modes.find((m) => m.value === mode)?.hint}
      </div>
      {mode === 'only' ? (
        <CategoryPicker
          categories={categories}
          selected={rule?.categories}
          onChange={(categoriesNext) => onChange({ ...rule, categories: categoriesNext })}
          onUseCurrent={() => onChange({ ...rule, categories: [...visibleCats] })}
        />
      ) : null}
    </>
  );
}

export function ZonePanel({
  zones, categories, visibleCats, activeZoneId, tool, hiddenByZone,
  open, onToggleOpen,
  onSetTool, onSelect, onUpdate, onRemove, onMove,
}) {
  return (
    <Panel
      title={`Zones${zones.length ? ` (${zones.length})` : ''}`}
      collapsible
      open={open}
      onToggle={onToggleOpen}
      actions={(
        <>
          <button type="button" className={`eft-btn eft-btn-sm${tool === 'zone-rect' ? ' eft-is-on' : ''}`}
            onClick={() => onSetTool(tool === 'zone-rect' ? null : 'zone-rect')}>
            + Box
          </button>
          <button type="button" className={`eft-btn eft-btn-sm${tool === 'zone-poly' ? ' eft-is-on' : ''}`}
            onClick={() => onSetTool(tool === 'zone-poly' ? null : 'zone-poly')}>
            + Shape
          </button>
        </>
      )}
    >
      {!zones.length ? (
        <div className="eft-note">
          A zone overrides the map-wide filters inside its own outline — the middle of the three
          tiers. Draw a box around Resort and set it to <strong>Minimal</strong> with just Bosses,
          and only bosses show there while the rest of the map keeps its own filters.
        </div>
      ) : null}

      {zones.map((z, i) => {
        const open = z.id === activeZoneId;
        return (
          <div key={z.id} className={`eft-row-card${open ? ' eft-is-on' : ''}`}>
            <div className="eft-row-card-head">
              <span className="eft-swatch" style={{ background: z.color }} />
              <input
                className="eft-input eft-input-sm"
                value={z.name}
                onChange={(e) => onUpdate(z.id, { name: e.target.value })}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button type="button" className="eft-btn eft-btn-sm" title="Show or hide this zone"
                onClick={() => onUpdate(z.id, { hidden: !z.hidden })}>
                {z.hidden ? 'off' : 'on'}
              </button>
              <button type="button" className="eft-btn eft-btn-sm" title="Raise — the topmost zone wins an overlap"
                disabled={i === zones.length - 1} onClick={() => onMove(z.id, 1)}>↑</button>
              <button type="button" className="eft-btn eft-btn-sm" title="Lower"
                disabled={i === 0} onClick={() => onMove(z.id, -1)}>↓</button>
              <button type="button" className="eft-btn eft-btn-sm"
                onClick={() => onSelect(open ? null : z.id)}>{open ? '−' : 'edit'}</button>
            </div>

            {open ? (
              <>
                <RuleEditor
                  rule={z.rule}
                  categories={categories}
                  visibleCats={visibleCats}
                  onChange={(rule) => onUpdate(z.id, { rule })}
                />
                <div className="eft-controls" style={{ marginTop: 8 }}>
                  <span className="eft-note" style={{ flex: 1 }}>
                    {hiddenByZone ? `${hiddenByZone} hidden by zones` : 'nothing hidden by zones'}
                  </span>
                  <button type="button" className="eft-btn eft-btn-sm eft-is-danger"
                    onClick={() => onRemove(z.id)}>Delete</button>
                </div>
              </>
            ) : (
              <div className="eft-note">
                {ZONE_MODES.find((m) => m.value === (z.rule?.mode || 'inherit'))?.label}
                {z.rule?.mode === 'only' ? ` · ${z.rule.categories?.length || 0} categories` : ''}
                {z.hidden ? ' · hidden' : ''}
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

export function RoutePanel({
  routes, categories, visibleCats, activeRouteId, tool, metresPerUnit,
  canUndo, canRedo, open, onToggleOpen,
  onNew, onSelect, onUpdate, onRemove, onSetTool, onUndo, onRedo, onJoin,
}) {
  return (
    <Panel
      title={`Routes${routes.length ? ` (${routes.length})` : ''}`}
      collapsible
      open={open}
      onToggle={onToggleOpen}
      actions={<button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={onNew}>+ Route</button>}
    >
      <div className="eft-note" style={{ marginBottom: 8 }}>
        Open a route to edit it: drag a point to move it, drag the line to insert one,
        shift-click to delete. Click the <b>last</b> point to carry on drawing from there,
        and hold <kbd>C</kbd> while placing to bend the segment. Drop an end onto another
        route&apos;s end to join them into one.
      </div>

      {!routes.length ? (
        <div className="eft-note">
          A route is the highest tier: whatever falls inside its corridor is filtered by the
          route&apos;s own rule, overriding both zones and the map-wide filters. It also gives an
          ordered list of what you pass and roughly when.
        </div>
      ) : null}

      {routes.map((r) => {
        const open = r.id === activeRouteId;
        const drawing = open && tool === 'route';
        const joinable = open && r.waypoints.length >= 2 && !r.closed
          ? routes.filter((o) => o.id !== r.id && o.waypoints.length >= 2 && !o.closed)
          : [];
        return (
          <div key={r.id} className={`eft-row-card${open ? ' eft-is-on' : ''}`}>
            <div className="eft-row-card-head">
              <span className="eft-swatch" style={{ background: r.color }} />
              <input
                className="eft-input eft-input-sm"
                value={r.name}
                onChange={(e) => onUpdate(r.id, { name: e.target.value })}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button type="button" className="eft-btn eft-btn-sm"
                onClick={() => onUpdate(r.id, { hidden: !r.hidden })}>{r.hidden ? 'off' : 'on'}</button>
              <button type="button" className="eft-btn eft-btn-sm"
                onClick={() => onSelect(open ? null : r.id)}>{open ? '−' : 'edit'}</button>
            </div>

            {open ? (
              <>
                <div className="eft-controls" style={{ marginBottom: 8 }}>
                  {/* With waypoints on screen you extend by clicking the last
                      one, so this is only here for a route that has none. */}
                  {drawing ? (
                    <button type="button" className="eft-btn eft-btn-sm eft-is-on"
                      onClick={() => onSetTool(null)}>Stop drawing</button>
                  ) : !r.waypoints.length ? (
                    <button type="button" className="eft-btn eft-btn-sm"
                      onClick={() => onSetTool('route')}>Draw</button>
                  ) : null}
                  <button type="button" className="eft-btn eft-btn-sm" onClick={onUndo} disabled={!canUndo}
                    title="Ctrl+Z">Undo</button>
                  <button type="button" className="eft-btn eft-btn-sm" onClick={onRedo} disabled={!canRedo}
                    title="Ctrl+Shift+Z">Redo</button>
                  <button type="button" className="eft-btn eft-btn-sm"
                    disabled={r.waypoints.length < 3}
                    onClick={() => onUpdate(r.id, { closed: !r.closed })}
                    title="Join the last waypoint back to the first, linking that vertex rather than duplicating it">
                    {r.closed ? 'Open loop' : 'Close loop'}
                  </button>
                  <button type="button" className="eft-btn eft-btn-sm"
                    disabled={!r.waypoints.length}
                    onClick={() => onUpdate(r.id, { waypoints: [], closed: false })}>Clear</button>
                </div>

                {joinable.length ? (
                  <div className="eft-field" style={{ marginBottom: 8 }}>
                    <span className="eft-label">Join another route onto the end</span>
                    <select
                      className="eft-select"
                      value=""
                      onChange={(e) => { if (e.target.value) onJoin(e.target.value); }}
                      style={{ width: '100%' }}
                    >
                      <option value="">Pick a route to absorb…</option>
                      {joinable.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                ) : null}

                <div className="eft-field">
                  <span className="eft-label">
                    Corridor — {r.radius} {metresPerUnit ? 'm' : 'units'}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={r.radius}
                    onChange={(e) => onUpdate(r.id, { radius: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                  <div className="eft-note">
                    {r.radius === 0
                      ? 'Zero — the route filters nothing and just draws.'
                      : `Markers within ${r.radius} ${metresPerUnit ? 'metres' : 'units'} of the line follow the rule below.`}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <RuleEditor
                    rule={r.rule}
                    categories={categories}
                    visibleCats={visibleCats}
                    onChange={(rule) => onUpdate(r.id, { rule })}
                  />
                </div>

                <div className="eft-controls" style={{ marginTop: 8 }}>
                  <span className="eft-note" style={{ flex: 1 }}>
                    {r.waypoints.length} waypoint{r.waypoints.length === 1 ? '' : 's'}
                    {r.closed ? ' · closed loop' : ''}
                  </span>
                  <button type="button" className="eft-btn eft-btn-sm eft-is-danger"
                    onClick={() => onRemove(r.id)}>Delete</button>
                </div>
              </>
            ) : (
              <div className="eft-note">
                {r.waypoints.length} waypoints · {r.radius}{metresPerUnit ? 'm' : 'u'} corridor
                {r.closed ? ' · loop' : ''}
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

const fmtTime = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
};

export function ManifestPanel({
  manifest, categories, route, metresPerUnit, open, onToggleOpen, onFocus,
}) {
  const byCat = useMemo(() => new Map((categories || []).map((c) => [c.id, c])), [categories]);

  if (!route) return null;

  return (
    <Panel title={`Along ${route.name}`} collapsible open={open} onToggle={onToggleOpen}>
      <div className="eft-note" style={{ marginBottom: 6 }}>
        {metresPerUnit
          ? <>Total <strong>{Math.round(manifest.totalMetres)} m</strong></>
          : <>Total <strong>{manifest.totalUnits.toFixed(3)} units</strong> — this map has no scale, so no metres.</>}
        {manifest.times.length ? (
          <> · {manifest.times.map((t) => `${t.name} ${fmtTime(t.seconds)}`).join(' · ')}</>
        ) : null}
      </div>

      {!manifest.rows.length ? (
        <div className="eft-note">
          Nothing inside the corridor yet. Draw a route and widen its radius.
        </div>
      ) : (
        <div className="eft-manifest">
          {manifest.rows.map((m) => {
            const cat = byCat.get(m.cat);
            return (
              <button key={m.id} type="button" className="eft-manifest-row"
                style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer' }}
                onClick={() => onFocus?.(m)}>
                <span className="eft-note" style={{ width: 52, flex: 'none' }}>
                  {m.alongMetres == null ? `${m.along.toFixed(3)}u` : `${Math.round(m.alongMetres)}m`}
                </span>
                <CatIcon icon={cat?.icon} color={cat?.color} />
                <span className="eft-line-text">{m.title || cat?.title || 'Marker'}</span>
                <span className="eft-note">
                  {m.offRouteMetres == null ? '' : `${Math.round(m.offRouteMetres)}m off`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
