/**
 * Stash-space maths: how much room you save by storing mods ON other mods, and
 * what each container nets you.
 *
 * THE SIZE RULE (the whole tool rests on it)
 * ------------------------------------------
 * An assembled mod's grid size is NOT the sum of its parts. It is the root
 * item's own Width x Height, plus, in each direction, the LARGEST
 * ExtraSizeLeft/Right/Up/Down of any mod attached anywhere beneath it, plus the
 * SUM of those directions for mods flagged ExtraSizeForceAdd. A child's own
 * Width/Height never counts. That is why a 2x1 Vulcan scope on its 1x1 base is
 * still 1x1: the scope's ExtraSize is all zero.
 *
 * Read straight off SPT's InventoryHelper.GetSizeByInventoryItemHash (which
 * mirrors the client) rather than inferred from examples — see
 * scripts/fetchEftSpace.mjs. Folding is the one branch not modelled: it only
 * applies to folded stocks/weapons, and a stash of mods has neither.
 */

const area = (w, h) => w * h;
export const footprint = (mod) => area(mod.w, mod.h);

export function buildSpaceIndex(snapshot) {
  const mods = snapshot.mods.map((m, i) => ({
    i,
    id: m.id,
    name: m.n,
    short: m.s,
    cat: m.c,
    w: m.w,
    h: m.h,
    extra: m.x || [0, 0, 0, 0],
    forced: !!m.f,
    slots: (m.sl || []).map(([name, allow]) => ({ name, allow })),
    conflicts: new Set(m.cf || []),
  }));
  // child -> every (host, slot) that accepts it; the reverse lookup is the
  // question people actually start from ("I have 20 of these scopes").
  const hostsOf = new Map();
  for (const host of mods) {
    for (const slot of host.slots) {
      for (const c of slot.allow) {
        if (!hostsOf.has(c)) hostsOf.set(c, []);
        hostsOf.get(c).push({ host: host.i, slot: slot.name });
      }
    }
  }
  const containers = snapshot.containers.map((c) => {
    const inner = c.grids.reduce((n, [w, h]) => n + area(w, h), 0);
    const outer = area(c.w, c.h);
    return { ...c, name: c.n, short: c.s, cat: c.c, inner, outer, net: inner - outer, ratio: inner / outer };
  });
  return {
    mods,
    byId: new Map(mods.map((m) => [m.id, m])),
    hostsOf,
    containers,
    generatedAt: snapshot.generatedAt,
  };
}

/**
 * Size of an assembly. `tree` is `{ m: modIndex, kids: [tree, ...] }`.
 * Returns { w, h } exactly as the game would place it.
 */
export function assemblySize(index, tree) {
  const root = index.mods[tree.m];
  const max = [0, 0, 0, 0];
  const forced = [0, 0, 0, 0];
  const walk = (node) => {
    for (const kid of node.kids || []) {
      const m = index.mods[kid.m];
      for (let d = 0; d < 4; d += 1) {
        if (m.forced) forced[d] += m.extra[d];
        else if (m.extra[d] > max[d]) max[d] = m.extra[d];
      }
      walk(kid);
    }
  };
  walk(tree);
  return {
    w: root.w + max[0] + max[1] + forced[0] + forced[1],
    h: root.h + max[2] + max[3] + forced[2] + forced[3],
  };
}

/** Sum of the loose footprints of every item in a tree, root included. */
export function looseArea(index, tree) {
  let n = footprint(index.mods[tree.m]);
  for (const kid of tree.kids || []) n += looseArea(index, kid);
  return n;
}

const treeMembers = (tree, out = []) => {
  out.push(tree.m);
  for (const kid of tree.kids || []) treeMembers(kid, out);
  return out;
};

const clash = (index, a, b) => index.mods[a].conflicts.has(b) || index.mods[b].conflicts.has(a);

/**
 * Every mod that can hold `childIdx`, and what pairing them does to the grid.
 *
 * Two savings, because they answer different questions:
 *  - `saved`      vs keeping the child loose. Counts the host's own cells against you —
 *                 the right number when you would BUY the host just to pack with.
 *  - `savedOwned` when you already own the host and it is sitting in the stash anyway.
 */
export function absorbersFor(index, childIdx) {
  const child = index.mods[childIdx];
  const seen = new Set();
  const rows = [];
  for (const { host, slot } of index.hostsOf.get(childIdx) || []) {
    if (host === childIdx || seen.has(host)) continue;
    seen.add(host);
    const h = index.mods[host];
    const size = assemblySize(index, { m: host, kids: [{ m: childIdx, kids: [] }] });
    const packed = area(size.w, size.h);
    rows.push({
      host: h,
      slot,
      size,
      grows: size.w !== h.w || size.h !== h.h,
      saved: footprint(child) - packed,
      savedOwned: footprint(child) + footprint(h) - packed,
    });
  }
  return rows.sort((a, b) => b.saved - a.saved || footprint(a.host) - footprint(b.host)
    || a.host.name.localeCompare(b.host.name));
}

/**
 * A rail section, ring mount or sight base: something that exists to connect
 * other parts. Trey, 2026-10-14, on the HK 416 MRS showing "25 cells into 3x1":
 * "the inbetween parts like the small rails that hold things are kind of
 * superfluous" — nobody hoards KeyMod rail sections, so counting them as
 * stored gear inflates a handguard's number with parts you'd only buy to make
 * the packing work. By default they are free connectors: they enable gear but
 * are not gear.
 */
