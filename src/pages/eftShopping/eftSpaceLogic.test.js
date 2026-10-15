import { describe, it, expect } from 'vitest';

import snapshot from './data/spaceSnapshot.json';
import {
  buildSpaceIndex, assemblySize, absorbersFor, bestFill, packingLeaderboard, planPile, searchMods, footprint,
} from './eftSpaceLogic';

const fake = (mods) => buildSpaceIndex({ mods, containers: [] });

describe('assemblySize — the game rule', () => {
  it('ignores a child\'s own width/height', () => {
    const ix = fake([
      { id: 'a', n: 'host', s: 'h', c: 'Mount', w: 1, h: 1, sl: [['mod_scope', [1]]] },
      { id: 'b', n: 'scope', s: 's', c: 'OpticScope', w: 2, h: 1 },
    ]);
    expect(assemblySize(ix, { m: 0, kids: [{ m: 1, kids: [] }] })).toEqual({ w: 1, h: 1 });
  });

  it('takes the MAX extra size per direction, at any depth', () => {
    const ix = fake([
      { id: 'a', n: 'host', s: 'h', c: 'Mount', w: 1, h: 1 },
      { id: 'b', n: 'b', s: 'b', c: 'Mount', w: 1, h: 1, x: [0, 1, 0, 0] },
      { id: 'c', n: 'c', s: 'c', c: 'Mount', w: 1, h: 1, x: [0, 2, 0, 0] },
    ]);
    const tree = { m: 0, kids: [{ m: 1, kids: [{ m: 2, kids: [] }] }] };
    expect(assemblySize(ix, tree)).toEqual({ w: 3, h: 1 });
  });

  it('SUMS ExtraSizeForceAdd children on top of the max', () => {
    const ix = fake([
      { id: 'a', n: 'host', s: 'h', c: 'Mount', w: 1, h: 1 },
      { id: 'b', n: 'b', s: 'b', c: 'Mount', w: 1, h: 1, x: [0, 1, 0, 0], f: 1 },
      { id: 'c', n: 'c', s: 'c', c: 'Mount', w: 1, h: 1, x: [0, 1, 0, 0], f: 1 },
      { id: 'd', n: 'd', s: 'd', c: 'Mount', w: 1, h: 1, x: [0, 1, 0, 0] },
    ]);
    const tree = { m: 0, kids: [{ m: 1, kids: [] }, { m: 2, kids: [] }, { m: 3, kids: [] }] };
    expect(assemblySize(ix, tree)).toEqual({ w: 4, h: 1 });
  });
});

describe('bestFill', () => {
  it('never combines conflicting mods', () => {
    const ix = fake([
      { id: 'a', n: 'host', s: 'h', c: 'Mount', w: 1, h: 1, sl: [['s1', [1]], ['s2', [2]]] },
      { id: 'b', n: 'b', s: 'b', c: 'Flashlight', w: 2, h: 1, cf: [2] },
      { id: 'c', n: 'c', s: 'c', c: 'Flashlight', w: 1, h: 1 },
    ]);
    const kids = bestFill(ix, 0).tree.kids.map((k) => k.m);
    expect(kids).toEqual([1]);
  });

  it('does not take a child that grows the assembly more than it saves', () => {
    const ix = fake([
      { id: 'a', n: 'host', s: 'h', c: 'Mount', w: 1, h: 1, sl: [['s1', [1]]] },
      { id: 'b', n: 'b', s: 'b', c: 'Flashlight', w: 1, h: 1, x: [0, 2, 0, 0] },
    ]);
    expect(bestFill(ix, 0).tree.kids).toHaveLength(0);
  });
});

describe('the shipped snapshot', () => {
  const ix = buildSpaceIndex(snapshot);
  const byName = (n) => ix.mods.find((m) => m.name === n);

  it('Vulcan scope on its universal base packs into one cell', () => {
    const scope = byName('Armasight Vulcan MG 3.5x Bravo night vision scope');
    const [best] = absorbersFor(ix, scope.i);
    expect(best.host.name).toBe('Armasight Vulcan universal base');
    expect(best.size).toEqual({ w: 1, h: 1 });
    expect(best.saved).toBe(1);
  });

  it('the Goliaf handguard holds several mods in its own single cell', () => {
    const fill = bestFill(ix, byName('AKS-74U Alfa Arms Goliaf handguard').i);
    expect(fill.size).toEqual({ w: 1, h: 1 });
    expect(fill.net).toBeGreaterThanOrEqual(4);
  });

  it('Partisan\'s bag nets +8 and the THICC item case +181', () => {
    const c = (n) => ix.containers.find((x) => x.name === n);
    expect(c("Partisan's bag").net).toBe(8);
    expect(c('T H I C C item case').net).toBe(14 * 14 - 15);
  });

  it('leaderboard is sorted and every entry really nets space', () => {
    const lb = packingLeaderboard(ix);
    expect(lb.length).toBeGreaterThan(100);
    for (let i = 1; i < lb.length; i += 1) expect(lb[i - 1].net).toBeGreaterThanOrEqual(lb[i].net);
    expect(lb.every((r) => footprint(r.host) + r.gear.cells - r.size.w * r.size.h === r.net)).toBe(true);
    const all = packingLeaderboard(ix, { countAdapters: true });
    expect(all.every((r) => r.loose - r.size.w * r.size.h === r.net)).toBe(true);
  });

  // Trey, 2026-10-14: the HK 416 MRS's "25 cells into 3x1" was inflated by the KeyMod rail
  // sections it needs — the Goliaf holding 5-6 things in ONE cell is the better packer.
  it('rails are free by default, so a rail-hungry handguard no longer outranks the Goliaf', () => {
    const hk = byName('HK 416 MRS KeyMod 14 inch handguard').i;
    const goliaf = bestFill(ix, byName('AKS-74U Alfa Arms Goliaf handguard').i);
    expect(bestFill(ix, hk).net).toBeLessThan(bestFill(ix, hk, { countAdapters: true }).net);
    expect(bestFill(ix, hk).gear.adapters).toBeGreaterThan(0);
    expect(goliaf.density).toBeGreaterThan(bestFill(ix, hk).density);
  });

  it('prefers gear straight on the slot over the same gear on a rail', () => {
    expect(bestFill(ix, byName('AKS-74U Alfa Arms Goliaf handguard').i).gear.adapters).toBe(0);
  });

  it('planPile totals per-unit savings and leaves cost null when a price is missing', () => {
    const scope = byName('Armasight Vulcan MG 3.5x Bravo night vision scope');
    const plan = planPile(ix, [{ idx: scope.i, count: 20 }]);
    expect(plan.savedTotal).toBe(20);
    expect(plan.costTotal).toBeNull();
    expect(planPile(ix, [{ idx: scope.i, count: 20 }], () => 1000).costTotal).toBe(20000);
  });

  it('search finds by short name too', () => {
    expect(searchMods(ix, 'goliaf').length).toBeGreaterThan(0);
  });
});
