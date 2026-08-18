import { useState, useMemo } from 'react';

import { Panel, Seg } from '../EftBits';
import { ZONE_MODES } from './eftMapFilters';
import { bestJoin } from './eftMapGeometry';
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
      help={(
        <>
          <p>
            A zone overrides the map-wide filters inside its own outline — the middle of the
            three tiers. Draw a box around Resort and set it to <strong>Minimal</strong> with
            just Bosses, and only bosses show there while the rest of the map keeps its own
            filters.
          </p>
          <p className="eft-help-warn">
            Zones are scratch — reloading the page clears them. They save and restore as part
            of a saved route, so save one from the Routes panel to keep them.
          </p>
        </>
      )}
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
        <div className="eft-empty">
          No zones. Draw a <b>Box</b> or a <b>Shape</b> to filter one part of the map differently.
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

/** How far apart the two ends being joined are, in whatever unit the map has. */
const gap = (units, metresPerUnit) => (metresPerUnit
  ? `${Math.round(units * metresPerUnit)} m`
  : `${units.toFixed(3)} u`);

export function RoutePanel({
  routes, categories, visibleCats, activeRouteId, tool, metresPerUnit,
  mergeTolerance = 0, minMergePoints = 3,
  canUndo, canRedo, open, onToggleOpen,
  onNew, onSelect, onUpdate, onRemove, onClear, onSetTool, onUndo, onRedo, onJoin,
  savedRoutes = [], onSaveAs, onUpdateSaved, onRenameSaved, onDeleteSaved, onLoadSaved,
}) {
  return (
    <Panel
      title={`Routes${routes.length ? ` (${routes.length})` : ''}`}
      collapsible
      open={open}
      onToggle={onToggleOpen}
      help={(
        <>
          <p>
            A route is the highest filter tier: whatever falls inside its corridor follows the
            route&apos;s own rule, overriding both zones and the map-wide filters. It also lists
            what you pass and roughly when.
          </p>
          <p><b>Hit <span className="eft-kbdish">edit</span> on a route first — that puts it in edit mode.</b> Then, on the map:</p>
          <ul className="eft-help-keys">
            <li><b>Add a point mid-route</b> — press on the <b>line itself</b>, between two
              existing points, and drag. A new point is inserted there, in order, and follows
              the cursor until you let go. Hovering the line shows a green <b>+</b> where it
              would land.</li>
            <li><b>Move a point</b> — drag it.</li>
            <li><b>Delete a point</b> — <kbd>Shift</kbd> + click it.</li>
            <li><b>Carry on from the end</b> — click the <b>last</b> point, then keep clicking
              to place more. <kbd>Enter</kbd> or right-click stops.</li>
            <li><b>Bend a segment</b> — hold <kbd>C</kbd> while placing and scroll to curve it.</li>
            <li><b>Close the loop</b> — a square, a circle, a patrol route — click the
              <b> first</b> point while drawing, or <b>drag either end onto the route&apos;s own
              other end</b>. End-to-end is a same-route gesture only; it never reaches across to
              another route.</li>
            <li><b>Merge two routes</b> — only where they genuinely run together, and only from
              the picker below. Two routes merge when at least <b>{minMergePoints} waypoints in a
              row</b>, counting inward from each route&apos;s end, sit on top of each other. The
              whole shared run merges, so if they run together for thirty points all thirty
              collapse into one. Neither line is re-routed.</li>
            <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes, <kbd>Ctrl</kbd>+<kbd>Y</kbd> redoes. Undo covers
              the whole route list, so a Clear, a Delete and an Absorb all come back.</li>
          </ul>
          <p className="eft-help-warn">
            Routes and zones are scratch — <b>reloading the page clears them</b>. <b>Save</b> a
            route to keep it; whatever zones are drawn go with it and come back on load.
          </p>
        </>
      )}
      actions={<button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={onNew}>+ Route</button>}
    >
      {savedRoutes.length ? (
        <div className="eft-field" style={{ marginBottom: 10 }}>
          <span className="eft-label">Saved ({savedRoutes.length}) — click to load</span>
          <ul className="eft-linelist">
            {savedRoutes.map((sv) => (
              <li key={sv.id}>
                <span className="eft-swatch" style={{ background: sv.color }} />
                <button
                  type="button"
                  className="eft-line-text eft-wp-jump"
                  title={`Load a copy of “${sv.name}” onto the map`}
                  onClick={() => onLoadSaved(sv.id)}
                >
                  {sv.name}
                </button>
                <span className="eft-note">
                  {sv.waypoints?.length || 0} pts
                  {sv.zones?.length ? ` · ${sv.zones.length} zone${sv.zones.length === 1 ? '' : 's'}` : ''}
                </span>
                <button type="button" className="eft-iconbtn" title="Rename"
                  onClick={() => {
                    const name = window.prompt('Rename this saved route', sv.name);
                    if (name) onRenameSaved(sv.id, name);
                  }}>✎</button>
                <button type="button" className="eft-iconbtn" title="Delete this saved route"
                  onClick={() => {
                    if (window.confirm(`Delete the saved route “${sv.name}”?`)) onDeleteSaved(sv.id);
                  }}>×</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!routes.length ? (
        <div className="eft-empty">
          No routes. <b>+ Route</b> starts one — click the map to place points.
        </div>
      ) : null}

      {routes.map((r) => {
        const open = r.id === activeRouteId;
        const drawing = open && tool === 'route';
        // Longest shared run first, and every candidate says how much it shares,
        // because "absorb" is otherwise a blind pick from a list of names. A
        // route that shares too little is listed but disabled — seeing WHY it
        // cannot merge is what tells you the two lines do not actually run
        // together, rather than leaving you clicking a name that does nothing.
        const joinable = open && r.waypoints.length >= 2 && !r.closed
          ? routes
            .filter((o) => o.id !== r.id && o.waypoints.length >= 2 && !o.closed)
            .map((o) => ({ route: o, join: bestJoin(r, o, mergeTolerance) }))
            .filter((o) => o.join)
            .sort((x, y) => (y.join.overlap - x.join.overlap) || (x.join.distance - y.join.distance))
          : [];
        const mergeable = joinable.filter((o) => o.join.overlap >= minMergePoints);
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
                    title="Ctrl+Y or Ctrl+Shift+Z">Redo</button>
                  <button type="button" className="eft-btn eft-btn-sm"
                    disabled={r.waypoints.length < 3}
                    onClick={() => onUpdate(r.id, { closed: !r.closed })}
                    title="Join the last waypoint back to the first, linking that vertex rather than duplicating it">
                    {r.closed ? 'Open loop' : 'Close loop'}
                  </button>
                </div>

                {/* Clear sat in the row above, one button along from Undo and
                    Close loop, where a mis-click wiped the whole line. It keeps
                    its own row with Save — still reachable, no longer in the
                    path of the buttons you press constantly. */}
                <div className="eft-controls eft-controls-keep" style={{ marginBottom: 8 }}>
                  <button type="button" className="eft-btn eft-btn-sm eft-is-primary"
                    disabled={!r.waypoints.length}
                    title="Keep this route in the library so it survives the session"
                    onClick={() => {
                      const name = window.prompt('Save this route as', r.name);
                      if (name) onSaveAs(r.id, name);
                    }}>Save</button>
                  <button type="button" className="eft-btn eft-btn-sm eft-is-danger"
                    disabled={!r.waypoints.length}
                    title="Delete every waypoint on this route, keeping the route itself"
                    onClick={() => {
                      const n = r.waypoints.length;
                      if (window.confirm(
                        `Clear all ${n} waypoint${n === 1 ? '' : 's'} from “${r.name}”?`
                        + '\n\nThe route itself stays. Ctrl+Z undoes this.',
                      )) onClear(r.id);
                    }}>Clear</button>
                  {savedRoutes.length ? (
                    <select
                      className="eft-select eft-select-sm"
                      value=""
                      disabled={!r.waypoints.length}
                      title="Overwrite one of your saved routes with this one"
                      onChange={(e) => { if (e.target.value) onUpdateSaved(e.target.value, r.id); e.target.value = ''; }}
                    >
                      <option value="">Overwrite saved…</option>
                      {savedRoutes.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
                    </select>
                  ) : null}
                </div>

                {joinable.length ? (
                  <div className="eft-field" style={{ marginBottom: 8 }}>
                    <span className="eft-label">
                      Merge a route that runs along this one
                    </span>
                    <select
                      className="eft-select"
                      value=""
                      disabled={!mergeable.length}
                      onChange={(e) => { if (e.target.value) onJoin(e.target.value); }}
                      style={{ width: '100%' }}
                    >
                      <option value="">
                        {mergeable.length
                          ? `Pick one of ${mergeable.length} to merge…`
                          : `Nothing shares ${minMergePoints} points with this route`}
                      </option>
                      {joinable.map(({ route: o, join }) => {
                        const ok = join.overlap >= minMergePoints;
                        return (
                          <option key={o.id} value={o.id} disabled={!ok}>
                            {o.name} — {ok
                              ? `${join.overlap} shared points`
                              : `only ${join.overlap} shared, needs ${minMergePoints}`}
                          </option>
                        );
                      })}
                    </select>
                    <div className="eft-note eft-note-tight">
                      Shared means within {gap(mergeTolerance, metresPerUnit)} of each other,
                      {' '}
                      {minMergePoints}
                      {' '}
                      in a row from the ends.
                    </div>
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
                  <div className="eft-note eft-note-tight">
                    {r.radius === 0
                      ? 'Zero — draws only, filters nothing.'
                      : 'Markers inside the band follow the rule below.'}
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
                    title="Remove this route from the map entirely"
                    onClick={() => {
                      if (window.confirm(
                        `Delete the route “${r.name}”?`
                        + '\n\nThis removes the route itself, not just its points. Ctrl+Z undoes it.',
                      )) onRemove(r.id);
                    }}>Delete</button>
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
    <Panel
      title={`Along ${route.name}`}
      collapsible
      open={open}
      onToggle={onToggleOpen}
      help={(
        <>
          <p>
            Everything inside this route&apos;s corridor, in the order you walk past it, with how
            far along the line it sits and how far off to the side.
          </p>
          <p>Click a row to centre the map on it. Widen the corridor in Routes to catch more.</p>
        </>
      )}
    >
      <div className="eft-map-runstrip">
        <span className="eft-run-total">
          {metresPerUnit
            ? `${Math.round(manifest.totalMetres)} m`
            : `${manifest.totalUnits.toFixed(3)} u`}
        </span>
        {manifest.times.map((t) => (
          <span key={t.name} className="eft-run-leg" title={t.name}>
            <em>{t.name}</em>{fmtTime(t.seconds)}
          </span>
        ))}
        {metresPerUnit ? null : <span className="eft-run-leg">no scale on this map</span>}
      </div>

      {!manifest.rows.length ? (
        <div className="eft-empty">
          Nothing in the corridor. Widen the route&apos;s radius.
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
