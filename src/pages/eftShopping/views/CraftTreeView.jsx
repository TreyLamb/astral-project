// Hideout crafting flow chart.
//
// Recipes chain: an item you craft at the Workbench can be an ingredient for
// something at the Lavatory, which feeds something else again. This view draws
// those chains left-to-right as folding trees.
//
// Layout and tree building are in eftCraftGraph.js — this file is the surface:
// which trees to show, what a node looks like, and pan/zoom.

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useEft } from '../eftContext';
import { itemIcon } from '../eftApi';
import { Seg, fmtDuration, fmtRub } from '../EftBits';
import {
  buildCraftIndex, buildTree, layoutForest, layoutBidirectional, rootItems, allGraphItems,
  searchItems, totalRawInputs, itemName, LAYOUT, DIRECTIONS,
} from '../eftCraftGraph';

const OVERVIEW_MODES = [
  { value: 'chains', label: 'Multi-step', title: 'Only items whose recipe chain is more than one craft deep' },
  { value: 'final', label: 'End products', title: 'Craftable items nothing else uses' },
  { value: 'intermediate', label: 'Intermediates', title: 'Items that are crafted AND used in another craft' },
  { value: 'all', label: 'Everything', title: 'Every craftable item' },
];

const MODES = [
  { value: 'overview', label: 'All trees', title: 'Every chain at once' },
  { value: 'station', label: 'By station', title: 'One station at a time' },
  { value: 'item', label: 'One item', title: 'Follow a single item up or down the chain' },
];

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.8;

// --- Node -----------------------------------------------------------------

/**
 * The fold control for one side of a node. `side` is which edge of the box
 * this is drawn on AND what it folds — left is always "what makes this"
 * (the branch that runs off to the left), right is always "what this is used
 * in" (the branch running off to the right). `slot` is null when this node
 * has nothing on that side at all, in which case nothing renders there.
 *
 * It is a real bordered button rather than a bare glyph because the
 * glyph-only version was not readable as something you could click — the
 * first thing raised about this view.
 */
function Fold({ slot, side, onToggle }) {
  if (!slot) return null;
  const cls = `eft-ct-caret eft-ct-caret-${side}`;
  if (!slot.hasChildren) return <span className={`${cls} eft-is-leaf`} />;
  const verb = side === 'left' ? 'what makes this' : 'what this is used in';
  return (
    <button
      type="button"
      className={cls}
      onClick={(e) => { e.stopPropagation(); onToggle(slot); }}
      title={slot.collapsed
        ? `Show ${verb} (${slot.hiddenCount} hidden)`
        : `Fold ${verb}`}
      aria-expanded={!slot.collapsed}
    >
      {slot.collapsed ? '+' : '−'}
    </button>
  );
}

