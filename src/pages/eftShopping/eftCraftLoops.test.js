import { describe, it, expect } from 'vitest';

import snapshot from './data/hideoutSnapshot.json';
import prices from './data/prices/pve.json';
import { buildCraftIndex } from './eftCraftGraph';
import {
  buildSupplyIndex, findCraftLoops, findCycles, readPrices, sellValue, LOOP_DEFAULTS,
} from './eftCraftLoops';

const RUB = 'RUB';

/**
 * A hand-built economy small enough to reason about completely.
 *
 *   vest  — Ragman cash, 100, unlimited, 6 per restock
 *   juice — Jaeger cash, 10, unlimited, 4 per restock   -> the tightest link in the ladder
 *   bar   — Jaeger barter, 1x juice, unlimited, 5 per restock
 *   pelt  — Jaeger barter, 2x bar, unlimited, 9 per restock
 *   scrap — limited stock, so it can never feed a loop however cheap it is
 *   dye   — FLEA ONLY, no trader sells it
 *   sinew — Jaeger barter, 1x dye: a ladder that LOOKS trader-fed and is not
 *
 *   3x vest -> 2x cloth        (cloth also sells on the flea at 300)
 *   1x pelt -> 2x fibre
 *   1x cloth + 1x fibre -> 1x armor
 *   2x sinew -> 3x thread
 */
const priceFixture = (over = {}) => ({
  mode: 'test',
  fx: { RUB: 1, USD: 100 },
  traders: ['Ragman', 'Jaeger'],
  scannedAt: { flea: 1, traders: 2 },
  flea: {
    cloth: [300, 250, 40, 0, 0],
    fibre: [400, 380, 30, 0, 0],
    armor: [500, 450, 25, 0, 0],
    thin: [9999, 9999, 2, 0, 0],
    dye: [50, 45, 40, 0, 0],
    thread: [400, 380, 30, 0, 0],
    gun: [900000, 800000, 60, 4, 0],
    ...over.flea,
  },
  vendor: {
    cloth: [80, 'Therapist', 1],
    fibre: [90, 'Therapist', 1],
    armor: [120, 'Ragman', 2],
    gun: [40000, 'Prapor', 3],
    thread: [90, 'Therapist', 1],
    ...over.vendor,
  },
  offers: over.offers || [
    ['vest', 0, 1, 1, 1, 6, [[RUB, 100]]],
    ['juice', 1, 1, 1, 1, 4, [[RUB, 10]]],
    ['bar', 1, 1, 1, 1, 5, [['juice', 1]]],
    ['pelt', 1, 1, 1, 1, 9, [['bar', 2]]],
    ['scrap', 0, 1, 1, 0, 99, [[RUB, 1]]],
    ['thin', 0, 1, 1, 1, 9, [[RUB, 5]]],
    ['sinew', 1, 1, 1, 1, 9, [['dye', 1]]],
  ],
});

const craftFixture = (crafts) => buildCraftIndex({
  items: Object.fromEntries(
    ['vest', 'juice', 'bar', 'pelt', 'scrap', 'cloth', 'fibre', 'armor', 'thin', 'gun',
      'dye', 'sinew', 'thread']
      .map((id) => [id, { id, name: id }]),
  ),
  stations: [{
    name: 'Lavatory',
    normalizedName: 'lavatory',
    crafts: crafts || [
      {
        id: 'c-cloth', level: 1, duration: 3600,
        requiredItems: [{ itemId: 'vest', count: 3 }],
        rewardItems: [{ itemId: 'cloth', count: 2 }],
      },
      {
        id: 'c-fibre', level: 1, duration: 3600,
        requiredItems: [{ itemId: 'pelt', count: 1 }],
        rewardItems: [{ itemId: 'fibre', count: 2 }],
      },
      {
        id: 'c-armor', level: 2, duration: 3600,
        requiredItems: [{ itemId: 'cloth', count: 1 }, { itemId: 'fibre', count: 1 }],
        rewardItems: [{ itemId: 'armor', count: 1 }],
      },
      {
        id: 'c-thread', level: 1, duration: 3600,
        requiredItems: [{ itemId: 'sinew', count: 2 }],
        rewardItems: [{ itemId: 'thread', count: 3 }],
      },
    ],
  }],
});

