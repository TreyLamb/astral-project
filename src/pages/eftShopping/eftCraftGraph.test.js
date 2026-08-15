import { describe, it, expect } from 'vitest';

import snapshot from './data/hideoutSnapshot.json';
import {
  buildCraftIndex, buildTree, layoutTree, layoutForest, rootItems, chainDepth,
  searchItems, allGraphItems, totalRawInputs, isCraftable, LAYOUT, MAX_NODES,
} from './eftCraftGraph';

const index = buildCraftIndex(snapshot);

// A tiny hand-built graph: ore -> ingot -> plate, plus a second recipe for
// ingot, a tool, and a deliberate cycle.
const fixture = () => buildCraftIndex({
  items: {
    ore: { id: 'ore', name: 'Ore' },
    ingot: { id: 'ingot', name: 'Ingot' },
    plate: { id: 'plate', name: 'Plate' },
    scrap: { id: 'scrap', name: 'Scrap' },
    press: { id: 'press', name: 'Press' },
  },
  stations: [
    {
      name: 'Workbench',
      normalizedName: 'workbench',
      crafts: [
        {
          id: 'c-ingot', level: 1, duration: 60,
          requiredItems: [{ itemId: 'ore', count: 3 }],
          rewardItems: [{ itemId: 'ingot', count: 1 }],
          tools: [{ itemId: 'press' }],
        },
        {
          id: 'c-ingot-alt', level: 2, duration: 30,
          requiredItems: [{ itemId: 'scrap', count: 5 }],
          rewardItems: [{ itemId: 'ingot', count: 1 }],
          tools: [],
        },
        {
          id: 'c-plate', level: 3, duration: 120,
          requiredItems: [{ itemId: 'ingot', count: 2 }],
          rewardItems: [{ itemId: 'plate', count: 1 }],
          tools: [],
        },
        // plate -> scrap -> ingot -> plate is a loop on purpose.
        {
          id: 'c-scrap', level: 1, duration: 10,
          requiredItems: [{ itemId: 'plate', count: 1 }],
          rewardItems: [{ itemId: 'scrap', count: 4 }],
          tools: [],
        },
      ],
    },
  ],
});

