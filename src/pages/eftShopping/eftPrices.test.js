import { describe, it, expect } from 'vitest';

import snapshot from './data/hideoutSnapshot.json';
import pve from './data/prices/pve.json';
import regular from './data/prices/regular.json';
import { priceFieldsFrom, applyPrices, priceAge, FLEA_VENDOR } from './eftPrices';
import { unitCost, traderBeatsFlea } from './eftHideoutLogic';

const RUB = 'RUB';

const fixture = (over = {}) => ({
  mode: 'test',
  generatedAt: '2026-09-11T00:00:00.000Z',
  scannedAt: { flea: 1789000000, traders: 1789000100 },
  fx: { RUB: 1, USD: 100 },
  traders: ['Ragman', 'Peacekeeper'],
  flea: {
    cloth: [300, 250, 40, 0, 0],
    gun: [900000, 800000, 60, 4, 0],
    wobbly: [500, 400, 3, 3, 15],
    ...over.flea,
  },
  vendor: {
    cloth: [80, 'Therapist', 1],
    nosample: [42, 'Prapor', 2],
    ...over.vendor,
  },
  offers: over.offers || [
    ['cloth', 0, 1, 1, 1, 6, [[RUB, 260]]],
    ['cloth', 0, 2, 1, 1, 6, [[RUB, 240]]],
    ['dollars', 1, 1, 1, 1, 6, [['USD', 3]]],
    ['bartered', 0, 1, 1, 1, 6, [['cloth', 2]]],
  ],
});

describe('priceFieldsFrom', () => {
  it('translates the snapshot into the field names the rest of the app speaks', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('cloth')).toMatchObject({
      fleaAvailable: true,
      avg24hPrice: 300,
      lastLowPrice: 250,
      fleaBuy: { price: 300, vendor: FLEA_VENDOR },
      fleaListings: 40,
      bestTraderSell: { price: 80, vendor: 'Therapist', level: 1 },
    });
  });

  it('prices fleaBuy at the average, not the cheapest listing', () => {
    // unitCost() reads fleaBuy first and feeds the shopping-list estimate. The single
    // cheapest listing is a snipe, not a price you can plan a stack of ten on.
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('cloth').fleaBuy.price).toBe(300);
    expect(byItem.get('cloth').fleaBuy.price).not.toBe(250);
  });

  it('takes the cheapest cash offer across loyalty levels for bestTraderBuy', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('cloth').bestTraderBuy).toMatchObject({ price: 240, vendor: 'Ragman', level: 2 });
  });

  it('converts a foreign-currency offer at the derived rate', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('dollars').bestTraderBuy).toMatchObject({ price: 300, vendor: 'Peacekeeper' });
  });

  it('skips an offer in a currency with no derived rate rather than pricing it at 1', () => {
    const { byItem } = priceFieldsFrom(fixture({
      offers: [['euros', 0, 1, 1, 1, 6, [['EUR', 250]]]],
    }));
    expect(byItem.get('euros')?.bestTraderBuy).toBeUndefined();
  });

  it('quotes no trader-buy price for a barter, because money will not buy it', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('bartered')?.bestTraderBuy).toBeUndefined();
  });

  it('carries the trust flags rather than presenting every price as equal', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('gun').fleaBuildPriced).toBe(true);
    expect(byItem.get('wobbly')).toMatchObject({
      fleaStale: true, fleaLowConfidence: true, fleaLevelRequirement: 15,
    });
  });

  it('still records a trader-sell price for an item with no flea sample', () => {
    const { byItem } = priceFieldsFrom(fixture());
    expect(byItem.get('nosample')).toMatchObject({ bestTraderSell: { price: 42 } });
    expect(byItem.get('nosample').avg24hPrice).toBeUndefined();
  });

  it('survives a missing snapshot instead of throwing', () => {
    expect(priceFieldsFrom(null).byItem.size).toBe(0);
    expect(priceFieldsFrom({}).byItem.size).toBe(0);
  });
});