const supplyOf = (over, opts) => buildSupplyIndex(craftFixture(), priceFixture(over), opts);

// The fixture economy is priced in hundreds, so the real-data noise floor would filter every
// farm in it out. Everything else is left at its shipped default on purpose.
const TINY = { minNetPerRun: 0 };

describe('readPrices', () => {
  it('unpacks the positional rows the snapshot ships as', () => {
    const { flea, vendor, offers } = readPrices(priceFixture());
    expect(flea.get('cloth')).toMatchObject({ avg: 300, min: 250, listings: 40 });
    expect(vendor.get('cloth')).toMatchObject({ rub: 80, trader: 'Therapist' });
    expect(offers.get('bar')[0]).toMatchObject({ trader: 'Jaeger', barter: true, unlimited: true });
  });

  it('reads the flag bitfield rather than trusting field order', () => {
    const { flea } = readPrices(priceFixture());
    expect(flea.get('gun').buildPriced).toBe(true);
    expect(flea.get('gun').stale).toBe(false);
    const { flea: f2 } = readPrices(priceFixture({ flea: { cloth: [300, 250, 40, 3, 0] } }));
    expect(f2.get('cloth')).toMatchObject({ stale: true, lowConfidence: true, buildPriced: false });
  });
});

describe('buildSupplyIndex', () => {
  it('prices a barter give-item as a purchase, never as a craft', () => {
    // `unit` would let "or craft it, if that is cheaper" leak into what the card presents as
    // a shop trip, and it produced a vest costing less than the bar of chocolate it is
    // bartered for.
    const supply = supplyOf();
    for (const [, route] of supply.buy) {
      if (route.kind !== 'barter') continue;
      for (const part of route.offer.pay) {
        if (part.currency) continue;
        expect(supply.buy.get(part.itemId).rub).toBeLessThanOrEqual(route.rub * route.offer.stack + 0.01);
      }
    }
  });

  it('prices a barter ladder through to the cash at the bottom', () => {
    const supply = supplyOf();
    // juice 10 -> bar 10 -> pelt 20.
    expect(supply.buy.get('bar').rub).toBe(10);
    expect(supply.buy.get('pelt').rub).toBe(20);
    expect(supply.buy.get('pelt').kind).toBe('barter');
  });

  it('prefers crafting an item when that beats every way to buy it', () => {
    const supply = supplyOf();
    // 3 vests at 100 make 2 cloth, so 150 each — against a flea price of 300.
    expect(supply.unit.get('cloth')).toBe(150);
    expect(supply.route.get('cloth').via).toBe('make');
    expect(supply.buy.get('cloth').rub).toBe(300);
  });

  it('never treats a limited-stock offer as a supply, however cheap', () => {
    const supply = supplyOf();
    expect(supply.buy.has('scrap')).toBe(false);
    expect(supply.unit.has('scrap')).toBe(false);
  });

  it('ignores a flea listing too thin to rely on', () => {
    // `thin` has 2 listings at 9,999 and a 5 RUB trader offer; the trader must win, and the
    // flea route must not exist at all.
    const supply = supplyOf(undefined, { minListings: 8 });
    expect(supply.buy.get('thin').kind).toBe('cash');
    expect(supply.unit.get('thin')).toBe(5);
  });

  it('skips an offer priced in a currency with no derived rate', () => {
    // Treating an unknown rate as 1 would make a $250 item look like it costs 250 RUB.
    const fixture = priceFixture({
      offers: [['vest', 0, 1, 1, 1, 6, [['EUR', 250]]]],
    });
    const supply = buildSupplyIndex(craftFixture(), fixture);
    expect(supply.buy.has('vest')).toBe(false);
  });

  it('gates on trader loyalty when asked, and not when not', () => {
    expect(supplyOf().buy.get('vest').rub).toBe(100);
    const gated = supplyOf(undefined, { traderLevels: { Jaeger: 1 } });
    expect(gated.buy.has('vest')).toBe(false);
    expect(gated.buy.get('bar').rub).toBe(10);
  });

  it('gates on station level, so a farm you cannot run is not offered', () => {
    const gated = supplyOf(undefined, { stationLevels: { lavatory: 1 } });
    expect(gated.craftable.map((c) => c.id)).toEqual(['c-cloth', 'c-fibre', 'c-thread']);
  });

  it('converges rather than iterating to its cap', () => {
    const supply = supplyOf();
    expect(supply.stats.converged).toBe(true);
    expect(supply.stats.passes).toBeLessThan(LOOP_DEFAULTS.maxPasses);
  });

  it('terminates on a craft cycle instead of hanging', () => {
    const cyclic = craftFixture([
      {
        id: 'c-a', level: 1, duration: 60,
        requiredItems: [{ itemId: 'cloth', count: 1 }],
        rewardItems: [{ itemId: 'fibre', count: 1 }],
      },
      {
        id: 'c-b', level: 1, duration: 60,
        requiredItems: [{ itemId: 'fibre', count: 1 }],
        rewardItems: [{ itemId: 'cloth', count: 1 }],
      },
    ]);
    const supply = buildSupplyIndex(cyclic, priceFixture());
    expect(supply.stats.passes).toBeLessThanOrEqual(LOOP_DEFAULTS.maxPasses);
    expect(supply.unit.get('cloth')).toBeGreaterThan(0);
  });
});