describe('buildCraftIndex', () => {
  it('indexes every recipe in the shipped snapshot', () => {
    const stationCrafts = snapshot.stations.reduce((n, s) => n + s.crafts.length, 0);
    const extra = (snapshot.extraCrafts || []).reduce((n, g) => n + g.crafts.length, 0);
    expect(index.crafts.length).toBe(stationCrafts + extra);
    expect(index.crafts.length).toBeGreaterThan(150);
  });

  it('the snapshot actually carries crafts — the whole view depends on it', () => {
    expect(snapshot.gaps).not.toContain('crafts');
    expect(index.byOutput.size).toBeGreaterThan(100);
  });

  it('resolves a name for every item a recipe references', () => {
    const missing = [];
    for (const craft of index.crafts) {
      for (const ref of [...craft.inputs, ...craft.outputs, ...craft.tools]) {
        if (!index.items[ref.itemId]) missing.push(ref.itemId);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps tools out of the consumed-input lists', () => {
    const f = fixture();
    const ingotCraft = f.byId.get('c-ingot');
    expect(ingotCraft.inputs.map((i) => i.itemId)).toEqual(['ore']);
    expect(ingotCraft.tools.map((t) => t.itemId)).toEqual(['press']);
    // The press still points at the craft it gates, so "used in" finds it…
    expect(f.byInput.get('press').map((c) => c.id)).toEqual(['c-ingot']);
    // …but it is not one of that craft's inputs.
    expect(f.byId.get('c-ingot').inputs.some((i) => i.itemId === 'press')).toBe(false);
  });

  it('groups crafts by station', () => {
    expect(index.stations.length).toBeGreaterThan(3);
    for (const st of index.stations) expect(st.crafts.length).toBeGreaterThan(0);
  });
});

describe('buildTree — upstream', () => {
  it('alternates item and craft levels', () => {
    const f = fixture();
    const { root } = buildTree(f, 'plate', { direction: 'up', autoDepth: 9 });
    expect(root.kind).toBe('item');
    expect(root.children[0].kind).toBe('craft');
    expect(root.children[0].children[0].kind).toBe('item');
  });

  it('branches once per recipe instead of merging them', () => {
    const f = fixture();
    const { root } = buildTree(f, 'ingot', { direction: 'up', autoDepth: 9 });
    expect(root.children.map((c) => c.id).sort()).toEqual(['c-ingot', 'c-ingot-alt']);
  });

  it('marks a repeat instead of looping forever', () => {
    const f = fixture();
    const { root } = buildTree(f, 'plate', { direction: 'up', autoDepth: 99 });
    const flat = [];
    (function walk(n) { flat.push(n); (n.children || []).forEach(walk); }(root));
    const cycles = flat.filter((n) => n.cycle);
    expect(cycles.length).toBeGreaterThan(0);
    for (const c of cycles) expect(c.children).toEqual([]);
  });

  it('shows tools only when asked', () => {
    const f = fixture();
    const withTools = buildTree(f, 'ingot', { direction: 'up', autoDepth: 9, includeTools: true });
    const without = buildTree(f, 'ingot', { direction: 'up', autoDepth: 9, includeTools: false });
    const names = (t) => {
      const out = [];
      (function walk(n) { if (n.kind === 'item') out.push(n.id); (n.children || []).forEach(walk); }(t.root));
      return out;
    };
    expect(names(withTools)).toContain('press');
    expect(names(without)).not.toContain('press');
  });

  it('craftableOnly drops raw inputs but keeps craftable ones', () => {
    const f = fixture();
    const { root } = buildTree(f, 'plate', {
      direction: 'up', autoDepth: 9, craftableOnly: true, includeTools: false,
    });
    const craft = root.children[0];
    expect(craft.children.map((c) => c.id)).toEqual(['ingot']);
    const alt = buildTree(f, 'ingot', {
      direction: 'up', autoDepth: 9, craftableOnly: true, includeTools: false,
    });
    // Ore is raw, scrap is craftable — only the craftable branch survives.
    const kept = alt.root.children.flatMap((c) => c.children.map((n) => n.id));
    expect(kept).toEqual(['scrap']);
  });
});

describe('buildTree — downstream', () => {
  it('walks uses forward', () => {
    const f = fixture();
    const { root } = buildTree(f, 'ore', { direction: 'down', autoDepth: 9 });
    expect(root.children.map((c) => c.id)).toEqual(['c-ingot']);
    expect(root.children[0].children.map((c) => c.id)).toEqual(['ingot']);
  });

  it('a tool-gated craft shows up under the tool', () => {
    const f = fixture();
    const { root } = buildTree(f, 'press', { direction: 'down', autoDepth: 9 });
    expect(root.children.map((c) => c.id)).toEqual(['c-ingot']);
  });
});

describe('collapse', () => {
  it('folds the node whose key is in the set and nothing else', () => {
    const f = fixture();
    const open = buildTree(f, 'plate', { direction: 'up', autoDepth: 9 });
    const craftKey = open.root.children[0].key;
    const folded = buildTree(f, 'plate', {
      direction: 'up', autoDepth: 9, collapsed: new Set([craftKey]),
    });
    expect(folded.root.children[0].collapsed).toBe(true);
    expect(folded.root.children[0].children).toEqual([]);
    // Still advertises that there is something to open.
    expect(folded.root.children[0].hasChildren).toBe(true);
    expect(folded.root.collapsed).toBe(false);
  });

  it('auto-folds past the depth limit, and an explicit expand overrides it', () => {
    const f = fixture();
    const shallow = buildTree(f, 'plate', { direction: 'up', autoDepth: 1 });
    const deep = shallow.root.children[0].children[0];
    expect(deep.collapsed).toBe(true);
    const forced = buildTree(f, 'plate', {
      direction: 'up', autoDepth: 1, collapsed: new Set([`!${deep.key}`]),
    });
    expect(forced.root.children[0].children[0].collapsed).toBe(false);
  });

  it('node keys are stable across rebuilds', () => {
    const f = fixture();
    const a = buildTree(f, 'plate', { direction: 'up', autoDepth: 9 });
    const b = buildTree(f, 'plate', { direction: 'up', autoDepth: 9 });
    const keys = (t) => { const o = []; (function w(n) { o.push(n.key); (n.children || []).forEach(w); }(t.root)); return o; };
    expect(keys(a)).toEqual(keys(b));
  });
});

describe('layout', () => {
  it('places depth on x and never overlaps siblings on y', () => {
    const f = fixture();
    const { root } = buildTree(f, 'plate', { direction: 'up', autoDepth: 9 });
    const laid = layoutTree(root);
    for (const n of laid.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(LAYOUT.padX);
      if (n.depth % 2 === 0) expect(n.w).toBe(LAYOUT.itemW);
      else expect(n.w).toBe(LAYOUT.craftW);
    }
    const byDepth = new Map();
    for (const n of laid.nodes) {
      if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
      byDepth.get(n.depth).push(n);
    }
    for (const [, list] of byDepth) {
      const xs = new Set(list.map((n) => n.x));
      expect(xs.size).toBe(1);
      const sorted = [...list].sort((a, b) => a.y - b.y);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i].y - sorted[i - 1].y).toBeGreaterThanOrEqual(sorted[i].h - 0.001);
      }
    }
  });

  it('centres a parent on its children', () => {
    const f = fixture();
    const { root } = buildTree(f, 'ingot', { direction: 'up', autoDepth: 9 });
    const laid = layoutTree(root);
    const kids = laid.root.children;
    expect(laid.root.y).toBeCloseTo((kids[0].y + kids[kids.length - 1].y) / 2, 5);
  });

  it('stacks a forest without overlapping bands', () => {
    const f = fixture();
    const roots = ['plate', 'ingot'].map((id) => ({
      label: id,
      root: buildTree(f, id, { direction: 'up', autoDepth: 9 }).root,
    }));
    const forest = layoutForest(roots);
    expect(forest.bands.length).toBe(2);
    expect(forest.bands[1].top).toBeGreaterThan(forest.bands[0].bottom);
    expect(forest.height).toBeGreaterThan(forest.bands[1].bottom);
  });

  it('lays out the deepest real chain without blowing the node cap', () => {
    const roots = rootItems(index);
    const deepest = roots[0];
    const tree = buildTree(index, deepest.itemId, { direction: 'up', autoDepth: 99 });
    expect(tree.truncated).toBe(false);
    expect(tree.nodes).toBeLessThan(MAX_NODES);
    const laid = layoutTree(tree.root);
    expect(laid.width).toBeGreaterThan(0);
    expect(laid.height).toBeGreaterThan(0);
  });
});

