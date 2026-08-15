// Crafting graph for the hideout.
//
// Every hideout recipe is `inputs -> one output`, run at a station. Because a
// recipe's output can be another recipe's input (77 items in the current
// snapshot are both), the recipes form a directed graph rather than a flat
// list. This module turns that graph into left-to-right trees the view can draw
// and fold.
//
// Two directions, from any item:
//   'up'   — what goes INTO making it, recursively (ingredients)
//   'down' — what it is USED IN, recursively (uses)
//
// Trees alternate item -> craft -> item -> craft, so a recipe is always its own
// node. That keeps multi-recipe items honest: an item craftable two ways
// branches into two craft nodes rather than silently merging their inputs.

export const DIRECTIONS = [
  { value: 'up', label: 'Ingredients', title: 'What goes into making this item' },
  { value: 'down', label: 'Used in', title: 'What this item is used to craft' },
];

// A recipe graph can loop and it can fan out hard, so both are bounded. These
// are generous — the deepest real chain is a handful of steps — and exist only
// so a data change can never hang the page.
export const MAX_DEPTH = 24;
export const MAX_NODES = 6000;

const clean = (s) => String(s || '').toLowerCase();

/**
 * Flattens every station's crafts into one indexed list.
 *
 * @param {object} data hideout snapshot (stations[].crafts, extraCrafts[], items)
 */
export function buildCraftIndex(data) {
  const items = data?.items || {};
  const crafts = [];

  const push = (craft, stationName, stationKey, stationLevelKey) => {
    crafts.push({
      ...craft,
      stationName,
      stationKey,
      stationLevelKey,
      inputs: craft.requiredItems || [],
      tools: craft.tools || [],
      outputs: craft.rewardItems || [],
      // Absent on anything that came from tarkov.dev rather than the game files.
      resources: craft.resources || [],
      questIds: craft.questIds || [],
    });
  };

  for (const st of data?.stations || []) {
    for (const c of st.crafts || []) push(c, st.name, st.normalizedName, st.normalizedName);
  }
  // Areas with recipes but no build stages (the Christmas Tree) live here so
  // their recipes are not lost — see scripts/fetchEftHideout.mjs.
  for (const group of data?.extraCrafts || []) {
    for (const c of group.crafts || []) push(c, group.stationName, group.stationKey, null);
  }

  const byOutput = new Map();
  const byInput = new Map();
  const byId = new Map();

  const add = (map, key, value) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };

  for (const craft of crafts) {
    byId.set(craft.id, craft);
    for (const out of craft.outputs) add(byOutput, out.itemId, craft);
    for (const inp of craft.inputs) add(byInput, inp.itemId, craft);
    // Tools are indexed separately: they gate a recipe but are not consumed by
    // it, so treating them as inputs would invent supply chains that don't
    // exist (every wrench would "feed" a dozen crafts).
    for (const tool of craft.tools) add(byInput, tool.itemId, craft);
  }

  const stations = [];
  const seenStation = new Set();
  for (const craft of crafts) {
    if (seenStation.has(craft.stationKey)) continue;
    seenStation.add(craft.stationKey);
    stations.push({
      key: craft.stationKey,
      name: craft.stationName,
      crafts: crafts.filter((c) => c.stationKey === craft.stationKey),
    });
  }
  stations.sort((a, b) => a.name.localeCompare(b.name));

  return { crafts, byId, byOutput, byInput, items, stations };
}

export const isCraftable = (index, itemId) => (index.byOutput.get(itemId)?.length || 0) > 0;
export const isConsumed = (index, itemId) => (index.byInput.get(itemId)?.some(
  (c) => c.inputs.some((i) => i.itemId === itemId),
) || false);

/** Item id -> display name, falling back to whatever the recipe called it. */
export function itemName(index, itemId, fallback) {
  return index.items?.[itemId]?.name || fallback || itemId;
}

/**
 * Longest chain of crafts feeding this item. Used to rank the overview so the
 * deep, actually-interesting trees come first instead of alphabetically.
 */
export function chainDepth(index, itemId, seen = new Set()) {
  if (seen.has(itemId)) return 0;
  const producers = index.byOutput.get(itemId);
  if (!producers?.length) return 0;
  const next = new Set(seen).add(itemId);
  let best = 0;
  for (const craft of producers) {
    for (const inp of craft.inputs) {
      const d = chainDepth(index, inp.itemId, next);
      if (d > best) best = d;
    }
  }
  return best + 1;
}

/**
 * Every item worth using as the head of a tree.
 *
 * `final` — craftable but never used as an input. These are the ends of the
 * chains and the natural roots for "show me the trees".
 * `intermediate` — craftable AND used in something else. These are the reason
 * the graph exists at all.
 */
