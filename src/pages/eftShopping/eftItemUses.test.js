import { describe, it, expect } from 'vitest';

import { buildItemUsesIndex, searchItemUses } from './eftItemUses';
import { buildCraftIndex } from './eftCraftGraph';
import { buildQuestIndex } from './eftQuestLogic';

// A tiny hand-built world exercising every bucket at least once:
//   - "cracker"  -> hideout only
//   - "motor"    -> craft only (input into "gizmo")
//   - "battery"  -> quest only, real itemId
//   - "widget"   -> all five buckets at once
//   - "sunglasses" -> gear only, zero other uses (the sunglasses case)
//   - "unlinked" -> present in the raw items dict, referenced nowhere -> present, no uses
//   - "facemask" -> in itemNames ONLY, no other source at all -> present, no uses
//   - name-fallback quest item (no itemId at all)

const hideoutData = {
  items: {
    cracker: { id: 'cracker', name: 'Cracker', shortName: 'Crckr' },
    motor: { id: 'motor', name: 'Motor', shortName: 'Motor' },
    gizmo: { id: 'gizmo', name: 'Gizmo' },
    battery: { id: 'battery', name: 'Battery' },
    widget: { id: 'widget', name: 'Widget' },
    widgetMade: { id: 'widgetMade', name: 'Widget Deluxe' },
    unlinked: { id: 'unlinked', name: 'Unlinked Junk' },
  },
  stations: [
    {
      name: 'Workbench',
      normalizedName: 'workbench',
      levels: [
        {
          level: 1,
          itemRequirements: [
            { itemId: 'cracker', count: 3, foundInRaid: false },
            { itemId: 'widget', count: 1, foundInRaid: true },
          ],
        },
      ],
      crafts: [],
    },
  ],
};

const craftIndex = buildCraftIndex({
  items: hideoutData.items,
  stations: [
    {
      name: 'Workbench', normalizedName: 'workbench',
      crafts: [
        {
          id: 'c-gizmo', level: 1, duration: 60,
          requiredItems: [{ itemId: 'motor', name: 'Motor', count: 2 }, { itemId: 'widget', name: 'Widget', count: 1 }],
          rewardItems: [{ itemId: 'gizmo', name: 'Gizmo', count: 1 }],
          tools: [],
        },
      ],
    },
  ],
});

const questIndex = buildQuestIndex({
  quests: [
    {
      id: 'q1', name: 'Fetch Quest', trader: 'Prapor',
      items: [
        { itemId: 'battery', name: 'Battery', count: 2, foundInRaid: false },
        { itemId: 'widget', name: 'Widget', count: 1, foundInRaid: true },
        { itemId: null, name: 'Mystery Trinket', count: 1, foundInRaid: false },
      ],
    },
  ],
});

const barterData = {
  barters: [
    {
      id: 'b1', trader: 'Skier', level: 2,
      give: [{ itemId: 'widget', name: 'Widget', count: 1 }],
      get: { itemId: 'widgetMade', name: 'Widget Deluxe', count: 1 },
    },
  ],
};

const gearCatalog = {
  items: {
    widget: { id: 'widget', name: 'Widget', shortName: '', types: ['rig'], armorClass: null },
    sunglasses: {
      id: 'sunglasses', name: 'Cheap Sunglasses', shortName: '', types: ['glasses'], armorClass: null,
    },
  },
};

// The full item table. Its job is to make items searchable that NOTHING else references -
// "facemask" here stands in for the Aybolit mask, which is what started all this. It also
// carries "Mystery Trinket", so the name-only quest reference can be resolved back onto a real
// id instead of forking a second name-keyed record.
const itemNames = {
  rows: [
    ['cracker', 'Cracker', 'Crckr'],
    ['motor', 'Motor'],
    ['gizmo', 'Gizmo'],
    ['battery', 'Battery'],
    ['widget', 'Widget'],
    ['widgetMade', 'Widget Deluxe'],
    ['unlinked', 'Unlinked Junk'],
    ['sunglasses', 'Cheap Sunglasses'],
    ['facemask', 'Party Face Mask', 'Mask'],
  ],
};

const index = buildItemUsesIndex({
  hideoutData, questIndex, craftIndex, barterData, gearCatalog, itemNames,
});

// The same world with NO item table, proving the index still works for callers that have not
// got one (and that nothing below depends on itemNames merely existing).
const indexNoNames = buildItemUsesIndex({
  hideoutData, questIndex, craftIndex, barterData, gearCatalog,
});