function ItemNode({ node, selected, onToggle, onSelect, onCycleRecipe }) {
  const cls = [
    'eft-ct-node', 'eft-ct-item',
    node.craftable ? 'eft-is-craftable' : 'eft-is-raw',
    node.role === 'tool' ? 'eft-is-tool' : '',
    node.cycle ? 'eft-is-cycle' : '',
    selected ? 'eft-is-selected' : '',
    node.collapsed ? 'eft-is-folded' : '',
  ].filter(Boolean).join(' ');

  const craft = node.craft;
  const alternatives = node.recipes?.length || 0;
  // Almost every node has children on only one side, matching whichever way
  // its own tree runs. The one exception is the shared centre node of a
  // both-directions chart, which carries a second, independent `downBranch`
  // for its right (uses) side alongside its own left (made-from) side.
  const leftSlot = node.side === 'left' ? node : null;
  const rightSlot = node.side === 'right' ? node : (node.downBranch || null);

  return (
    <div
      className={cls}
      style={{ left: node.x, top: node.y - node.h / 2, width: node.w, height: node.h }}
    >
      <Fold slot={leftSlot} side="left" onToggle={onToggle} />

      <div className="eft-ct-itembody">
        <button
          type="button"
          className="eft-ct-hit"
          onClick={() => onSelect(node)}
          title={`${node.name} — show what makes it and what it is used for`}
        >
          <img
            className="eft-ct-icon"
            src={itemIcon(node.id)}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          />
          <span className="eft-ct-name">{node.name}</span>
          {node.count > 1 ? <span className="eft-ct-count">×{node.count}</span> : null}
          {node.collapsed ? <span className="eft-ct-hidden">+{node.hiddenCount}</span> : null}
        </button>

        {/* Where it's made — a label on the item, not a step in the chain. */}
        {craft ? (
          <div className="eft-ct-madeat">
            <span className="eft-ct-station">{craft.stationName} {craft.level}</span>
            <span className="eft-ct-time">
              {craft.continuous ? 'continuous' : fmtDuration(craft.duration)}
              {craft.questIds?.length ? ' · quest' : ''}
              {craft.gameVersion ? ' · edition' : ''}
            </span>
            {alternatives > 1 ? (
              <button
                type="button"
                className="eft-ct-altrecipe"
                onClick={(e) => { e.stopPropagation(); onCycleRecipe(node); }}
                title={`${alternatives} ways to make this — click to switch`}
              >
                {node.recipeIndex + 1}/{alternatives} ⇄
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <Fold slot={rightSlot} side="right" onToggle={onToggle} />
      {node.role === 'tool' ? <span className="eft-ct-flag">tool</span> : null}
      {node.cycle ? <span className="eft-ct-flag eft-is-warn">loop</span> : null}
    </div>
  );
}

// --- Canvas ---------------------------------------------------------------

/**
 * Connector between a node and its child. Has to work in both orientations:
 * an ingredient tree is mirrored so the child sits to the LEFT of its parent,
 * and a hard-coded left-to-right curve would loop back on itself.
 */
function edgePath(from, to) {
  const rightward = to.x >= from.x;
  const x1 = rightward ? from.x + from.w : from.x;
  const x2 = rightward ? to.x : to.x + to.w;
  const y1 = from.y;
  const y2 = to.y;
  const span = (x2 - x1) / 2;
  const dx = rightward ? Math.max(18, span) : Math.min(-18, span);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

/**
 * Shown when re-rooting lands on an item that has nothing under it in the
 * current direction — a raw ingredient charted as "Ingredients" is one lonely
 * box, which looks like the tool broke. Offers the two ways out.
 */
function DeadEnd({ name, index, itemId, direction, onDirection, onBack, onAll }) {
  const upCount = index.byOutput.get(itemId)?.length || 0;
  const downCount = index.byInput.get(itemId)?.length || 0;
  const other = direction === 'up' ? 'down' : 'up';
  const otherCount = other === 'up' ? upCount : downCount;

  // With both directions on screen, "nothing here" means nothing either way —
  // there is no other side left to offer.
  const message = direction === 'both' || (!upCount && !downCount)
    ? 'No recipe makes this and none uses it, so it has no chain in either direction. It is bought, looted or traded for.'
    : direction === 'up'
      ? 'Nothing crafts this — it is bought, looted or traded for, so it has no ingredient tree.'
      : 'Nothing uses this in a recipe, so it has nothing downstream.';

  return (
    <div className="eft-ct-deadend">
      <strong>{name}</strong>
      <p>{message}</p>
      <div className="eft-ct-deadend-btns">
        {otherCount && direction !== 'both' ? (
          <button type="button" className="eft-btn eft-btn-sm eft-is-on" onClick={() => onDirection(other)}>
            Show {other === 'up' ? 'what makes it' : `what it is used in (${otherCount})`}
          </button>
        ) : null}
        {onBack ? <button type="button" className="eft-btn eft-btn-sm" onClick={onBack}>← Back</button> : null}
        <button type="button" className="eft-btn eft-btn-sm" onClick={onAll}>All trees</button>
      </div>
    </div>
  );
}

function GraphCanvas({ forest, zoom, setZoom, selectedKey, onToggle, onSelect, onCycleRecipe }) {
  const scrollRef = useRef(null);
  const drag = useRef(null);

  // A root sits at the vertical midpoint of everything under it, so on a wide
  // tree it can start well below the fold. Centre it when the chart changes —
  // keyed on the first tree's identity, so folding a branch doesn't yank the
  // view around while you are reading it.
  const anchorKey = forest.bands[0]?.key;
  const rootNode = forest.nodes.find((n) => n.depth === 0);
  const anchorY = rootNode?.y;
  const anchorX = rootNode?.x;
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || anchorY == null) return;
    // Centre on the item that was asked about. In a both-ways chart that item
    // sits in the middle of the canvas, so scrolling to 0 would land on its raw
    // ingredients rather than on it.
    el.scrollLeft = Math.max(0, (anchorX ?? 0) * zoomRef.current - el.clientWidth / 2);
    el.scrollTop = Math.max(0, anchorY * zoomRef.current - el.clientHeight / 2);
    // anchorY is read at the moment the chart changes; re-running on every
    // re-layout would fight the user's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey]);

  const onPointerDown = (e) => {
    // Only a drag on empty canvas pans. Anything clickable is excluded: pointer
    // capture would otherwise redirect the whole gesture to the canvas and the
    // click would never reach the control — which is exactly what stopped the
    // tree-title fold from working.
    if (e.target.closest('.eft-ct-node, button, a, input, label')) return;
    const el = scrollRef.current;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    el.classList.add('eft-is-panning');
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const el = scrollRef.current;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  };

  const endDrag = (e) => {
    if (!drag.current) return;
    drag.current = null;
    const el = scrollRef.current;
    el.classList.remove('eft-is-panning');
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  const onWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - Math.sign(e.deltaY) * 0.1)));
  }, [setZoom]);

  // React attaches wheel passively, which can't preventDefault — so the
  // ctrl+wheel zoom has to be a manual non-passive listener or the browser
  // page-zooms instead.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  return (
    <div
      className="eft-ct-canvas"
      ref={scrollRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="eft-ct-world"
        style={{
          width: forest.width * zoom,
          height: forest.height * zoom,
        }}
      >
        <div
          className="eft-ct-scale"
          style={{ width: forest.width, height: forest.height, transform: `scale(${zoom})` }}
        >
          <svg className="eft-ct-edges" width={forest.width} height={forest.height}>
            {forest.edges.map((e) => (
              <path
                key={e.id}
                d={edgePath(e.from, e.to)}
                className={e.to.role === 'tool' ? 'eft-ct-edge eft-is-tool' : 'eft-ct-edge'}
              />
            ))}
          </svg>

          {/* The tree's own title folds it, so a whole chain can be shut
              without hunting for its root node out in the middle of the graph. */}
          {forest.bands.map((b) => (
            <button
              key={b.key}
              type="button"
              className="eft-ct-band"
              style={{ top: b.top - 19 }}
              onClick={() => onToggle(b.rootNode)}
              title={b.rootNode.collapsed ? 'Open this whole tree' : 'Fold this whole tree'}
            >
              {b.rootNode.collapsed ? '+' : '−'} {b.label}
            </button>
          ))}

          {forest.nodes.map((n) => (
            <ItemNode
              key={n.key}
              node={n}
              selected={selectedKey === n.key}
              onToggle={onToggle}
              onSelect={onSelect}
              onCycleRecipe={onCycleRecipe}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Detail panel ---------------------------------------------------------

function RecipeCard({ craft, index, onFocus }) {
  return (
    <div className="eft-ct-recipe">
      <div className="eft-ct-recipe-head">
        {/* The Christmas Tree has recipes but no buildable station page. */}
        {craft.stationLevelKey ? (
          <Link to={`/EFTsh/station/${craft.stationLevelKey}`} className="eft-ct-stationlink">
            {craft.stationName} lv{craft.level}
          </Link>
        ) : <span className="eft-ct-stationlink">{craft.stationName}</span>}
        <span>{craft.continuous ? 'continuous' : fmtDuration(craft.duration)}</span>
      </div>
      <ul className="eft-ct-reqlist">
        {craft.inputs.map((i) => (
          <li key={`in-${i.itemId}`}>
            <button type="button" onClick={() => onFocus(i.itemId)}>
              {i.count}× {itemName(index, i.itemId, i.name)}
            </button>
            {i.foundInRaid ? <span className="eft-ct-flag">FiR</span> : null}
          </li>
        ))}
        {craft.tools.map((t) => (
          <li key={`tool-${t.itemId}`} className="eft-is-tool">
            <button type="button" onClick={() => onFocus(t.itemId)}>
              {itemName(index, t.itemId, t.name)}
            </button>
            <span className="eft-ct-flag">tool — not consumed</span>
          </li>
        ))}
        {craft.resources.map((r) => (
          <li key={`res-${r.itemId}`} className="eft-is-tool">
            {itemName(index, r.itemId, r.name)}
            <span className="eft-ct-flag">{r.resource} resource</span>
          </li>
        ))}
      </ul>
      <div className="eft-ct-yield">
        →{' '}
        {craft.outputs.map((o) => (
          <button key={o.itemId} type="button" onClick={() => onFocus(o.itemId)}>
            {o.count}× {itemName(index, o.itemId, o.name)}
          </button>
        ))}
      </div>
      <div className="eft-blockchips">
        {craft.questIds?.length ? <span className="eft-chip eft-is-unmet">quest locked</span> : null}
        {craft.gameVersion ? <span className="eft-chip eft-is-info">{craft.gameVersion} edition</span> : null}
        {craft.limitPerRun ? <span className="eft-chip">max {craft.limitPerRun}</span> : null}
      </div>
    </div>
  );
}

/**
 * Type-to-find item search. Used to be a text box you typed into and then a
 * SEPARATE `<select>` you had to click into and choose from — two controls to
 * operate one search. This is one control: type, a list of matches drops
 * below the input, click one (or arrow down + Enter).
 */
function ItemPicker({ hits, query, onQueryChange, onPick, onClear, hasSelection }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDocPointerDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const pick = (hit) => {
    onPick(hit.itemId);
    onQueryChange(hit.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      const hit = hits[activeIndex] ?? hits[0];
      if (hit) pick(hit);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="eft-ct-picker" ref={boxRef}>
      <div className="eft-ct-picker-input">
        <input
          className="eft-input eft-input-sm"
          value={query}
          placeholder="Search any item…"
          onChange={(e) => { onQueryChange(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="eft-ct-picker-list"
        />
        {hasSelection ? (
          <button
            type="button"
            className="eft-ct-picker-clear"
            title="Clear selection"
            onClick={() => { onClear(); setOpen(false); }}
          >
            ×
          </button>
        ) : null}
      </div>
      {open && query && !hits.length ? (
        <div className="eft-ct-suggest eft-ct-suggest-empty">No items match &ldquo;{query}&rdquo;.</div>
      ) : null}
      {open && hits.length ? (
        <ul id="eft-ct-picker-list" className="eft-ct-suggest" role="listbox">
          {hits.map((h, i) => (
            <li key={h.itemId} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={i === activeIndex ? 'eft-is-active' : ''}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(h)}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DetailPanel({ selected, index, onFocus, onDirection, direction }) {
  if (!selected) {
    return (
      <div className="eft-ct-detail-empty">
        <strong>Click an item</strong> to show its recipes and uses here, without moving
        the chart. <strong>−</strong> on the left folds what makes it; <strong>−</strong> on
        the right folds what it&apos;s used in. Once selected, &ldquo;Root the chart
        here&rdquo; jumps the whole chart to it.
      </div>
    );
  }

  const producers = index.byOutput.get(selected.id) || [];
  const consumers = (index.byInput.get(selected.id) || []);
  const item = index.items[selected.id];
  const raw = producers.length ? [...totalRawInputs(index, selected.id, 1)] : [];

  return (
    <>
      <h3 className="eft-ct-detail-title">
        <img
          className="eft-ct-icon"
          src={itemIcon(selected.id)}
          alt=""
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
        {selected.name}
      </h3>

      <div className="eft-blockchips" style={{ marginBottom: 10 }}>
        <span className="eft-chip">{producers.length} recipe{producers.length === 1 ? '' : 's'}</span>
        <span className="eft-chip">used in {consumers.length}</span>
        {item?.basePrice ? <span className="eft-chip eft-is-info">base {fmtRub(item.basePrice)}</span> : null}
      </div>

      <div className="eft-ct-detail-actions">
        <Seg options={DIRECTIONS} value={direction} onChange={onDirection} />
        <button type="button" className="eft-btn eft-btn-sm" onClick={() => onFocus(selected.id)}>
          Root the chart here
        </button>
      </div>

      {producers.length ? (
        <>
          <h4 className="eft-ct-subhead">Made by</h4>
          {producers.map((c) => <RecipeCard key={c.id} craft={c} index={index} onFocus={onFocus} />)}
        </>
      ) : <p className="eft-ct-note">Not craftable — buy it, loot it, or take it off a trader.</p>}

      {consumers.length ? (
        <>
          <h4 className="eft-ct-subhead">Used in</h4>
          <ul className="eft-ct-uselist">
            {consumers.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onFocus(c.outputs[0].itemId)}>
                  {itemName(index, c.outputs[0].itemId, c.outputs[0].name)}
                </button>
                <span className="eft-ct-note">{c.stationName} {c.level}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {raw.length > 1 ? (
        <>
          <h4 className="eft-ct-subhead">Raw materials for one</h4>
          <ul className="eft-ct-uselist">
            {raw.map(([id, n]) => (
              <li key={id}>
                <button type="button" onClick={() => onFocus(id)}>{n}× {itemName(index, id)}</button>
              </li>
            ))}
          </ul>
          <p className="eft-ct-note">
            Estimate — where an item has several recipes this follows the first one.
          </p>
        </>
      ) : null}
    </>
  );
}

// --- View -----------------------------------------------------------------

export default function CraftTreeView() {
  const { data, craftGraph: saved, update, status } = useEft();
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  // ?station= / ?item= let the rest of the tool deep-link into a specific tree
  // (a station page links here for its own recipes). The param overlays the
  // saved settings rather than writing to them, and is dropped the moment the
  // user touches a control — otherwise it would fight every change they make.
  const [params, setParams] = useSearchParams();
  const urlStation = params.get('station');
  const urlItem = params.get('item');
  const cfg = useMemo(() => {
    if (urlStation) return { ...saved, mode: 'station', stationKey: urlStation };
    if (urlItem) return { ...saved, mode: 'item', itemId: urlItem };
    return saved;
  }, [saved, urlStation, urlItem]);

  // How much window is left below the tabs. It can't be a CSS constant: the
  // "no prices" banner comes and goes above this view, which moves its top edge
  // by ~40px. Measured in a callback ref rather than an effect so the height is
  // right on the first paint.
  const [availH, setAvailH] = useState(0);
  const fitRef = useRef(null);
  const measure = useCallback((node) => {
    if (fitRef.current) {
      window.removeEventListener('resize', fitRef.current);
      fitRef.current = null;
    }
    if (!node) return;
    const fit = () => setAvailH(
      Math.max(430, window.innerHeight - node.getBoundingClientRect().top - 22),
    );
    fitRef.current = fit;
    fit();
    window.addEventListener('resize', fit);
  }, []);

  const set = useCallback((patch) => {
    // Fold whatever the URL was forcing into the saved settings, then clear it,
    // so the first click on a control keeps the deep-linked view instead of
    // snapping back to what was saved before.
    const overlay = urlStation ? { mode: 'station', stationKey: urlStation }
      : urlItem ? { mode: 'item', itemId: urlItem } : null;
    if (overlay) setParams({}, { replace: true });
    update('craftGraph', (prev) => ({ ...prev, ...overlay, ...patch }));
  }, [update, urlStation, urlItem, setParams]);

  const index = useMemo(() => buildCraftIndex(data), [data]);
  const roots = useMemo(() => rootItems(index), [index]);
  const pool = useMemo(() => allGraphItems(index), [index]);
  const hits = useMemo(() => searchItems(pool, query, 60), [pool, query]);

  // Keep the search box showing the current selection's name after it changes
  // from anywhere other than typing here — clicking a node, the back button, a
  // ?item= deep link. Adjusted during render (the React-recommended way to
  // react to a prop/derived-value change) rather than an effect, so it never
  // clobbers an in-progress keystroke and never fires a cascading extra render.
  const [syncedItemId, setSyncedItemId] = useState(cfg.itemId);
  if (cfg.mode === 'item' && cfg.itemId && cfg.itemId !== syncedItemId) {
    setSyncedItemId(cfg.itemId);
    setQuery(itemName(index, cfg.itemId));
  }

  const collapsedSet = useMemo(() => new Set(cfg.collapsed), [cfg.collapsed]);

  // 'both' charts one item from both sides at once. It has no meaning for the
  // overview or a whole station, which already draw many roots.
  const bidirectional = cfg.direction === 'both' && cfg.mode === 'item' && !!cfg.itemId;
  const effectiveDirection = cfg.direction === 'both' && !bidirectional ? 'up' : cfg.direction;

  const treeOpts = {
    direction: effectiveDirection === 'both' ? 'up' : effectiveDirection,
    collapsed: collapsedSet,
    recipeChoice: cfg.recipeChoice || {},
    autoDepth: cfg.autoDepth,
    includeTools: cfg.includeTools,
    craftableOnly: cfg.craftableOnly,
    // "By station" means this station's recipes, full stop. Without this the
    // heads are the station's outputs but every branch below them expands
    // through whatever station happens to make that ingredient — a Medstation
    // chart grows Nutrition Unit water and Workbench wires, which reads as the
    // filter being broken. Ingredients made elsewhere stay as leaves; the
    // detail panel still says where they come from.
    stationKey: cfg.mode === 'station' ? cfg.stationKey : null,
  };

  // Which items head a tree, per mode.
  const headIds = useMemo(() => {
    if (cfg.mode === 'item') return cfg.itemId ? [cfg.itemId] : [];

    if (cfg.mode === 'station') {
      const st = index.stations.find((s) => s.key === cfg.stationKey);
      if (!st) return [];
      const ids = [...new Set(st.crafts.flatMap((c) => (
        cfg.direction === 'up'
          ? c.outputs.map((o) => o.itemId)
          : c.inputs.map((i) => i.itemId)
      )))];
      return ids.sort((a, b) => itemName(index, a).localeCompare(itemName(index, b)));
    }

    if (cfg.direction === 'down') {
      // Going forward, the interesting heads are the base materials everything
      // else is built out of, not the end products.
      return pool
        .filter((p) => !p.recipes && p.usedIn > 0)
        .sort((a, b) => b.usedIn - a.usedIn || a.name.localeCompare(b.name))
        .map((p) => p.itemId);
    }

    const filtered = cfg.overview === 'chains' ? roots.filter((r) => r.depth >= 2)
      : cfg.overview === 'final' ? roots.filter((r) => r.kind === 'final')
        : cfg.overview === 'intermediate' ? roots.filter((r) => r.kind === 'intermediate')
          : roots;
    return filtered.map((r) => r.itemId);
  }, [cfg.mode, cfg.itemId, cfg.stationKey, cfg.overview, cfg.direction, index, roots, pool]);

  const shown = useMemo(
    () => (cfg.mode === 'item' ? headIds : headIds.slice(0, cfg.limit)),
    [cfg.mode, cfg.limit, headIds],
  );

  const forest = useMemo(() => {
    if (bidirectional) {
      const id = shown[0];
      const up = buildTree(index, id, { ...treeOpts, direction: 'up' });
      const down = buildTree(index, id, { ...treeOpts, direction: 'down', rootKey: `d:${id}` });
      up.root.truncated = up.truncated || down.truncated;
      const laid = layoutBidirectional(up.root, down.root, LAYOUT.padY);
      return {
        ...laid,
        bands: [{
          key: up.root.key,
          label: `${itemName(index, id)} — what makes it, and what it makes`,
          top: LAYOUT.padY,
          bottom: laid.height,
          rootNode: up.root,
        }],
        height: laid.height + LAYOUT.padY,
      };
    }

    const entries = shown.map((id) => {
      const { root, truncated } = buildTree(index, id, treeOpts);
      root.truncated = truncated;
      return { label: `${itemName(index, id)}${truncated ? ' — too large, partly hidden' : ''}`, root };
    });
    // Ingredients flow into their product: raw materials left, finished item
    // right. 'down' already runs that way and is left alone.
    return layoutForest(entries, { flip: effectiveDirection === 'up' });
    // treeOpts is rebuilt each render on purpose — its members are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, shown, cfg.direction, cfg.autoDepth, cfg.includeTools, cfg.craftableOnly,
    collapsedSet, cfg.recipeChoice, bidirectional, effectiveDirection,
    cfg.mode, cfg.stationKey]);

  const toggle = useCallback((node) => {
    if (!node.hasChildren) return;
    update('craftGraph', (prev) => {
      const next = new Set(prev.collapsed);
      if (node.collapsed) { next.delete(node.key); next.add(`!${node.key}`); }
      else { next.delete(`!${node.key}`); next.add(node.key); }
      return { ...prev, collapsed: [...next] };
    });
  }, [update]);

  // An item craftable more than one way shows one recipe at a time; this steps
  // through them. Keyed by node key rather than item id, so the same item
  // appearing twice in a chart can be set independently.
  const cycleRecipe = useCallback((node) => {
    update('craftGraph', (prev) => {
      const choice = { ...(prev.recipeChoice || {}) };
      const total = node.recipes?.length || 1;
      choice[node.key] = ((choice[node.key] ?? 0) + 1) % total;
      return { ...prev, recipeChoice: choice };
    });
  }, [update]);

  // Re-rooting is a jump, so it needs an undo. Without one, one click on a raw
  // item leaves you looking at a single box with no obvious way back.
  const [history, setHistory] = useState([]);

  const focus = useCallback((itemId) => {
    const canUp = (index.byOutput.get(itemId)?.length || 0) > 0;
    const canDown = (index.byInput.get(itemId)?.length || 0) > 0;
    // Clicking an item is a question about that item, so it opens both sides.
    // If only one side exists, go straight there rather than showing half an
    // empty chart.
    const direction = canUp && canDown ? 'both'
      : canUp ? 'up'
        : canDown ? 'down'
          : cfg.direction;

    setHistory((h) => [...h, {
      mode: cfg.mode, itemId: cfg.itemId, stationKey: cfg.stationKey, direction: cfg.direction,
    }].slice(-25));
    set({ mode: 'item', itemId, direction });
    setSelected(null);
  }, [set, index, cfg.direction, cfg.mode, cfg.itemId, cfg.stationKey]);

  const back = useCallback(() => {
    const prev = history[history.length - 1];
    if (!prev) return;
    // set() writes to the store, i.e. it updates a component above this one.
    // Doing that from inside a setState updater runs it during render, which
    // React rightly refuses — so pop and restore as two plain calls.
    setHistory((h) => h.slice(0, -1));
    set(prev);
    setSelected(null);
  }, [history, set]);

  const foldAll = (open) => {
    if (open) {
      // Force-expand every currently visible node; anything newly revealed
      // still obeys the auto-depth, which is what keeps "expand all" from
      // unrolling the entire graph in one click.
      const keys = forest.nodes.filter((n) => n.hasChildren).map((n) => `!${n.key}`);
      set({ collapsed: keys });
    } else {
      // Roots included: "collapse" that leaves every tree head open isn't a
      // collapse, it's a trim.
      set({ collapsed: forest.nodes.filter((n) => n.hasChildren).map((n) => n.key) });
    }
  };

  // One tree, one node, nothing under it: the chart looks empty rather than
  // finished, so it gets an explanation instead.
  const deadEnd = forest.bands.length === 1
    && !forest.bands[0].rootNode.hasChildren
    && forest.nodes.length <= 1
    ? forest.bands[0].rootNode
    : null;

  if (status.loading) return <div className="eft-empty">Loading hideout data…</div>;

  if (!index.crafts.length) {
    return (
      <div className="eft-empty">
        <strong>No craft recipes in the snapshot.</strong> Regenerate it with
        {' '}<code>npm run eft:snapshot</code> — recipes come from BSG&apos;s own
        hideout/production.json and do not need tarkov.dev to be up.
      </div>
    );
  }

  const stats = {
    crafts: index.crafts.length,
    craftable: index.byOutput.size,
    intermediate: roots.filter((r) => r.kind === 'intermediate').length,
    deepest: roots[0]?.depth || 0,
  };

  return (
    <div
      className={`eft-ct${cfg.detailOpen ? '' : ' eft-no-detail'}`}
      ref={measure}
      style={availH ? { height: availH } : undefined}
    >
      <div className={`eft-ct-controls${cfg.controlsOpen ? '' : ' eft-is-closed'}`}>
        <button
          type="button"
          className="eft-ct-fold"
          onClick={() => set({ controlsOpen: !cfg.controlsOpen })}
          aria-expanded={cfg.controlsOpen}
          title={cfg.controlsOpen ? 'Hide the controls' : 'Show the controls'}
        >
          {cfg.controlsOpen ? '▾' : '▸'} Chart
        </button>

        {cfg.controlsOpen ? (
          <>
            <Seg options={MODES} value={cfg.mode} onChange={(mode) => set({ mode })} />

            {cfg.mode === 'overview' ? (
              <Seg
                options={OVERVIEW_MODES}
                value={cfg.overview}
                onChange={(overview) => set({ overview })}
              />
            ) : null}

            {cfg.mode === 'station' ? (
              <select
                className="eft-input eft-input-sm"
                value={cfg.stationKey || ''}
                onChange={(e) => set({ stationKey: e.target.value || null })}
              >
                <option value="">Pick a station…</option>
                {index.stations.map((s) => (
                  <option key={s.key} value={s.key}>{s.name} ({s.crafts.length})</option>
                ))}
              </select>
            ) : null}

            {cfg.mode === 'item' ? (
              <ItemPicker
                hits={hits}
                query={query}
                onQueryChange={setQuery}
                // Picking must orient the chart the same way clicking a node
                // does. It used to just set the id, so with the default 'up'
                // direction an item's "used in" side was simply absent — the
                // chart looked like the item fed nothing.
                onPick={focus}
                onClear={() => { set({ itemId: null }); setQuery(''); }}
                hasSelection={!!cfg.itemId}
              />
            ) : null}

            <Seg options={DIRECTIONS} value={cfg.direction} onChange={(direction) => set({ direction })} />

            <label className="eft-ct-toggle">
              <input
                type="checkbox"
                checked={cfg.includeTools}
                onChange={(e) => set({ includeTools: e.target.checked })}
              />
              Tools
            </label>
            <label className="eft-ct-toggle">
              <input
                type="checkbox"
                checked={cfg.craftableOnly}
                onChange={(e) => set({ craftableOnly: e.target.checked })}
              />
              Craftable only
            </label>

            <label className="eft-ct-toggle" title="How many craft steps open automatically">
              Auto-open
              <input
                type="range"
                min={1}
                max={6}
                value={cfg.autoDepth}
                onChange={(e) => set({ autoDepth: Number(e.target.value) })}
              />
              <span className="eft-ct-num">{cfg.autoDepth}</span>
            </label>

            {cfg.mode !== 'item' ? (
              <label className="eft-ct-toggle" title="How many trees to draw at once">
                Trees
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={cfg.limit}
                  onChange={(e) => set({ limit: Number(e.target.value) })}
                />
                <span className="eft-ct-num">{Math.min(cfg.limit, headIds.length)}/{headIds.length}</span>
              </label>
            ) : null}

            <div className="eft-ct-btns">
              {history.length ? (
                <button type="button" className="eft-btn eft-btn-sm" onClick={back} title="Undo the last re-root">
                  ← Back
                </button>
              ) : null}
              <button type="button" className="eft-btn eft-btn-sm" onClick={() => foldAll(true)}>Expand</button>
              <button type="button" className="eft-btn eft-btn-sm" onClick={() => foldAll(false)}>Collapse</button>
              <button type="button" className="eft-btn eft-btn-sm" onClick={() => set({ collapsed: [] })}>Reset folds</button>
              <button
                type="button"
                className="eft-btn eft-btn-sm"
                onClick={() => set({ zoom: 1 })}
                title="Ctrl + wheel zooms, drag the background to pan"
              >
                {Math.round(cfg.zoom * 100)}%
              </button>
              <button
                type="button"
                className={`eft-btn eft-btn-sm${cfg.detailOpen ? ' eft-is-on' : ''}`}
                onClick={() => set({ detailOpen: !cfg.detailOpen })}
              >
                Details
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="eft-ct-body">
        {shown.length ? (
          <GraphCanvas
            forest={forest}
            zoom={cfg.zoom}
            setZoom={(fn) => set({ zoom: typeof fn === 'function' ? fn(cfg.zoom) : fn })}
            selectedKey={selected?.key}
            onToggle={toggle}
            onSelect={setSelected}
            onCycleRecipe={cycleRecipe}
          />
        ) : (
          <div className="eft-ct-canvas eft-ct-blank">
            {cfg.mode === 'item' ? 'Pick an item to chart.'
              : cfg.mode === 'station' ? 'Pick a station to see everything it makes.'
                : 'Nothing matches this filter.'}
          </div>
        )}

        {deadEnd ? (
          <DeadEnd
            name={deadEnd.name}
            itemId={deadEnd.id}
            index={index}
            direction={cfg.direction}
            onDirection={(direction) => set({ direction })}
            onBack={history.length ? back : null}
            onAll={() => set({ mode: 'overview' })}
          />
        ) : null}

        {cfg.detailOpen ? (
          <aside className="eft-ct-detail">
            <DetailPanel
              selected={selected}
              index={index}
              direction={cfg.direction}
              onDirection={(direction) => set({ direction })}
              onFocus={focus}
            />
          </aside>
        ) : null}
      </div>

      <div className="eft-ct-legend">
        <span><i className="eft-ct-key eft-is-craftable" /> craftable</span>
        <span><i className="eft-ct-key eft-is-raw" /> raw / bought</span>
        <span><i className="eft-ct-key eft-is-tool" /> tool, not consumed</span>
        <span><i className="eft-ct-key eft-is-craftkey" /> recipe</span>
        <span className="eft-ct-note">
          {stats.crafts} recipes · {stats.craftable} craftable items · {stats.intermediate} feed other
          recipes · deepest chain {stats.deepest} steps
        </span>
      </div>
    </div>
  );
}