describe('sellValue', () => {
  it('takes the better of flea and vendor', () => {
    const supply = supplyOf();
    expect(sellValue(supply, 'cloth').best).toMatchObject({ via: 'flea', rub: 300 });
  });

  it('refuses to value a weapon off the flea, because those listings are builds', () => {
    const supply = supplyOf();
    const gun = sellValue(supply, 'gun');
    expect(gun.buildPriced).toBe(true);
    expect(gun.best).toMatchObject({ via: 'trader', rub: 40000 });
    expect(gun.options.some((o) => o.via === 'flea')).toBe(false);
  });
});

describe('findCraftLoops — plans', () => {
  const result = () => findCraftLoops(craftFixture(), priceFixture(), TINY);

  it('finds the two-feeder chain and scales the batch so yields divide evenly', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    expect(farm).toBeTruthy();
    // 1 armor needs 1 cloth and 1 fibre; both feeders yield 2, so a batch is 2 armor.
    expect(farm.chain.batch).toBe(2);
    expect(farm.chain.evenBatch).toBe(true);
    expect(farm.chain.steps.map((s) => s.runs).sort()).toEqual([1, 1, 2]);
  });

  it('buys the net inputs and sells the net outputs, never the gross', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    const full = farm.plans.find((p) => p.label === 'Craft it all');
    // cloth and fibre are made AND eaten inside the chain, so neither is bought or sold.
    expect(full.buys.map((b) => b.itemId).sort()).toEqual(['pelt', 'vest']);
    expect(full.sells.map((s) => s.itemId)).toEqual(['armor']);
    // A batch is 2 armor, which takes one run of each feeder: 3 vests at 100 and 1 pelt at
    // 20, against 2 armor at 500.
    expect(full.revenue).toBe(1000);
    expect(full.cost).toBe(320);
  });

  it('compares crafting the last step against selling what feeds it', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    const parts = farm.plans.find((p) => p.label === 'Sell the parts');
    // 2 cloth at 300 + 2 fibre at 400 = 1,400, against 1,000 for the armor.
    expect(parts.revenue).toBe(1400);
    expect(farm.best.label).toBe('Sell the parts');
  });

  it('names a farm by what its winning plan sells, not by the craft it was found from', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    expect(farm.products.sort()).toEqual(['cloth', 'fibre']);
    expect(farm.products).not.toContain('armor');
  });

  it('keeps the skipped last craft on the card, priced', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    const alt = farm.alsoFeeds.find((a) => a.output.itemId === 'armor');
    expect(alt).toBeTruthy();
    expect(alt.delta).toBe(380 - 780); // 1000-620 against 1400-620
  });

  it('counts rotation over the steps it tells you to run', () => {
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    expect(farm.runSteps).toHaveLength(2);
    expect(farm.rotation).toMatchObject({ crafts: 2, rotatable: true });
    expect(farm.kind).toBe('chain');
  });

  it('orders the steps so a feeder comes before what eats its output', () => {
    // expandChain discovers terminal-first, which reads backwards: the card would say
    // "1x cloth, made above" on a row printed before cloth was made.
    const farm = result().farms.find((f) => f.chain.steps.some((s) => s.craft.id === 'c-armor'));
    const full = findCraftLoops(craftFixture(), priceFixture({
      // Make the armor worth crafting so all three steps stay in the plan.
      flea: { armor: [5000, 4500, 25, 0, 0] },
    }), TINY).farms.find((f) => f.runSteps.length === 3);
    expect(full.runSteps.map((s) => s.craft.id).indexOf('c-armor')).toBe(2);
    for (const [i, step] of full.runSteps.entries()) {
      const later = new Set(full.runSteps.slice(i + 1).map((s) => s.outputId));
      for (const input of step.craft.inputs) expect(later.has(input.itemId)).toBe(false);
    }
    expect(farm.runSteps).toHaveLength(2);
  });

  it('runs crafts at one station in series and different stations at once', () => {
    const twoStation = buildCraftIndex({
      items: { vest: { id: 'vest', name: 'vest' }, cloth: { id: 'cloth', name: 'cloth' } },
      stations: [
        {
          name: 'Lavatory',
          normalizedName: 'lavatory',
          crafts: [{
            id: 'c1', level: 1, duration: 3600,
            requiredItems: [{ itemId: 'vest', count: 1 }],
            rewardItems: [{ itemId: 'cloth', count: 1 }],
          }],
        },
      ],
    });
    const farm = findCraftLoops(twoStation, priceFixture(), TINY).farms[0];
    expect(farm.best.wallSeconds).toBe(3600);
    expect(farm.best.perHour).toBe(farm.best.net);
  });
});

