import { describe, it, expect } from 'vitest';
import { buildPriceSnapshot, deriveFx } from './eftPriceBuild';

const USD = '5696686a4bdc2da3298b456a';
const overview = {
  items: [
    { tarkovId: 'bolts', latestPriceSample: { robustAvgPrice: 42872.4, minPrice: 40000, listingCount: 9, sampleTimeEpoch: 1000 }, handbook: [{ name: 'Barter items' }], traderPrices: [] },
    { tarkovId: 'gun', latestPriceSample: { robustAvgPrice: 900000, minPrice: 1 }, handbook: [{ name: 'Weapons' }], traderPrices: [{ nickname: 'Peacekeeper', loyalties: [{ level: 2, price_rub: 500 }, { level: 4, price_rub: 700 }] }] },
    { tarkovId: 'nosample', handbook: [], traderPrices: [] },
  ],
};
const assort = {
  lastScannedEpoch: 2000,
  data: [
    { items: [{ _tpl: 'bolts', upd: { StackObjectsCount: 1 } }], user: { id: 't1' }, requirements: [{ _tpl: USD, count: 2 }], requirementsCost: 340, loyaltyLevel: 2, unlimitedCount: true },
  ],
};

describe('buildPriceSnapshot', () => {
  const snap = buildPriceSnapshot({ mode: 'pve', overview, assort, traderName: new Map([['t1', 'Peacekeeper']]) });

  it('derives FX from the offers and stamps the upstream scan times', () => {
    expect(snap.fx.USD).toBe(170);
    expect(snap.scannedAt).toEqual({ flea: 1000, traders: 2000 });
  });

  it('flags weapon flea averages as build-priced and keeps the best trader sell-back', () => {
    expect(snap.flea.gun[3] & 4).toBe(4);
    expect(snap.flea.bolts).toEqual([42872, 40000, 9, 0, 0]);
    expect(snap.vendor.gun).toEqual([700, 'Peacekeeper', 4]);
    expect(snap.counts.noFleaSample).toBe(1);
  });

  it('rejects an empty payload rather than writing an empty snapshot', () => {
    expect(() => buildPriceSnapshot({ mode: 'pve', overview: { items: [] }, assort: { data: [] }, traderName: new Map() })).toThrow();
  });

  it('leaves a currency without a cash offer unrated', () => {
    expect(deriveFx([]).USD).toBeUndefined();
  });
});