export function rootItems(index) {
  const out = [];
  for (const [itemId, producers] of index.byOutput) {
    const consumers = (index.byInput.get(itemId) || []).filter(
      (c) => c.inputs.some((i) => i.itemId === itemId),
    );
    out.push({
      itemId,
      name: itemName(index, itemId, producers[0]?.outputs?.[0]?.name),
      recipes: producers.length,
      usedIn: consumers.length,
      kind: consumers.length ? 'intermediate' : 'final',
      depth: chainDepth(index, itemId),
    });
  }
  out.sort((a, b) => b.depth - a.depth || b.usedIn - a.usedIn || a.name.localeCompare(b.name));
  return out;
}

// --- Tree construction -----------------------------------------------------

const childKey = (parentKey, kind, id, i) => `${parentKey}>${kind}:${id}:${i}`;

/**
 * Builds one tree. Collapsed nodes still report `hasChildren` so the view can
 * draw a caret on them without paying to expand what nobody asked for.
 *
 * @param {object}  index          from buildCraftIndex
 * @param {string}  rootItemId
 * @param {object}  opts
 * @param {'up'|'down'} opts.direction
 * @param {Set<string>} opts.collapsed  node keys the user folded
 * @param {number}  opts.autoDepth   auto-fold anything deeper than this
 * @param {boolean} opts.includeTools show non-consumed tool requirements
 * @param {boolean} opts.craftableOnly hide inputs that can't themselves be crafted
 * @param {string}  opts.stationKey  restrict to one station's recipes
 */
export function buildTree(index, rootItemId, opts = {}) {
  const {
    direction = 'up', collapsed = new Set(), autoDepth = 3,
    includeTools = true, craftableOnly = false, stationKey = null,
    rootKey = `r:${rootItemId}`, rootCount = null, rootCraftId = null,
  } = opts;

  let nodes = 0;
  let truncated = false;

  const craftsFor = (itemId) => {
    const list = direction === 'up'
      ? index.byOutput.get(itemId)
      : (index.byInput.get(itemId) || []).filter(
        (c) => includeTools || c.inputs.some((i) => i.itemId === itemId),
      );
    if (!list?.length) return [];
    return stationKey ? list.filter((c) => c.stationKey === stationKey) : list;
  };

  const makeItem = (itemId, key, depth, count, path, label) => {
    nodes += 1;
    const node = {
      kind: 'item',
      key,
      id: itemId,
      depth,
      count,
      name: itemName(index, itemId, label),
      item: index.items?.[itemId] || null,
      craftable: isCraftable(index, itemId),
      cycle: path.has(itemId),
      children: [],
      hasChildren: false,
      collapsed: false,
    };

    if (node.cycle || depth >= MAX_DEPTH || nodes >= MAX_NODES) {
      if (nodes >= MAX_NODES) truncated = true;
      return node;
    }

    let crafts = craftsFor(itemId);
    // When the root itself was reached through a specific recipe, don't offer
    // that same recipe again as a way to make it — that's the edge we came in
    // on, and re-expanding it is an infinite regress the user can see.
    if (rootCraftId && key === rootKey) crafts = crafts.filter((c) => c.id !== rootCraftId);

    node.hasChildren = crafts.length > 0;
    if (!node.hasChildren) return node;

    node.collapsed = collapsed.has(key) || (!collapsed.has(`!${key}`) && depth >= autoDepth * 2);
    if (node.collapsed) {
      // What is being hidden, so a folded node can say so instead of just
      // vanishing its branch.
      node.hiddenCount = crafts.length;
      return node;
    }

    const nextPath = new Set(path).add(itemId);
    node.children = crafts.map((craft, i) => makeCraft(craft, childKey(key, 'c', craft.id, i), depth + 1, nextPath));
    return node;
  };

  const makeCraft = (craft, key, depth, path) => {
    nodes += 1;
    const node = {
      kind: 'craft',
      key,
      id: craft.id,
      depth,
      craft,
      children: [],
      hasChildren: false,
      collapsed: false,
    };

    const feed = direction === 'up'
      ? [
        ...craft.inputs.map((i) => ({ ...i, role: 'input' })),
        ...(includeTools ? craft.tools.map((t) => ({ ...t, count: 1, role: 'tool' })) : []),
      ]
      : craft.outputs.map((o) => ({ ...o, role: 'output' }));

    const kept = craftableOnly && direction === 'up'
      ? feed.filter((f) => f.role === 'tool' || isCraftable(index, f.itemId))
      : feed;

    node.hasChildren = kept.length > 0;
    if (!node.hasChildren) return node;

    node.collapsed = collapsed.has(key) || (!collapsed.has(`!${key}`) && depth >= autoDepth * 2);
    if (node.collapsed) {
      node.hiddenCount = kept.length;
      return node;
    }

    node.children = kept.map((f, i) => {
      const child = makeItem(f.itemId, childKey(key, 'i', f.itemId, i), depth + 1, f.count ?? 1, path, f.name);
      child.role = f.role;
      return child;
    });
    return node;
  };

  const root = makeItem(rootItemId, rootKey, 0, rootCount, new Set(), null);
  return { root, nodes, truncated };
}

