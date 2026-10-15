import { useEffect, useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import { Panel, Seg, Counter, Stat, fmtRub } from '../EftBits';
import { itemIcon } from '../eftApi';
import { unitCost } from '../eftHideoutLogic';
import {
  loadSpaceIndex, absorbersFor, bestFill, packingLeaderboard, planPile, searchMods, isAdapter,
} from '../eftSpaceLogic';

/**
 * Stash Space — how to fit more in the same grid.
 *
 * Trey, 2026-10-14: "MP10 RIS mount is 1 slot but can hold a 2 slot scope... A Goliaf handguard
 * can hold like 2-3 flashlights and 1 grip... I don't know all of them. i want a tool... so i can
 * find the ones that i don't know of." So the tool works from the game's own item templates and
 * the game's own size rule (see eftSpaceLogic.js), never from a hand-written list of tricks —
 * every pairing on this page is computed, and the ones nobody talks about fall out the same way
 * as the famous ones.
 */

const PILE_KEY = 'eftsh_spacepile_v1';
const readPile = () => {
  try { return JSON.parse(localStorage.getItem(PILE_KEY)) || []; } catch { return []; }
};
const writePile = (pile) => {
  try { localStorage.setItem(PILE_KEY, JSON.stringify(pile)); } catch { /* storage blocked: session only */ }
};

const MODES = [
  { value: 'item', label: 'Pack an item' },
  { value: 'pile', label: 'My pile' },
  { value: 'packers', label: 'Best packers' },
  { value: 'containers', label: 'Containers' },
];

/** A to-scale block of grid cells. */
function Cells({ w, h, tone = 'host', title }) {
  return (
    <span
      className={`eft-space-cells eft-is-${tone}`}
      style={{ gridTemplateColumns: `repeat(${w}, 11px)` }}
      title={title || `${w}×${h}`}
      aria-label={`${w} by ${h}`}
    >
      {Array.from({ length: w * h }, (_, i) => <span key={i} />)}
    </span>
  );
}

function ModName({ mod, onPick }) {
  return (
    <span className="eft-space-mod">
      <img
        className="eft-space-icon"
        src={itemIcon(mod.id)}
        alt=""
        loading="lazy"
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      />
      {onPick ? (
        <button type="button" className="eft-space-link" onClick={() => onPick(mod.i)}>{mod.name}</button>
      ) : <span>{mod.name}</span>}
      <span className="eft-space-dim">{mod.w}×{mod.h}</span>
    </span>
  );
}

/** Before → after: the parts loose, then the assembly. */
function BeforeAfter({ parts, size }) {
  return (
    <span className="eft-space-ba">
      {parts.map((p, k) => (
        <span key={k} className="eft-space-ba-part">
          {k ? <span className="eft-space-plus">+</span> : null}
          <Cells w={p.w} h={p.h} tone={k ? 'child' : 'host'} />
        </span>
      ))}
      <span className="eft-space-arrow" aria-hidden="true">→</span>
      <Cells w={size.w} h={size.h} tone="packed" />
    </span>
  );
}

function Tree({ index, node, onPick, depth = 0 }) {
  const m = index.mods[node.m];
  return (
    <li className="eft-space-node">
      <div className="eft-space-noderow">
        <span className="eft-space-slot">{depth ? node.slot?.replace(/^mod_/, '') : 'base'}</span>
        <ModName mod={m} onPick={onPick} />
        {depth && isAdapter(m) ? <span className="eft-space-railchip" title="A connector — enables the gear under it, not counted as gear">rail</span> : null}
      </div>
      {node.kids?.length ? (
        <ul className="eft-space-tree">
          {node.kids.map((k, i) => <Tree key={i} index={index} node={k} onPick={onPick} depth={depth + 1} />)}
        </ul>
      ) : null}
    </li>
  );
}

function SearchBox({ index, onPick, placeholder }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => (index ? searchMods(index, q, 12) : []), [index, q]);
  return (
    <div className="eft-space-search">
      <input
        className="eft-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {hits.length ? (
        <ul className="eft-space-hits">
          {hits.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { onPick(m.i); setQ(''); }}>
                <ModName mod={m} />
                <span className="eft-space-dim">{m.cat}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ItemMode({ index, picked, setPicked, cost, addToPile }) {
  const mod = picked != null ? index.mods[picked] : null;
  const hosts = useMemo(() => (mod ? absorbersFor(index, mod.i) : []), [index, mod]);
  const fill = useMemo(() => (mod?.slots.length ? bestFill(index, mod.i) : null), [index, mod]);
  const [showGrowing, setShowGrowing] = useState(false);
  const shown = showGrowing ? hosts : hosts.filter((h) => h.saved > 0);

  return (
    <>
      <SearchBox index={index} onPick={setPicked} placeholder="Find a mod — scope, flashlight, mount, grip…" />
      {mod ? (
        <div className="eft-space-pick">
          <header className="eft-space-pickhead">
            <ModName mod={mod} />
            <span className="eft-chip">{mod.cat}</span>
            <button type="button" className="eft-btn eft-btn-sm" onClick={() => addToPile(mod.i)}>+ Add to my pile</button>
          </header>

          <h3 className="eft-space-h">What can hold it</h3>
          {hosts.length ? (
            <>
              {shown.length ? (
              <table className="eft-table eft-space-table">
                <thead>
                  <tr>
                    <th>Host</th><th>Slot</th><th>Packed</th>
                    <th title="Cells saved vs keeping this item loose, counting the host against you — the number when you'd buy the host just to pack with.">Saved</th>
                    <th title="Cells saved if you already own the host and it is sitting in your stash anyway.">If you own the host</th>
                    <th>Host price</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.host.id} className={r.saved > 0 ? '' : 'eft-space-meh'}>
                      <td><ModName mod={r.host} onPick={setPicked} /></td>
                      <td className="eft-space-dim">{r.slot.replace(/^mod_/, '')}</td>
                      <td>
                        <BeforeAfter parts={[r.host, mod]} size={r.size} />
                        {r.grows ? <span className="eft-chip eft-is-unmet" title="Attaching it makes the host bigger">grows</span> : null}
                      </td>
                      <td className={r.saved > 0 ? 'eft-space-good' : 'eft-space-bad'}>{r.saved > 0 ? `+${r.saved}` : r.saved}</td>
                      <td>{r.savedOwned > 0 ? `+${r.savedOwned}` : r.savedOwned}</td>
                      <td>{cost(r.host.id) != null ? fmtRub(cost(r.host.id)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : null}
              {hosts.length !== shown.length || showGrowing ? (
                <button type="button" className="eft-btn eft-btn-sm" onClick={() => setShowGrowing((v) => !v)}>
                  {showGrowing ? 'Hide the ones that save nothing' : `Show ${hosts.length - shown.length} host${hosts.length - shown.length === 1 ? '' : 's'} that save nothing`}
                </button>
              ) : null}
              {!shown.length && !showGrowing ? (
                <p className="eft-note">Every host that takes this makes the pair bigger than the item alone — no saving.</p>
              ) : null}
            </>
          ) : <p className="eft-note">Nothing in the game takes this as an attachment.</p>}

          {fill ? (
            <>
              <h3 className="eft-space-h">The most it can hold</h3>
              {fill.net > 0 ? (
                <div className="eft-space-fill">
                  <div className="eft-space-fillsum">
                    <strong>{fill.gear.items}</strong> pieces of gear
                    {fill.gear.adapters ? <span className="eft-space-dim"> (+ {fill.gear.adapters} rail{fill.gear.adapters === 1 ? '' : 's'} to hold them)</span> : null}
                    {' '}→ <Cells w={fill.size.w} h={fill.size.h} tone="packed" />
                    {' '}<strong>{fill.size.w}×{fill.size.h}</strong>
                    <span className="eft-space-good"> +{fill.net} cells</span>
                    <span className="eft-space-dim"> · {fill.density.toFixed(1)}× gear per cell</span>
                  </div>
                  <ul className="eft-space-tree eft-is-root"><Tree index={index} node={fill.tree} onPick={setPicked} /></ul>
                  <p className="eft-note">
                    One packing that works, picked greedily for the most gear. Rails and mounts are counted as free connectors,
                    not gear. Any part can be swapped for another that fits the same slot without more extra size —
                    click a part to see its own options.
                  </p>
                </div>
              ) : <p className="eft-note">Its slots exist but nothing that fits them packs smaller than leaving it loose.</p>}
            </>
          ) : null}
        </div>
      ) : (
        <p className="eft-note">
          Pick something you have a pile of. You get every mod that can hold it, how big the pair ends up,
          and how many cells that saves. If the thing you pick has slots of its own, you also get the most it can carry.
        </p>
      )}
    </>
  );
}

function PileMode({ index, pile, setPile, cost, setPicked, setMode }) {
  const resolved = useMemo(() => pile
    .map((p) => ({ idx: index.byId.get(p.id)?.i, count: p.count }))
    .filter((p) => p.idx != null && p.count > 0), [index, pile]);
  const plan = useMemo(() => planPile(index, resolved, cost), [index, resolved, cost]);
  const add = (i) => setPile((prev) => (prev.some((p) => p.id === index.mods[i].id)
    ? prev
    : [...prev, { id: index.mods[i].id, count: 1 }]));
  const setCount = (id, count) => setPile((prev) => prev.map((p) => (p.id === id ? { ...p, count } : p)));
  const remove = (id) => setPile((prev) => prev.filter((p) => p.id !== id));

  return (
    <>
      <SearchBox index={index} onPick={add} placeholder="Add something you have a stack of…" />
      {pile.length ? (
        <>
          <div className="eft-space-stats">
            <Stat label="Cells saved" value={`+${plan.savedTotal}`} tone="green" />
            <Stat label="Hosts to buy" value={plan.costTotal == null ? 'some unpriced' : fmtRub(plan.costTotal)}
              sub="if you own none of them yet" />
          </div>
          <table className="eft-table eft-space-table">
            <thead>
              <tr><th>You have</th><th>How many</th><th>Best host</th><th>Packed</th><th>Saved</th><th>Hosts cost</th><th /></tr>
            </thead>
            <tbody>
              {pile.map((p) => {
                const row = plan.rows.find((r) => r.item.id === p.id);
                const item = index.byId.get(p.id);
                if (!item) return null;
                return (
                  <tr key={p.id}>
                    <td><ModName mod={item} onPick={(i) => { setPicked(i); setMode('item'); }} /></td>
                    <td><Counter value={p.count} onChange={(n) => setCount(p.id, n)} /></td>
                    <td>
                      {row?.pick ? <ModName mod={row.pick.host} onPick={(i) => { setPicked(i); setMode('item'); }} /> : <span className="eft-space-dim">no host saves space</span>}
                      {row?.alternatives?.length ? (
                        <div className="eft-space-dim eft-space-alts">
                          or {row.alternatives.map((a) => a.host.short).join(', ')}
                        </div>
                      ) : null}
                    </td>
                    <td>{row?.pick ? <BeforeAfter parts={[row.pick.host, item]} size={row.pick.size} /> : null}</td>
                    <td className="eft-space-good">{row?.pick ? `+${row.savedTotal}` : '—'}</td>
                    <td>{row?.costTotal != null ? fmtRub(row.costTotal) : '—'}</td>
                    <td><button type="button" className="eft-iconbtn" onClick={() => remove(p.id)} aria-label={`Remove ${item.name}`}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="eft-note">
            One host per item, best saving first. The saving already counts the host's own cell against you,
            so it holds whether you buy the hosts or already own them.
          </p>
        </>
      ) : (
        <p className="eft-note">
          List what you are hoarding — "20 of this scope, 12 of that flashlight" — and it picks the host that saves
          the most for each and totals it up, with what the hosts cost on the flea.
        </p>
      )}
    </>
  );
}

const GROW_FILTERS = [
  { value: 'same', label: 'Stays the same size', title: 'Only hosts whose packed assembly is no bigger than the host alone' },
  { value: 'any', label: 'Can grow', title: 'Include hosts that get bigger when filled, if they still net space' },
];
// Trey prioritises 1x1 and 1x2 — the sizes that slot into a rig or fill a stash gap. A 2-cell
// assembly is 1x2 OR 2x1; the game rotates items, so the two are the same for packing.
const PACKED_FILTERS = [
  { value: 'all', label: 'Any size' },
  { value: '1', label: '1×1', title: 'Packs into a single cell' },
  { value: '2', label: '1×2', title: 'Packs into two cells (1×2 or 2×1)' },
  { value: 'le2', label: '≤ 2 cells', title: '1×1 or 1×2' },
];
const SORTS = [
  { value: 'density', label: 'Densest', title: 'Cells of gear (host included) per packed cell — the Goliaf "five things in one cell" number' },
  { value: 'net', label: 'Most saved', title: 'Total cells saved vs keeping the host and its gear loose' },
  { value: 'items', label: 'Most items', title: 'Most pieces of gear held, rails not counted' },
  { value: 'fewest', label: 'Fewest rails', title: 'Least connector clutter: fewest rails/mounts needed, then densest' },
  { value: 'rub', label: 'Cheapest per cell', title: 'Host flea price ÷ cells saved — hosts with no price are left out' },
];
const RAIL_MODES = [
  { value: 'free', label: 'Rails are free', title: 'Rail sections, ring mounts and sight bases are connectors, not gear — they enable packing but do not count as saved' },
  { value: 'count', label: 'Count rails', title: 'Count every part, connectors included, as stored' },
];

const PREFS_KEY = 'eftsh_space_packers_v1';
const PACKER_DEFAULTS = { grow: 'same', packed: 'le2', sort: 'density', rails: 'free', cat: '', maxRails: 'any' };
const readPrefs = () => {
  try { return { ...PACKER_DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY)) }; } catch { return PACKER_DEFAULTS; }
};

const packedCells = (r) => r.size.w * r.size.h;
const SORTERS = {
  density: (a, b) => b.density - a.density || b.net - a.net,
  net: (a, b) => b.net - a.net || b.density - a.density,
  items: (a, b) => b.gear.items - a.gear.items || b.density - a.density,
  fewest: (a, b) => a.gear.adapters - b.gear.adapters || b.density - a.density,
};

function PackersMode({ index, cost, setPicked, setMode }) {
  const [prefs, setPrefsState] = useState(readPrefs);
  const setPref = (k, v) => setPrefsState((prev) => {
    const next = { ...prev, [k]: v };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* session only */ }
    return next;
  });
  const countAdapters = prefs.rails === 'count';
  const board = useMemo(() => packingLeaderboard(index, { countAdapters }), [index, countAdapters]);
  const [open, setOpen] = useState(null);
  const cats = useMemo(() => [...new Set(board.map((r) => r.host.cat))].sort(), [board]);

  const rows = useMemo(() => {
    let out = board.filter((r) => (prefs.grow === 'any' || (r.size.w === r.host.w && r.size.h === r.host.h))
      && (prefs.packed === 'all'
        || (prefs.packed === '1' && packedCells(r) === 1)
        || (prefs.packed === '2' && packedCells(r) === 2)
        || (prefs.packed === 'le2' && packedCells(r) <= 2))
      && (prefs.maxRails === 'any' || r.gear.adapters <= Number(prefs.maxRails))
      && (!prefs.cat || r.host.cat === prefs.cat));
    if (prefs.sort === 'rub') {
      out = out
        .map((r) => ({ ...r, rub: cost(r.host.id) }))
        .filter((r) => r.rub != null)
        .map((r) => ({ ...r, perCell: r.rub / r.net }))
        .sort((a, b) => a.perCell - b.perCell);
    } else {
      out = [...out].sort(SORTERS[prefs.sort] || SORTERS.density);
    }
    return out;
  }, [board, prefs, cost]);
  const shown = rows.slice(0, 150);

  return (
    <>
      <div className="eft-space-controls">
        <span className="eft-space-ctl"><span className="eft-space-ctllabel">Packed size</span>
          <Seg options={PACKED_FILTERS} value={prefs.packed} onChange={(v) => setPref('packed', v)} /></span>
        <span className="eft-space-ctl"><span className="eft-space-ctllabel">Growth</span>
          <Seg options={GROW_FILTERS} value={prefs.grow} onChange={(v) => setPref('grow', v)} /></span>
        <span className="eft-space-ctl"><span className="eft-space-ctllabel">Rails / mounts</span>
          <Seg options={RAIL_MODES} value={prefs.rails} onChange={(v) => setPref('rails', v)} /></span>
      </div>
      <div className="eft-space-controls">
        <span className="eft-space-ctl"><span className="eft-space-ctllabel">Sort</span>
          <Seg options={SORTS} value={prefs.sort} onChange={(v) => setPref('sort', v)} /></span>
        <select className="eft-select" value={prefs.maxRails} onChange={(e) => setPref('maxRails', e.target.value)} aria-label="Most rails allowed">
          <option value="any">Any number of rails</option>
          <option value="0">No rails needed</option>
          <option value="1">At most 1 rail</option>
          <option value="2">At most 2 rails</option>
        </select>
        <select className="eft-select" value={prefs.cat} onChange={(e) => setPref('cat', e.target.value)} aria-label="Host type">
          <option value="">Every host type</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="eft-space-dim">{rows.length} hosts match</span>
      </div>
      <table className="eft-table eft-space-table">
        <thead>
          <tr>
            <th>Host</th><th>Type</th>
            <th title="Pieces of gear the packing holds; rails/mounts listed separately">Holds</th>
            <th>Packed</th>
            <th title="Cells of host + gear per packed cell">Gear / cell</th>
            <th>Saved</th><th>Host price</th>
            {prefs.sort === 'rub' ? <th>₽ / cell</th> : null}
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <FragmentRow key={r.host.id} r={r} open={open === r.host.id} onToggle={() => setOpen(open === r.host.id ? null : r.host.id)}
              index={index} cost={cost} sort={prefs.sort} onPick={(i) => { setPicked(i); setMode('item'); }} />
          ))}
        </tbody>
      </table>
      {rows.length > shown.length ? <p className="eft-note">Top 150 of {rows.length} shown — narrow the filters to see the rest.</p> : null}
      {!rows.length ? <p className="eft-note">Nothing matches — loosen a filter.</p> : null}
    </>
  );
}

function FragmentRow({ r, open, onToggle, index, cost, sort, onPick }) {
  return (
    <>
      <tr>
        <td>
          <button type="button" className="eft-iconbtn" onClick={onToggle} aria-expanded={open} aria-label="Show the packing">
            {open ? '▾' : '▸'}
          </button>
          <ModName mod={r.host} onPick={onPick} />
        </td>
        <td className="eft-space-dim">{r.host.cat}</td>
        <td>
          <strong>{r.gear.items}</strong> gear
          {r.gear.adapters ? <span className="eft-space-dim"> + {r.gear.adapters} rail{r.gear.adapters === 1 ? '' : 's'}</span> : null}
        </td>
        <td><Cells w={r.size.w} h={r.size.h} tone="packed" /> {r.size.w}×{r.size.h}</td>
        <td>{r.density.toFixed(1)}×</td>
        <td className="eft-space-good">+{r.net}</td>
        <td>{cost(r.host.id) != null ? fmtRub(cost(r.host.id)) : '—'}</td>
        {sort === 'rub' ? <td>{fmtRub(r.perCell)}</td> : null}
      </tr>
      {open ? (
        <tr className="eft-space-treerow">
          <td colSpan={sort === 'rub' ? 8 : 7}>
            <ul className="eft-space-tree eft-is-root"><Tree index={index} node={r.tree} onPick={onPick} /></ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

const CONT_SORTS = [
  { value: 'net', label: 'Most cells gained' },
  { value: 'ratio', label: 'Best ratio' },
  { value: 'rub', label: 'Cheapest per cell' },
];
const CONT_TYPES = [
  { value: '', label: 'All' },
  { value: 'SimpleContainer', label: 'Cases' },
  { value: 'Backpack', label: 'Backpacks' },
  { value: 'Vest', label: 'Rigs' },
];

function ContainersMode({ index, cost }) {
  const [sort, setSort] = useState('net');
  const [type, setType] = useState('');
  const rows = useMemo(() => {
    let out = index.containers.filter((c) => c.net > 0 && (!type || c.cat === type))
      .map((c) => ({ ...c, rub: cost(c.id) }));
    if (sort === 'rub') {
      out = out.filter((c) => c.rub != null).map((c) => ({ ...c, perCell: c.rub / c.net }))
        .sort((a, b) => a.perCell - b.perCell);
    } else if (sort === 'ratio') out.sort((a, b) => b.ratio - a.ratio);
    else out.sort((a, b) => b.net - a.net);
    return out;
  }, [index, sort, type, cost]);

  return (
    <>
      <div className="eft-space-controls">
        <Seg options={CONT_TYPES} value={type} onChange={setType} />
        <Seg options={CONT_SORTS} value={sort} onChange={setSort} />
      </div>
      <table className="eft-table eft-space-table">
        <thead>
          <tr><th>Container</th><th>Outside</th><th>Inside</th><th>Net</th><th>Ratio</th><th>Only takes</th><th>Price</th><th>₽ / cell</th></tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><ModName mod={c} /></td>
              <td>{c.w}×{c.h} = {c.outer}</td>
              <td>{c.grids.length > 1 ? `${c.grids.length} grids = ` : `${c.grids[0][0]}×${c.grids[0][1]} = `}{c.inner}</td>
              <td className="eft-space-good">+{c.net}</td>
              <td>{c.ratio.toFixed(1)}×</td>
              <td
                className="eft-space-dim eft-space-accepts"
                title={[c.accepts ? `Takes: ${c.accepts.join(', ')}` : '', c.excludes ? `Never: ${c.excludes.join(', ')}` : ''].filter(Boolean).join('\n')}
              >
                {c.accepts
                  ? `${c.accepts.slice(0, 4).join(', ')}${c.accepts.length > 4 ? ` +${c.accepts.length - 4} more` : ''}`
                  : 'anything'}
                {c.excludes ? <span className="eft-space-excl"> · not {c.excludes.slice(0, 3).join(', ')}{c.excludes.length > 3 ? '…' : ''}</span> : null}
              </td>
              <td>{c.rub != null ? fmtRub(c.rub) : '—'}</td>
              <td>{c.rub != null ? fmtRub(c.rub / c.net) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="eft-note">
        Net = cells inside minus cells it takes up. Rigs count their pockets as one total even though a 1×2 pocket
        can't hold a 2×1 item; for stash planning cases and backpacks are the honest comparison.
      </p>
    </>
  );
}

export default function SpaceView() {
  const { priceOf } = useEft();
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('item');
  const [picked, setPicked] = useState(null);
  const [pile, setPileState] = useState(readPile);

  useEffect(() => {
    let live = true;
    loadSpaceIndex().then((ix) => { if (live) setIndex(ix); }).catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  const setPile = (next) => setPileState((prev) => {
    const value = typeof next === 'function' ? next(prev) : next;
    writePile(value);
    return value;
  });
  const addToPile = (i) => {
    setPile((prev) => (prev.some((p) => p.id === index.mods[i].id) ? prev : [...prev, { id: index.mods[i].id, count: 1 }]));
    setMode('pile');
  };
  // 0 from unitCost means "no price anywhere", not free.
  const cost = useMemo(() => (id) => {
    const n = unitCost(priceOf?.(id));
    return n > 0 ? n : null;
  }, [priceOf]);

  return (
    <div className="eft-space">
      <Panel
        title="Stash Space"
        actions={<Seg options={MODES} value={mode} onChange={setMode} />}
        help={(
          <>
            <p>
              <strong>How a packed mod's size works</strong>, straight from the game's own rule: an assembly is the
              base item's size, plus — in each direction — the biggest "extra size" of anything attached to it.
              A part's own width and height never count. That's why a 2×1 scope on a 1×1 mount is still 1×1,
              and why some handguards swallow a whole pile of lights, grips and mounts in one cell.
            </p>
            <p>
              Everything here is computed from BSG's item templates for every mod in the game, so the
              tricks nobody talks about show up the same way the famous ones do.
              {index ? ` Data built ${new Date(index.generatedAt).toLocaleDateString()}.` : ''}
            </p>
          </>
        )}
      >
        {error ? <p className="eft-note">Couldn't load the space data: {error}</p> : null}
        {!index && !error ? <p className="eft-note">Loading every mod in the game…</p> : null}
        {index && mode === 'item' ? <ItemMode index={index} picked={picked} setPicked={setPicked} cost={cost} addToPile={addToPile} /> : null}
        {index && mode === 'pile' ? <PileMode index={index} pile={pile} setPile={setPile} cost={cost} setPicked={setPicked} setMode={setMode} /> : null}
        {index && mode === 'packers' ? <PackersMode index={index} cost={cost} setPicked={setPicked} setMode={setMode} /> : null}
        {index && mode === 'containers' ? <ContainersMode index={index} cost={cost} /> : null}
      </Panel>
    </div>
  );
}