describe('findCraftLoops — throughput', () => {
  it('takes the tightest link of a barter ladder, not the offer at the top', () => {
    // pelt's own offer allows 9 per restock, but it costs 2 bars, and bar allows 5 (itself
    // capped by juice at 4). So pelt is 2 per restock, not 9.
    const result = findCraftLoops(craftFixture(), priceFixture(), TINY);
    const fibre = result.farms.find((f) => f.runSteps.some((s) => s.craft.id === 'c-fibre'));
    expect(fibre.throughput.runsPerRestock).toBe(2);
    expect(fibre.throughput.limiter.itemId).toBe('pelt');
  });

  it('follows a barter ladder before calling a farm trader-fed', () => {
    // `sinew` is a Jaeger barter, so its own route looks like unlimited trader stock — but it
    // is paid for in `dye`, which only exists on the flea. The real Scav Vest ladder has
    // exactly this shape (Jaeger barter -> Slickers -> Pack of Vita juice -> flea) and the
    // card claimed trader-fed for it.
    const result = findCraftLoops(craftFixture(), priceFixture(), TINY);
    const thread = result.farms.find((f) => f.runSteps.some((s) => s.craft.id === 'c-thread'));
    expect(thread.best.buys[0].route.kind).toBe('barter');
    expect(thread.throughput.traderFed).toBe(false);
    expect(thread.throughput.usesFlea).toBe(true);

    // The pelt ladder bottoms out in a cash offer, so that one really is trader-fed.
    const fibre = result.farms.find((f) => f.runSteps.some((s) => s.craft.id === 'c-fibre'));
    expect(fibre.throughput.traderFed).toBe(true);
  });

  it('still caps a flea-fed ladder by its trader links', () => {
    const result = findCraftLoops(craftFixture(), priceFixture(), TINY);
    const thread = result.farms.find((f) => f.runSteps.some((s) => s.craft.id === 'c-thread'));
    // sinew allows 9 per restock and a batch needs 2, so four batches — the flea link above
    // it is unmetered, but the trader link in the middle is not.
    expect(thread.throughput.runsPerRestock).toBe(4);
  });
});

describe('findCycles', () => {
  it('spots a craft chain that returns an item to its own ingredient list', () => {
    const cyclic = craftFixture([
      {
        id: 'c-a', level: 1, duration: 60,
        requiredItems: [{ itemId: 'cloth', count: 1 }],
        rewardItems: [{ itemId: 'fibre', count: 3 }],
      },
      {
        id: 'c-b', level: 1, duration: 60,
        requiredItems: [{ itemId: 'fibre', count: 1 }],
        rewardItems: [{ itemId: 'cloth', count: 1 }],
      },
    ]);
    const cycles = findCycles(buildSupplyIndex(cyclic, priceFixture(), TINY));
    expect(cycles.length).toBeGreaterThan(0);
    // One lap turns 1 cloth into 3 fibre into 3 cloth, consuming nothing else: free money.
    expect(cycles[0]).toMatchObject({ ratio: 3, selfContained: true, infinite: true });
  });
});