export const isAdapter = (mod) => mod.cat === 'Mount';

/** Gear in a tree, excluding the root and any adapters. */
function gearOf(index, tree) {
  let items = 0;
  let cells = 0;
  let adapters = 0;
  const walk = (node) => {
    for (const kid of node.kids || []) {
      const m = index.mods[kid.m];
      if (isAdapter(m)) adapters += 1;
      else { items += 1; cells += footprint(m); }
      walk(kid);
    }
  };
  walk(tree);
  return { items, cells, adapters };
}

/**
 * Cells saved by packing. With adapters free (the default) it is
 * host + gear − packed: what storing the host and its gear loose would take,
 * against what the assembly takes. `countAdapters` adds the rails back in.
 */
function netOf(index, tree, countAdapters) {
  const s = assemblySize(index, tree);
  const packed = area(s.w, s.h);
  if (countAdapters) return looseArea(index, tree) - packed;
  return footprint(index.mods[tree.m]) + gearOf(index, tree).cells - packed;
}

/**
 * The most a host can pack: greedily fill each slot (and each child's own
 * slots, recursively) with whatever adds the most net cells. On a tie the
 * smaller subtree wins, so a flashlight that fits the slot directly beats the
 * same flashlight on a ring mount.
 *
 * Greedy and depth-capped, so it is a strong lower bound, not a proof of the
 * optimum: ExtraSize combines by MAX per direction, so the order slots are
 * filled in can matter at the margins. Conflicting mods are never combined.
 */
export function bestFill(index, hostIdx, { depth = 3, countAdapters = false, memo = new Map() } = {}) {
  return fill(index, hostIdx, depth, countAdapters, memo, new Set());
}

function fill(index, hostIdx, depth, countAdapters, memo, stack) {
  const key = `${hostIdx}:${depth}`;
  if (memo.has(key)) return memo.get(key);
  const tree = { m: hostIdx, kids: [] };
  const host = index.mods[hostIdx];
  if (depth > 0) {
    stack.add(hostIdx);
    const members = new Set([hostIdx]);
    for (const slot of host.slots) {
      let best = null;
      let bestNet = netOf(index, tree, countAdapters);
      for (const c of slot.allow) {
        if (stack.has(c) || members.has(c)) continue;
        const sub = fill(index, c, depth - 1, countAdapters, memo, stack).tree;
        const subMembers = treeMembers(sub);
        if (subMembers.some((a) => [...members].some((b) => clash(index, a, b)))) continue;
        tree.kids.push(sub);
        const net = netOf(index, tree, countAdapters);
        tree.kids.pop();
        if (net > bestNet || (best && net === bestNet && subMembers.length < best.subMembers.length)) {
          bestNet = net;
          best = { sub, slot: slot.name, subMembers };
        }
      }
      if (best) {
        tree.kids.push({ ...best.sub, slot: best.slot });
        for (const m of best.subMembers) members.add(m);
      }
    }
    stack.delete(hostIdx);
  }
  const size = assemblySize(index, tree);
  const gear = gearOf(index, tree);
  const packed = area(size.w, size.h);
  const result = {
    tree,
    size,
    loose: looseArea(index, tree),
    net: netOf(index, tree, countAdapters),
    gear,
    // Cells of host + gear per cell of packed assembly: the Goliaf's "five
    // things in one cell" is what this measures, rails excluded.
    density: (footprint(host) + gear.cells) / packed,
  };
  memo.set(key, result);
  return result;
}

/** Every host ranked by the most it can pack. One shared memo keeps this ~linear. */
export function packingLeaderboard(index, { depth = 3, countAdapters = false } = {}) {
  const memo = new Map();
  return index.mods
    .filter((m) => m.slots.length)
    .map((m) => ({ host: m, ...bestFill(index, m.i, { depth, countAdapters, memo }) }))
    .filter((r) => r.net > 0)
    .sort((a, b) => b.net - a.net || footprint(a.host) - footprint(b.host));
}

/**
 * "I have N of these" -> the best host for each, and the total.
 * `priceOf(id)` returns a rouble cost for one host, or null when unknown.
 */
export function planPile(index, pile, priceOf = () => null) {
  const rows = pile.map(({ idx, count }) => {
    const options = absorbersFor(index, idx).filter((o) => o.saved > 0);
    const pick = options[0] || null;
    const cost = pick ? priceOf(pick.host.id) : null;
    return {
      item: index.mods[idx],
      count,
      pick,
      alternatives: options.slice(1, 4),
      savedTotal: pick ? pick.saved * count : 0,
      costTotal: pick && cost != null ? cost * count : null,
    };
  });
  return {
    rows,
    savedTotal: rows.reduce((n, r) => n + r.savedTotal, 0),
    costTotal: rows.some((r) => r.pick && r.costTotal == null)
      ? null
      : rows.reduce((n, r) => n + (r.costTotal || 0), 0),
  };
}

export function searchMods(index, query, limit = 20) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = index.mods.filter((m) => m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q));
  return hits
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q))
      || a.name.length - b.name.length)
    .slice(0, limit);
}

let snapshotPromise = null;
/** The 400 KB snapshot is only fetched when the tab is opened. */
export function loadSpaceIndex() {
  if (!snapshotPromise) {
    snapshotPromise = import('./data/spaceSnapshot.json').then((m) => buildSpaceIndex(m.default || m));
  }
  return snapshotPromise;
}
