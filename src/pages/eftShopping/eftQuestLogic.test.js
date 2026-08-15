import { describe, it, expect } from 'vitest';

import {
  buildQuestIndex, questByName, questNeedsForItem, questTree, questGate,
  prerequisiteIds, toggleQuestDone, isQuestDone, traderProgress, searchQuests,
  questItems,
} from './eftQuestLogic';
import realIndex from './data/questIndex.json';

// A hand-built chain: Alpha -> Bravo -> Charlie, with Bravo and Charlie both
// wanting the same item so the "x of y done" maths has something to count.
const FIXTURE = {
  generatedAt: '2026-08-15T00:00:00.000Z',
  source: 'test',
  sourceNote: 'fixture',
  questCount: 3,
  quests: [
    {
      id: 'alpha',
      name: 'Alpha',
      trader: 'Prapor',
      minLevel: null,
      loyalty: [{ trader: 'Prapor', level: 1 }],
      previous: [],
      leadsTo: ['Bravo'],
      related: [],
      kappa: true,
      items: [],
      wikiUrl: 'https://example.test/Alpha',
    },
    {
      id: 'bravo',
      name: 'Bravo',
      trader: 'Prapor',
      minLevel: 5,
      loyalty: [],
      previous: ['Alpha'],
      leadsTo: ['Charlie'],
      related: [],
      kappa: false,
      items: [
        { itemId: 'item-bolt', name: 'Bolt', count: 2, foundInRaid: true, unresolved: false },
        { itemId: null, name: 'Mystery Folder', count: 1, foundInRaid: false, unresolved: true },
      ],
      wikiUrl: 'https://example.test/Bravo',
    },
    {
      id: 'charlie',
      name: 'Charlie',
      trader: 'Therapist',
      minLevel: 12,
      loyalty: [],
      previous: ['Bravo'],
      leadsTo: ['Ghost Quest'],
      related: [],
      kappa: true,
      items: [{ itemId: 'item-bolt', name: 'Bolt', count: 3, foundInRaid: false, unresolved: false }],
      wikiUrl: 'https://example.test/Charlie',
    },
  ],
};

const index = buildQuestIndex(FIXTURE);

describe('buildQuestIndex', () => {
  it('indexes quests by id and by normalized name', () => {
    expect(index.byId.get('bravo').name).toBe('Bravo');
    expect(questByName(index, 'bravo').id).toBe('bravo');
    expect(questByName(index, 'BRAVO').id).toBe('bravo');
  });

  it('indexes every quest that wants an item, under that item', () => {
    expect(index.byItemId.get('item-bolt').map((r) => r.questId)).toEqual(['bravo', 'charlie']);
  });

  it('keys items with no template id by name so they are still reachable', () => {
    expect(index.byItemId.get('name:mystery folder')).toHaveLength(1);
  });

  it('carries the source metadata through', () => {
    expect(index.meta.source).toBe('test');
    expect(index.meta.questCount).toBe(3);
  });
});

describe('questNeedsForItem', () => {
  it('counts every quest wanting the item when none are done', () => {
    const s = questNeedsForItem(index, 'item-bolt', []);
    expect(s.total).toBe(2);
    expect(s.done).toBe(0);
    expect(s.remaining).toBe(2);
    expect(s.needRemaining).toBe(5);
  });

  it('moves a quest from remaining to done when it is ticked', () => {
    const s = questNeedsForItem(index, 'item-bolt', ['bravo']);
    expect(s.done).toBe(1);
    expect(s.remaining).toBe(1);
    // Only Charlie's 3 are still owed.
    expect(s.needRemaining).toBe(3);
  });

  it('reports nothing outstanding once every quest is done', () => {
    const s = questNeedsForItem(index, 'item-bolt', ['bravo', 'charlie']);
    expect(s.remaining).toBe(0);
    expect(s.needRemaining).toBe(0);
    expect(s.total).toBe(2);
  });

  it('sorts outstanding quests above completed ones', () => {
    const s = questNeedsForItem(index, 'item-bolt', ['bravo']);
    expect(s.rows.map((r) => r.quest.id)).toEqual(['charlie', 'bravo']);
  });

  it('flags a found-in-raid requirement only while that quest is open', () => {
    expect(questNeedsForItem(index, 'item-bolt', []).firRemaining).toBe(true);
    expect(questNeedsForItem(index, 'item-bolt', ['bravo']).firRemaining).toBe(false);
  });

  it('reports the lowest level gate still ahead of you', () => {
    expect(questNeedsForItem(index, 'item-bolt', []).nextLevel).toBe(5);
    expect(questNeedsForItem(index, 'item-bolt', ['bravo']).nextLevel).toBe(12);
  });

  it('returns an empty summary for an item no quest wants', () => {
    expect(questNeedsForItem(index, 'item-nothing', []).total).toBe(0);
  });

  it('accepts a Set as well as an array for the done list', () => {
    expect(questNeedsForItem(index, 'item-bolt', new Set(['bravo'])).done).toBe(1);
  });
});

describe('questTree', () => {
  it('walks the previous chain all the way back', () => {
    const tree = questTree(index, 'charlie');
    expect(tree.previous[0].quest.id).toBe('bravo');
    expect(tree.previous[0].previous[0].quest.id).toBe('alpha');
  });

  it('resolves leads-to links to real quests', () => {
    expect(questTree(index, 'alpha').leadsTo.map((q) => q.id)).toEqual(['bravo']);
  });

  it('keeps unresolvable follow-ups so they can still be named', () => {
    expect(questTree(index, 'charlie').leadsToUnknown).toEqual(['Ghost Quest']);
  });

  it('returns null for an unknown quest', () => {
    expect(questTree(index, 'nope')).toBeNull();
  });

  it('does not loop forever on a circular previous chain', () => {
    const looped = buildQuestIndex({
      quests: [
        { id: 'a', name: 'A', previous: ['B'], leadsTo: [], items: [] },
        { id: 'b', name: 'B', previous: ['A'], leadsTo: [], items: [] },
      ],
    });
    expect(() => questTree(looped, 'a')).not.toThrow();
    expect(questTree(looped, 'a').previous[0].quest.id).toBe('b');
  });
});