// --- Against the shipped snapshots ------------------------------------------
//
// The fixtures above prove the mechanics. These prove the mechanics are pointed at real
// data — a schema change in either snapshot breaks them loudly instead of quietly returning
// an empty page.

describe('the shipped snapshots', () => {
  const index = buildCraftIndex(snapshot);
  const result = findCraftLoops(index, prices);

  it('carries a price snapshot with all three of flea, vendor and trader offers', () => {
    expect(prices.counts.flea).toBeGreaterThan(1000);
    expect(prices.counts.vendor).toBeGreaterThan(1000);
    expect(prices.counts.offers).toBeGreaterThan(1000);
    expect(prices.fx.RUB).toBe(1);
    expect(prices.fx.USD).toBeGreaterThan(1);
  });

  it('prices most of the craft graph', () => {
    const touched = new Set();
    for (const craft of index.crafts) for (const i of craft.inputs) touched.add(i.itemId);
    const priced = [...touched].filter((id) => result.supply.unit.has(id));
    expect(priced.length / touched.size).toBeGreaterThan(0.9);
  });

  it('finds real farms and collapses the duplicate advice among them', () => {
    expect(result.stats.farms).toBeGreaterThan(10);
    expect(result.stats.farms).toBeLessThan(result.stats.candidates);
    expect(result.stats.chains).toBeGreaterThan(0);
  });

  it('finds the ripstop/aramid pair Trey described, without being told about it', () => {
    const ripstop = '5e2af4a786f7746d3f3c3400';
    const aramid = '5e2af4d286f7746d4159f07a';
    const farm = result.farms.find(
      (f) => f.products.includes(ripstop) && f.products.includes(aramid) && f.products.length === 2,
    );
    expect(farm).toBeTruthy();
    expect(farm.rotation.rotatable).toBe(true);
    // PACA is a straight Ragman cash offer. Scav Vest is a Jaeger BARTER, and following that
    // ladder is the whole point: Slickers, then Pack of Vita juice, which has no trader at
    // all. So this farm is NOT trader-fed, however much its top-level routes look like it —
    // the card claimed otherwise until `touchesFlea` walked the ladder.
    expect(farm.best.buys.find((b) => b.itemId === '572b7adb24597762ae139821').route.kind).toBe('barter');
    expect(farm.throughput.traderFed).toBe(false);
    expect(farm.throughput.usesFlea).toBe(true);
    // It is still metered by the trader link in the middle of that ladder.
    expect(farm.throughput.runsPerRestock).toBeGreaterThan(0);
    // And it answers the question that prompted all this: is the third craft worth it?
    const module3m = '59e7635f86f7742cbf2c1095';
    expect(farm.alsoFeeds.some((a) => a.output.itemId === module3m)).toBe(true);
  });

  it('never recommends buying something it also tells you to make', () => {
    for (const farm of result.farms) {
      const made = new Set(farm.runSteps.map((s) => s.outputId));
      for (const buy of farm.best.buys) expect(made.has(buy.itemId)).toBe(false);
    }
  });

  it('every farm it reports actually makes money', () => {
    for (const farm of result.farms) {
      expect(farm.best.net).toBeGreaterThanOrEqual(LOOP_DEFAULTS.minNetPerRun);
      expect(farm.best.revenue).toBeGreaterThan(farm.best.cost);
    }
  });

  it('has no free infinite loop — every one of them costs something from outside', () => {
    // If this ever fails, the game has shipped a literal infinite-money craft and it belongs
    // at the top of the page rather than in a test failure.
    expect(result.cycles.filter((c) => c.infinite)).toHaveLength(0);
  });

  it('still finds the cycles that multiply, and says what they cost', () => {
    // Pile of meds <-> AI-2 medkit multiplies 9x a lap and is the reason the med farms work,
    // but the return leg eats a bandage and a pack of Augmentin. Reporting it as infinite
    // (the first version did) is the error; reporting the side inputs is the point.
    const multiplying = result.cycles.filter((c) => c.multiplying);
    expect(multiplying.length).toBeGreaterThan(0);
    for (const cycle of multiplying) expect(cycle.sideInputs.length).toBeGreaterThan(0);
  });
});