describe('applyPrices', () => {
  const base = {
    generatedAt: '2026-09-01T00:00:00.000Z',
    gaps: ['prices', 'itemSize'],
    items: {
      cloth: { id: 'cloth', name: 'Cloth', basePrice: 10, fleaAvailable: true },
      unknown: { id: 'unknown', name: 'Unknown', basePrice: 5, fleaAvailable: true },
    },
  };

  it('does not mutate the imported snapshot module', () => {
    // It is shared for the whole session, so a mutation here leaks one economy's prices
    // into the other the moment someone flips the game-mode switch.
    const before = JSON.stringify(base);
    applyPrices(base, fixture());
    expect(JSON.stringify(base)).toBe(before);
  });

  it('merges onto known items and leaves unknown ones alone', () => {
    const out = applyPrices(base, fixture());
    expect(out.items.cloth.avg24hPrice).toBe(300);
    expect(out.items.cloth.basePrice).toBe(10);
    expect(out.items.unknown.avg24hPrice).toBeUndefined();
    expect(out.prices.priced).toBe(1);
  });

  it('does not widen the item map with the thousands of ids it has prices for', () => {
    // `items` is the craft graph's universe and the search pool derived from it.
    const out = applyPrices(base, fixture());
    expect(Object.keys(out.items).sort()).toEqual(['cloth', 'unknown']);
  });

  it('stops listing prices as a gap once it has them', () => {
    expect(applyPrices(base, fixture()).gaps).toEqual(['itemSize']);
    expect(applyPrices(base, null).gaps).toEqual(['prices', 'itemSize']);
  });

  it('never lowers fleaAvailable to false on an item it has no sample for', () => {
    // 1,151 items have no flea sample and "no sample" is not "flea-banned". Three views
    // truthy-check this field to print a "No flea" / "Flea-banned" chip.
    const out = applyPrices(base, fixture());
    expect(out.items.unknown.fleaAvailable).toBe(true);
    const banned = applyPrices(
      { ...base, items: { unknown: { id: 'unknown', fleaAvailable: false } } },
      fixture(),
    );
    expect(banned.items.unknown.fleaAvailable).toBe(false);
  });

  it('hands a missing snapshot straight back', () => {
    expect(applyPrices(base, null)).toBe(base);
  });

  it('reports the upstream scan time, not when we fetched it', () => {
    const out = applyPrices(base, fixture());
    expect(priceAge(out.prices)).toBe(1789000000 * 1000);
  });
});

// --- Against the shipped snapshots ------------------------------------------

describe('the shipped price snapshots', () => {
  it('ships both economies, and they are genuinely different markets', () => {
    expect(pve.mode).toBe('pve');
    expect(regular.mode).toBe('regular');
    // Bolts. If these ever match, one of the two files was built with the wrong gameType.
    const bolts = '57347c5b245977448d35f6e1';
    expect(pve.flea[bolts]?.[0]).toBeGreaterThan(0);
    expect(pve.flea[bolts][0]).not.toBe(regular.flea[bolts][0]);
  });

  it('lights up the price fields every other view was already written against', () => {
    const out = applyPrices(snapshot, pve);
    // The flag the shell uses to decide whether to apologise for having no prices.
    expect(Object.values(out.items).some((i) => i.avg24hPrice != null)).toBe(true);
    expect(out.prices.priced).toBeGreaterThan(200);
  });

  it('gives unitCost() a real number instead of the handbook floor', () => {
    const out = applyPrices(snapshot, pve);
    const ripstop = out.items['5e2af4a786f7746d3f3c3400'];
    expect(unitCost(ripstop)).toBe(ripstop.avg24hPrice);
    expect(unitCost(ripstop)).toBeGreaterThan(ripstop.basePrice);
  });

  it('lets traderBeatsFlea() find a trader actually undercutting the flea', () => {
    const out = applyPrices(snapshot, pve);
    const wins = Object.values(out.items).filter((i) => traderBeatsFlea(i));
    expect(wins.length).toBeGreaterThan(10);
    for (const item of wins) expect(item.bestTraderBuy.price).toBeLessThan(unitCost(item));
  });

  it('prices most of what the hideout actually asks you for', () => {
    const out = applyPrices(snapshot, pve);
    const needed = new Set();
    for (const station of out.stations || []) {
      for (const level of station.levels || []) {
        for (const req of level.itemRequirements || []) needed.add(req.itemId);
      }
    }
    const priced = [...needed].filter((id) => unitCost(out.items[id]) > 0);
    expect(priced.length / needed.size).toBeGreaterThan(0.9);
  });
});