describe('roots and search', () => {
  it('splits final products from intermediates', () => {
    const f = fixture();
    const roots = rootItems(f);
    const byId = Object.fromEntries(roots.map((r) => [r.itemId, r]));
    expect(byId.ingot.kind).toBe('intermediate');
    expect(byId.ingot.recipes).toBe(2);
  });

  it('the real snapshot has genuine multi-step chains', () => {
    const deep = rootItems(index).filter((r) => r.depth >= 2);
    expect(deep.length).toBeGreaterThan(5);
  });

  it('chainDepth terminates on a cycle', () => {
    const f = fixture();
    expect(chainDepth(f, 'plate')).toBeGreaterThan(0);
    expect(Number.isFinite(chainDepth(f, 'plate'))).toBe(true);
  });

  it('matches anywhere in the name', () => {
    const pool = allGraphItems(index);
    const hits = searchItems(pool, 'bitcoin');
    expect(hits.map((h) => h.name)).toContain('Physical Bitcoin');
  });

  it('ranks a prefix match above a mid-word one', () => {
    const pool = [
      { itemId: 'a', name: 'Gunpowder "Kite"' },
      { itemId: 'b', name: 'Powder' },
    ];
    expect(searchItems(pool, 'powder')[0].name).toBe('Powder');
  });

  it('the picker includes raw ingredients, not just craftables', () => {
    const pool = allGraphItems(index);
    expect(pool.length).toBeGreaterThan(index.byOutput.size);
    expect(pool.some((p) => p.recipes === 0)).toBe(true);
  });
});

describe('totalRawInputs', () => {
  it('rolls a chain down to raw materials', () => {
    const f = fixture();
    const totals = totalRawInputs(f, 'plate', 1);
    // plate needs 2 ingot; first ingot recipe is 3 ore each.
    expect(totals.get('ore')).toBe(6);
    expect(totals.has('ingot')).toBe(false);
  });

  it('rounds partial runs up', () => {
    const f = buildCraftIndex({
      items: {},
      stations: [{
        name: 'W', normalizedName: 'w',
        crafts: [{
          id: 'c', level: 1, duration: 1,
          requiredItems: [{ itemId: 'raw', count: 1 }],
          rewardItems: [{ itemId: 'out', count: 4 }],
          tools: [],
        }],
      }],
    });
    expect(totalRawInputs(f, 'out', 5).get('raw')).toBe(2);
  });

  it('a raw item totals to itself', () => {
    const f = fixture();
    expect(totalRawInputs(f, 'ore', 3).get('ore')).toBe(3);
  });
});

describe('isCraftable', () => {
  it('is true only for items some recipe outputs', () => {
    const f = fixture();
    expect(isCraftable(f, 'ingot')).toBe(true);
    expect(isCraftable(f, 'ore')).toBe(false);
  });
});