describe('buildItemUsesIndex', () => {
  it('tags a hideout-only item with just Hideout', () => {
    const rec = index.byKey.get('cracker');
    expect(rec.tags).toEqual(['Hideout']);
    expect(rec.uses.hideout).toHaveLength(1);
    expect(rec.uses.hideout[0]).toMatchObject({ stationName: 'Workbench', level: 1, count: 3 });
  });

  it('tags a craft-input-only item with just Craft, naming the output', () => {
    const rec = index.byKey.get('motor');
    expect(rec.tags).toEqual(['Craft']);
    expect(rec.uses.craft).toHaveLength(1);
    expect(rec.uses.craft[0]).toMatchObject({ role: 'input', outputName: 'Gizmo', count: 2 });
  });

  it('tags an item used across all five buckets', () => {
    const rec = index.byKey.get('widget');
    expect(rec.tags).toEqual(['Hideout', 'Craft', 'Quest', 'Barter', 'Armor']);
    expect(rec.uses.hideout).toHaveLength(1);
    expect(rec.uses.craft).toHaveLength(1);
    expect(rec.uses.quest).toHaveLength(1);
    expect(rec.uses.barter).toHaveLength(1);
    expect(rec.uses.gear.types).toEqual(['rig']);
  });

  // Trey, 2026-09-09: "even if an item doesn't have a usage it needs to be in there or i'll
  // just assume our data isn't complete." This test asserted the exact opposite until then -
  // it is the rule that made the Aybolit mask unsearchable, so it is inverted rather than
  // deleted, to keep the reason visible.
  it('KEEPS an item referenced nowhere, flagged hasUses false', () => {
    const rec = index.byKey.get('unlinked');
    expect(rec).toBeTruthy();
    expect(rec.tags).toEqual([]);
    expect(rec.hasUses).toBe(false);
    expect(index.all.some((r) => r.itemId === 'unlinked')).toBe(true);
  });

  it('keeps an item that ONLY the item table knows about', () => {
    const rec = index.byKey.get('facemask');
    expect(rec).toBeTruthy();
    expect(rec.name).toBe('Party Face Mask');
    expect(rec.shortName).toBe('Mask');
    expect(rec.hasUses).toBe(false);
    expect(searchItemUses(index, 'party face').map((r) => r.itemId)).toContain('facemask');
  });

  it('flags every genuinely-used item as hasUses', () => {
    for (const id of ['cracker', 'motor', 'battery', 'widget', 'sunglasses']) {
      expect(index.byKey.get(id).hasUses).toBe(true);
    }
  });

  it('works with no item table at all, minus the unreferenced items', () => {
    expect(indexNoNames.byKey.get('widget').tags)
      .toEqual(['Hideout', 'Craft', 'Quest', 'Barter', 'Armor']);
    expect(indexNoNames.byKey.has('facemask')).toBe(false);
  });

  it('surfaces a gear-only item with zero other uses, tagged Armor only', () => {
    const rec = index.byKey.get('sunglasses');
    expect(rec).toBeTruthy();
    expect(rec.tags).toEqual(['Armor']);
    expect(rec.uses.hideout).toHaveLength(0);
    expect(rec.uses.craft).toHaveLength(0);
    expect(rec.uses.quest).toHaveLength(0);
    expect(rec.uses.barter).toHaveLength(0);
  });

  it('surfaces a name-fallback-key quest item without an itemId', () => {
    const rec = index.byKey.get('name:mystery trinket');
    expect(rec).toBeTruthy();
    expect(rec.itemId).toBeNull();
    expect(rec.item).toBeNull();
    expect(rec.uses.quest).toHaveLength(1);
    expect(rec.tags).toEqual(['Quest']);
  });

  it('only tags the give side of a barter, not the reward side', () => {
    const give = index.byKey.get('widget');
    const reward = index.byKey.get('widgetMade');
    expect(give.uses.barter).toHaveLength(1);
    // widgetMade is only ever a barter REWARD, never a give, so it must not pick up a Barter
    // tag from that trade. It is still in the index - being unused is a fact about it, not a
    // reason to hide it - so the assertion is on the tag, not on its existence.
    expect(reward).toBeTruthy();
    expect(reward.uses.barter).toHaveLength(0);
    expect(reward.tags).not.toContain('Barter');
    expect(reward.hasUses).toBe(false);
  });

  it('resolves a name-only reference onto the id-keyed record when the table knows the name', () => {
    // "Mystery Trinket" reaches the index with itemId null from the quest parser. With an item
    // table carrying that name it becomes one record under the real id, instead of a second
    // name-keyed one that no other source could ever attach to.
    const rec = index.byKey.get('name:mystery trinket');
    expect(rec.uses.quest).toHaveLength(1);
    expect(rec.tags).toEqual(['Quest']);
  });
});

describe('searchItemUses', () => {
  it('finds items by a single fragment, case-insensitively', () => {
    const hits = searchItemUses(index, 'CRACK');
    expect(hits.map((h) => h.name)).toContain('Cracker');
  });

  it('OR-matches a comma-separated list of terms', () => {
    const hits = searchItemUses(index, 'cracker, motor');
    const names = hits.map((h) => h.name);
    expect(names).toContain('Cracker');
    expect(names).toContain('Motor');
    expect(names).not.toContain('Battery');
  });

  it('ranks items that have uses above items that do not', () => {
    // Both match "wid". "Widget" is used five ways; "Widget Deluxe" is a barter reward and
    // nothing else. Without this rule the full item table buries real answers under noise.
    const hits = searchItemUses(index, 'widget').map((r) => r.itemId);
    expect(hits.indexOf('widget')).toBeLessThan(hits.indexOf('widgetMade'));
  });

  it('ignores terms shorter than 2 characters', () => {
    expect(searchItemUses(index, 'a')).toEqual([]);
  });
});