describe('prerequisiteIds', () => {
  it('lists every quest above one, nearest first', () => {
    expect(prerequisiteIds(index, 'charlie')).toEqual(['bravo', 'alpha']);
  });

  it('is empty for a quest with no prerequisites', () => {
    expect(prerequisiteIds(index, 'alpha')).toEqual([]);
  });
});

describe('questGate', () => {
  it('describes a level gate', () => {
    expect(questGate(index, index.byId.get('bravo')).map((l) => l.text))
      .toContain('Player level 5');
  });

  it('describes a loyalty gate', () => {
    expect(questGate(index, index.byId.get('alpha')).map((l) => l.text))
      .toContain('Prapor LL1');
  });

  it('links a prerequisite quest to its record', () => {
    const line = questGate(index, index.byId.get('charlie')).find((l) => l.kind === 'quest');
    expect(line.quest.id).toBe('bravo');
  });

  it('says so when a quest has no gate at all', () => {
    const bare = buildQuestIndex({ quests: [{ id: 'z', name: 'Z', previous: [], leadsTo: [], items: [] }] });
    expect(questGate(bare, bare.byId.get('z'))[0].kind).toBe('none');
  });
});

describe('completion list', () => {
  it('adds a quest that was not there', () => {
    expect(toggleQuestDone([], 'bravo')).toEqual(['bravo']);
  });

  it('removes one that was', () => {
    expect(toggleQuestDone(['bravo', 'charlie'], 'bravo')).toEqual(['charlie']);
  });

  it('does not mutate the list it was given', () => {
    const before = ['bravo'];
    toggleQuestDone(before, 'charlie');
    expect(before).toEqual(['bravo']);
  });

  it('reads membership from an array or a Set', () => {
    expect(isQuestDone(['bravo'], 'bravo')).toBe(true);
    expect(isQuestDone(new Set(['bravo']), 'charlie')).toBe(false);
  });
});

describe('traderProgress', () => {
  it('counts done against total per trader', () => {
    const rows = traderProgress(index, ['bravo']);
    expect(rows.find((r) => r.trader === 'Prapor')).toMatchObject({ total: 2, done: 1 });
    expect(rows.find((r) => r.trader === 'Therapist')).toMatchObject({ total: 1, done: 0 });
  });
});

describe('searchQuests', () => {
  it('ignores a query shorter than two characters', () => {
    expect(searchQuests(index, 'a')).toEqual([]);
  });

  it('matches on quest name', () => {
    expect(searchQuests(index, 'brav').map((q) => q.id)).toEqual(['bravo']);
  });

  it('matches on trader name', () => {
    expect(searchQuests(index, 'therapist').map((q) => q.id)).toEqual(['charlie']);
  });
});

describe('questItems', () => {
  it('prefers the real item name over the wiki link text', () => {
    const rows = questItems(index.byId.get('bravo'), { 'item-bolt': { name: 'Bolts' } });
    expect(rows[0].name).toBe('Bolts');
  });

  it('falls back to the wiki name when the item is unknown', () => {
    expect(questItems(index.byId.get('bravo'), {})[1].name).toBe('Mystery Folder');
  });
});

// --- the real, shipped snapshot -------------------------------------------
// These guard the scraper, not the maths: if a wiki change or a parser
// regression guts the data, the numbers here move well before anyone notices
// in the UI.

describe('the shipped quest index', () => {
  const live = buildQuestIndex(realIndex);

  it('has the full quest list', () => {
    expect(live.quests.length).toBeGreaterThan(800);
  });

  it('parsed no page into an empty name', () => {
    expect(live.quests.every((q) => q.name && q.name.trim())).toBe(true);
  });

  it('knows which quests want an item', () => {
    expect(live.byItemId.size).toBeGreaterThan(300);
  });

  it('resolved most item requirements to a real template id', () => {
    const all = live.quests.flatMap((q) => q.items);
    const resolved = all.filter((i) => i.itemId).length;
    expect(resolved / all.length).toBeGreaterThan(0.8);
  });

  it('counts "find N then hand over N" once, not twice', () => {
    // Shortage is the canonical shape: "Find 3 ... in raid" + "Hand over the 3".
    const shortage = questByName(live, 'Shortage');
    expect(shortage.items).toHaveLength(1);
    expect(shortage.items[0].count).toBe(3);
    expect(shortage.items[0].foundInRaid).toBe(true);
  });

  it('reads a level gate off the requirements prose', () => {
    expect(questByName(live, 'The Extortionist').minLevel).toBe(7);
  });

  it('links quests into a chain', () => {
    const tree = questTree(live, questByName(live, 'The Extortionist').id);
    expect(tree.previous.length).toBeGreaterThan(0);
  });

  it('did not truncate objectives at a capital Z', () => {
    // Regression guard: the first version of the scraper used `\Z` in a JS
    // regex, which is a literal Z, and cut "[[Ground Zero]]" in half.
    const debut = questByName(live, 'Debut');
    expect(debut).toBeTruthy();
    const bad = live.quests.filter((q) => /\bZ$/.test(q.name));
    expect(bad).toHaveLength(0);
  });

  it('kept no currency or map as an item requirement', () => {
    const names = live.quests.flatMap((q) => q.items.map((i) => i.name.toLowerCase()));
    expect(names).not.toContain('customs');
    expect(names).not.toContain('roubles');
  });
});