// --- Layout ----------------------------------------------------------------
//
// A tidy left-to-right layout: depth fixes x, and y is assigned by walking the
// visible leaves in order and pushing each parent to the midpoint of its
// children. Node boxes are fixed-height, so the simple midpoint rule cannot
// produce the overlaps a variable-height version would.

// Sized to match the 25% type bump in EftShopping.css — the boxes have to grow
// with the text or the names clip.
export const LAYOUT = {
  itemW: 272,
  // Wide enough for the longest station name ("Intelligence Center 3") without
  // an ellipsis — the station is the most useful thing on a recipe node.
  craftW: 250,
  itemH: 56,
  craftH: 50,
  gapY: 11,
  gapX: 54,
  padX: 30,
  padY: 26,
  treeGap: 48,
};

const nodeW = (n) => (n.kind === 'item' ? LAYOUT.itemW : LAYOUT.craftW);
const nodeH = (n) => (n.kind === 'item' ? LAYOUT.itemH : LAYOUT.craftH);

function columnX(depth) {
  const pair = LAYOUT.itemW + LAYOUT.gapX + LAYOUT.craftW + LAYOUT.gapX;
  return LAYOUT.padX + Math.floor(depth / 2) * pair
    + (depth % 2 ? LAYOUT.itemW + LAYOUT.gapX : 0);
}

/**
 * @returns {{nodes:Array, edges:Array, width:number, height:number}}
 */
export function layoutTree(root, startY = 0) {
  const nodes = [];
  const edges = [];
  let cursor = startY;
  let maxX = 0;

  const walk = (n, parent) => {
    n.w = nodeW(n);
    n.h = nodeH(n);
    n.x = columnX(n.depth);

    const kids = n.collapsed ? [] : (n.children || []);
    if (!kids.length) {
      n.y = cursor + n.h / 2;
      cursor += n.h + LAYOUT.gapY;
    } else {
      for (const k of kids) walk(k, n);
      n.y = (kids[0].y + kids[kids.length - 1].y) / 2;
    }

    maxX = Math.max(maxX, n.x + n.w);
    nodes.push(n);
    if (parent) edges.push({ id: `${parent.key}->${n.key}`, from: parent, to: n });
  };

  walk(root, null);
  return { nodes, edges, width: maxX + LAYOUT.padX, height: cursor, root };
}

/** Lays out several trees stacked vertically into one coordinate space. */
export function layoutForest(roots) {
  const nodes = [];
  const edges = [];
  const bands = [];
  let y = LAYOUT.padY;
  let width = 0;

  for (const entry of roots) {
    const laid = layoutTree(entry.root, y);
    nodes.push(...laid.nodes);
    edges.push(...laid.edges);
    bands.push({
      key: entry.root.key, label: entry.label, top: y, bottom: laid.height, rootNode: entry.root,
    });
    width = Math.max(width, laid.width);
    y = laid.height + LAYOUT.treeGap;
  }

  return { nodes, edges, bands, width, height: y + LAYOUT.padY };
}

// --- Search ----------------------------------------------------------------

export function searchItems(pool, query, limit = 40) {
  const q = clean(query).trim();
  if (!q) return pool.slice(0, limit);
  const scored = [];
  for (const entry of pool) {
    const name = clean(entry.name);
    const at = name.indexOf(q);
    if (at === -1) continue;
    scored.push({ ...entry, score: at === 0 ? 0 : 1 });
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit);
}

/**
 * Every item the graph knows about, craftable or not — the picker needs raw
 * ingredients too, since "what is this scrap used in" is the whole point of the
 * downstream direction.
 */
export function allGraphItems(index) {
  const ids = new Set([...index.byOutput.keys(), ...index.byInput.keys()]);
  return [...ids]
    .map((itemId) => ({
      itemId,
      name: itemName(index, itemId),
      recipes: index.byOutput.get(itemId)?.length || 0,
      usedIn: (index.byInput.get(itemId) || []).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Rolls a whole tree up into a flat shopping-style total of its leaf inputs.
 *
 * Where an item has more than one recipe this takes the first — a real "cheapest
 * path" solve needs prices, and prices are the one thing the game files don't
 * carry. The view labels the number as an estimate for that reason.
 */
export function totalRawInputs(index, itemId, count = 1, seen = new Set(), out = new Map()) {
  const producers = index.byOutput.get(itemId);
  if (!producers?.length || seen.has(itemId)) {
    out.set(itemId, (out.get(itemId) || 0) + count);
    return out;
  }
  const craft = producers[0];
  const yieldPer = craft.outputs.find((o) => o.itemId === itemId)?.count || 1;
  const runs = Math.ceil(count / yieldPer);
  const next = new Set(seen).add(itemId);
  for (const inp of craft.inputs) {
    totalRawInputs(index, inp.itemId, (inp.count || 1) * runs, next, out);
  }
  return out;
}
