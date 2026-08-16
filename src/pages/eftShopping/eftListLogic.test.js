import { describe, it, expect } from 'vitest';

import {
  buildItemPool, searchPool, addToList, updateEntry, removeEntry,
  setHave, setNeed, listTotals, listAsText, newEntry,
} from './eftListLogic';

const items = {
  aaa: { id: 'aaa', name: 'Salewa first aid kit', shortName: 'Salewa' },
  bbb: { id: 'bbb', name: 'Physical bitcoin', shortName: 'BTC' },
  ccc: { id: 'ccc', name: 'Power cord', shortName: 'Cord' },
};

const questIndex = {
  quests: [
    { id: 'q1', items: [{ itemId: 'zzz', name: 'Crickent lighter', count: 1 }] },
    // Already in the hideout table — must not produce a second entry.
    { id: 'q2', items: [{ itemId: 'aaa', name: 'Salewa first aid kit', count: 2 }] },
  ],
};

const ammo = { calibers: [{ caliber: '5.56x45', rounds: [{ name: 'M995', shortName: 'M995' }] }] };

const pool = buildItemPool(items, { questIndex, ammo });

describe('buildItemPool', () => {
  it('unions the hideout table, quest items and ammo', () => {
    expect(pool.map((p) => p.name).sort()).toEqual([
      'Crickent lighter', 'M995', 'Physical bitcoin', 'Power cord', 'Salewa first aid kit',
    ]);
  });

  it('does not duplicate an item that is both a hideout and a quest need', () => {
    expect(pool.filter((p) => p.itemId === 'aaa')).toHaveLength(1);
  });

  it('reaches items the hideout snapshot has never heard of', () => {
    // The whole reason the pool is a union: a Crickent lighter is a barter item,
    // no station wants one, and it was the literal example asked for.
    expect(pool.find((p) => p.name === 'Crickent lighter')?.itemId).toBe('zzz');
  });

  it('carries ammo without an id rather than dropping it', () => {
    const round = pool.find((p) => p.name === 'M995');
    expect(round.itemId).toBeNull();
    expect(round.kind).toBe('ammo');
  });
});

describe('searchPool', () => {
  it('says nothing until there is something to go on', () => {
    expect(searchPool(pool, 's')).toEqual([]);
    expect(searchPool(pool, '')).toEqual([]);
  });

  it('puts a prefix match above a mid-word one', () => {
    const hits = searchPool(pool, 'co');
    expect(hits[0].name).toBe('Power cord'); // "Cord" short name starts with it
  });

  it('matches on the short name too', () => {
    expect(searchPool(pool, 'btc').map((h) => h.name)).toEqual(['Physical bitcoin']);
  });

  it('is case insensitive', () => {
    expect(searchPool(pool, 'SALEWA')).toHaveLength(1);
  });

  it('honours the limit', () => {
    expect(searchPool(pool, 'o', { limit: 2 }).length).toBeLessThanOrEqual(2);
  });
});

describe('addToList', () => {
  it('adds a new row', () => {
    const list = addToList([], { itemId: 'aaa', name: 'Salewa first aid kit' });
    expect(list).toHaveLength(1);
    expect(list[0].need).toBe(1);
  });

  it('bumps the count instead of making a second row for the same item', () => {
    let list = addToList([], { itemId: 'aaa', name: 'Salewa first aid kit' });
    list = addToList(list, { itemId: 'aaa', name: 'Salewa first aid kit' });
    expect(list).toHaveLength(1);
    expect(list[0].need).toBe(2);
  });

  it('matches free-text rows by name, case insensitively', () => {
    let list = addToList([], { itemId: null, name: 'Bandage' });
    list = addToList(list, { itemId: null, name: 'bandage' });
    expect(list).toHaveLength(1);
    expect(list[0].need).toBe(2);
  });

  it('keeps two different items apart even when one has no id', () => {
    let list = addToList([], { itemId: 'aaa', name: 'Salewa first aid kit' });
    list = addToList(list, { itemId: null, name: 'Salewa first aid kit' });
    expect(list).toHaveLength(2);
  });

  it('gives every row a distinct id so duplicates never share a React key', () => {
    const list = [
      ...addToList([], { itemId: 'aaa', name: 'A' }),
      ...addToList([], { itemId: 'bbb', name: 'B' }),
    ];
    expect(new Set(list.map((r) => r.id)).size).toBe(2);
  });
});

describe('editing', () => {
  const base = () => [newEntry({ itemId: 'aaa', name: 'Salewa', need: 3 })];

  it('sets have without letting it go negative', () => {
    const list = setHave(base(), base()[0].id, -5);
    expect(list[0].have).toBe(0);
  });

  it('lets have exceed need, because overshooting is real information', () => {
    const rows = base();
    expect(setHave(rows, rows[0].id, 9)[0].have).toBe(9);
  });

  it('never lets need drop below one', () => {
    const rows = base();
    expect(setNeed(rows, rows[0].id, 0)[0].need).toBe(1);
    expect(setNeed(rows, rows[0].id, -3)[0].need).toBe(1);
  });

  it('edits a note without touching anything else', () => {
    const rows = base();
    const next = updateEntry(rows, rows[0].id, { note: 'trade for fuel' });
    expect(next[0].note).toBe('trade for fuel');
    expect(next[0].need).toBe(3);
  });

  it('removes only the row asked for', () => {
    const rows = [...base(), newEntry({ itemId: 'bbb', name: 'BTC' })];
    expect(removeEntry(rows, rows[0].id).map((r) => r.name)).toEqual(['BTC']);
  });

  it('survives being handed nothing', () => {
    expect(removeEntry(undefined, 'x')).toEqual([]);
    expect(updateEntry(null, 'x', { note: 'a' })).toEqual([]);
  });
});

describe('listTotals', () => {
  it('counts a row done once have reaches need', () => {
    const rows = [
      newEntry({ name: 'A', need: 2, have: 2 }),
      newEntry({ name: 'B', need: 3, have: 1 }),
    ];
    expect(listTotals(rows)).toEqual({ rows: 2, done: 1, outstanding: 1, unitsShort: 2 });
  });

  it('does not let an overshoot make the shortfall negative', () => {
    expect(listTotals([newEntry({ name: 'A', need: 1, have: 5 })]).unitsShort).toBe(0);
  });

  it('handles an empty list', () => {
    expect(listTotals([]).rows).toBe(0);
  });
});

describe('listAsText', () => {
  it('writes the shortfall and the note, and ticks what is done', () => {
    const text = listAsText('My list', [
      newEntry({ name: 'Zibbo lighter', need: 2, have: 0, note: 'trade for fuel' }),
      newEntry({ name: 'Salewa', need: 1, have: 1 }),
    ]);
    expect(text).toContain('2 x Zibbo lighter   — trade for fuel');
    expect(text).toContain('✓ x Salewa');
  });
});
