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
// EVERY NODE IS AN ITEM. Recipes used to be nodes of their own, so a chain read
// item -> craft -> item -> craft and the station sat in the middle of the flow
// as though "Medstation 1" were a thing you crafted. It isn't a step, it's
// where a step happens — so the recipe now rides ON the item it produces, as a
// header, and the tree is items all the way down.
//
// Multi-recipe items (12 of 192 outputs) keep every option: the node holds the
// full `recipes` list plus the index of the one it is showing, so nothing is
// merged or hidden — you flip between them on the node itself.
//
// READING DIRECTION. Ingredients flow INTO their product, so an 'up' tree is
// laid out with the raw materials on the LEFT and the finished item on the
// RIGHT — the way a recipe reads. A 'down' tree already runs that way (the item
// you asked about on the left, what it becomes on the right), so only 'up' is
// mirrored. See `layoutForest({ flip })`.

export const DIRECTIONS = [
  { value: 'both', label: 'Both ways', title: 'What makes it, and what it goes on to make' },
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
    recipeChoice = {},
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

  /**
   * @param viaCraft the recipe that produced this node, when the parent already
   *                 knows it ('down' direction). In 'up' the node picks its own.
   */
  const makeItem = (itemId, key, depth, count, path, label, viaCraft, role) => {
    nodes += 1;
    const node = {
      kind: 'item',
      key,
      id: itemId,
      depth,
      count,
      role,
      name: itemName(index, itemId, label),
      item: index.items?.[itemId] || null,
      craftable: isCraftable(index, itemId),
      cycle: path.has(itemId),
      // The recipe that makes this item. Rendered as a header on the node —
      // never as a step of its own.
      craft: viaCraft || null,
      recipes: [],
      recipeIndex: 0,
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
    if (!crafts.length) return node;

    let feed;

    if (direction === 'up') {
      // Every way to make this item is kept; one is shown at a time.
      node.recipes = crafts;
      node.recipeIndex = Math.min(Math.max(0, recipeChoice[key] ?? 0), crafts.length - 1);
      node.craft = crafts[node.recipeIndex];

      const raw = [
        ...node.craft.inputs.map((i) => ({ ...i, role: 'input' })),
        ...(includeTools ? node.craft.tools.map((t) => ({ ...t, count: 1, role: 'tool' })) : []),
      ];
      feed = craftableOnly
        ? raw.filter((f) => f.role === 'tool' || isCraftable(index, f.itemId))
        : raw;
    } else {
      // Downstream: each product of each consuming recipe is a child, and it
      // carries the recipe that makes it so the header still reads "made at X".
      feed = crafts.flatMap((craft) => craft.outputs.map((o) => ({ ...o, craft, role: 'output' })));
    }

    node.hasChildren = feed.length > 0;
    if (!node.hasChildren) return node;

    node.collapsed = collapsed.has(key) || (!collapsed.has(`!${key}`) && depth >= autoDepth);
    if (node.collapsed) {
      // What is being hidden, so a folded node can say so instead of just
      // vanishing its branch.
      node.hiddenCount = feed.length;
      return node;
    }

    const nextPath = new Set(path).add(itemId);
    node.children = feed.map((f, i) => makeItem(
      f.itemId,
      childKey(key, direction === 'up' ? 'i' : 'o', f.itemId, i),
      depth + 1,
      f.count ?? 1,
      nextPath,
      f.name,
      f.craft || null,
      f.role,
    ));
    return node;
  };

  const root = makeItem(rootItemId, rootKey, 0, rootCount, new Set(), null, null, null);
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
  // Wide enough for a long item name beside its icon, and for the station line
  // underneath ("Intelligence Center 3") without an ellipsis.
  // 310 rather than 272: the recipe line has to fit a long station name, a
  // duration and (on multi-recipe items) the switcher without ellipsising the
  // station, which is the most useful thing on the line.
  itemW: 330,
  // Two lines now: the item, and the recipe header that used to be its own node.
  itemH: 74,
  gapY: 11,
  gapX: 54,
  padX: 30,
  padY: 26,
  treeGap: 48,
};

const nodeW = () => LAYOUT.itemW;
const nodeH = () => LAYOUT.itemH;

// Every node is an item, so columns are uniform — there is no longer an
// alternating narrow recipe column to step over.
function columnX(depth) {
  return LAYOUT.padX + depth * (LAYOUT.itemW + LAYOUT.gapX);
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

/**
 * One item with BOTH halves of its story: what makes it on the left, what it
 * goes on to make on the right, and the item itself in the middle.
 *
 * Clicking an item is a question about that item, and "where does this come
 * from" and "what is it for" are two halves of one answer — having to flip a
 * toggle between them meant never seeing the whole chain at once.
 *
 * Built as two ordinary trees sharing a root: the ingredient half is laid out
 * and mirrored, the uses half is laid out normally and then translated so its
 * root lands exactly on the other's. The duplicate root is dropped and its
 * edges re-pointed, so the item is one node with branches leaving both sides.
 */
export function layoutBidirectional(upRoot, downRoot, startY = 0) {
  const up = layoutTree(upRoot, 0);
  const down = layoutTree(downRoot, 0);

  for (const n of up.nodes) n.x = up.width - n.x - n.w;

  const dx = upRoot.x - downRoot.x;
  const dy = upRoot.y - downRoot.y;
  for (const n of down.nodes) { n.x += dx; n.y += dy; }

  const edges = [
    ...up.edges,
    ...down.edges.map((e) => (e.from === downRoot ? { ...e, from: upRoot } : e)),
  ];
  const nodes = [...up.nodes, ...down.nodes.filter((n) => n !== downRoot)];

  // Which side a node's OWN children sit on, so the view knows which edge of
  // the box to draw its fold caret on. Up-side children were just mirrored to
  // the left; down-side children run normally to the right.
  for (const n of up.nodes) n.side = 'left';
  for (const n of down.nodes) n.side = 'right';

  // upRoot IS the merged centre node (downRoot is dropped, its edges
  // re-pointed above) — but it is the one node on the whole chart with
  // branches on BOTH sides, and its own `.children`/`.collapsed` only ever
  // describe the up (left) half. Carry the down half's fold state across
  // separately so the view can offer a second, independent caret for it.
  upRoot.downBranch = {
    key: downRoot.key,
    hasChildren: downRoot.hasChildren,
    collapsed: downRoot.collapsed,
    hiddenCount: downRoot.hiddenCount,
  };

  // Each half is centred on its own children, so the merged tree can start
  // above zero. Slide it back to where the caller asked for it.
  const minY = Math.min(...nodes.map((n) => n.y - n.h / 2));
  const shift = startY - minY;
  for (const n of nodes) n.y += shift;

  return {
    nodes,
    edges,
    root: upRoot,
    width: Math.max(...nodes.map((n) => n.x + n.w)) + LAYOUT.padX,
    height: Math.max(...nodes.map((n) => n.y + n.h / 2)),
  };
}

/**
 * Lays out several trees stacked vertically into one coordinate space.
 *
 * @param opts.flip mirror horizontally once the full width is known. Used for
 *   'up' (ingredient) trees: the tree is built root-first, but a recipe reads
 *   inputs-then-output, so the raw materials belong on the LEFT and the
 *   finished item on the RIGHT. Mirroring after the fact keeps the tidy-tree
 *   maths in one direction and costs one pass.
 */
export function layoutForest(roots, opts = {}) {
  const { flip = false } = opts;
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

  if (flip) for (const n of nodes) n.x = width - n.x - n.w;
  // Whichever side got flipped to is the side this whole forest's children
  // live on — every node in it shares one direction, so the fold caret goes
  // on that one edge for all of them.
  for (const n of nodes) n.side = flip ? 'left' : 'right';

  return { nodes, edges, bands, width, height: y + LAYOUT.padY, flipped: flip };
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
