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
//   - "unlinked" -> present in the raw items dict, referenced nowhere -> must not appear
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

const index = buildItemUsesIndex({
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

  it('drops an item that is in the raw items dict but referenced nowhere', () => {
    expect(index.byKey.has('unlinked')).toBe(false);
    expect(index.all.some((r) => r.itemId === 'unlinked')).toBe(false);
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
    // widgetMade is only ever a barter reward, never a give — it must not
    // pick up a Barter tag from that same trade, and (having no other source
    // either) must not appear in the index at all.
    expect(reward).toBeUndefined();
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

  it('ignores terms shorter than 2 characters', () => {
    expect(searchItemUses(index, 'a')).toEqual([]);
  });
});
