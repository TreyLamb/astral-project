import { describe, it, expect } from 'vitest';

import { tipModel, renderTip, markerTipHtml, escapeHtml } from './eftMarkerTip.js';

const LOCK_CAT = { id: 957, title: 'Locked Door', group: 'Locations', icon: 'locked_door' };
const EXIT_CAT = { id: 954, title: 'Extraction', group: 'Locations', icon: 'exit' };
const BAG_CAT = { id: 969, title: 'Duffle Bag', group: 'Loot', icon: 'duffle_bag' };

describe('no URL ever reaches a tooltip', () => {
  it('keeps a markdown link\'s TEXT and drops its target', () => {
    const html = markerTipHtml(
      { title: 'Duffle Bag [4x3]', desc: 'On the bed inside the [Construction Site Bunkhouse](https://mapgenie.io/tarkov/maps/streets?locationIds=247993)' },
      BAG_CAT,
    );
    expect(html).toContain('On the bed inside the Construction Site Bunkhouse');
    expect(html).not.toContain('mapgenie.io');
    expect(html).not.toContain('http');
  });

  it('drops a bare url too', () => {
    const model = tipModel({ title: 'X', desc: 'see https://tiles.mapgenie.io/a.png' }, BAG_CAT);
    expect(model.lead).not.toContain('http');
  });

  it('leaves no markdown syntax behind', () => {
    const html = markerTipHtml(
      { title: 'Power Station', desc: "**Key:** HEP station storage room key (Random drop or reward from Jaeger's quest _Nostalgia_)" },
      LOCK_CAT,
    );
    expect(html).not.toContain('**');
    expect(html).not.toContain('](');
    expect(html).not.toMatch(/_Nostalgia_/);
  });
});

describe('escaping', () => {
  it('escapes third-party text going into innerHTML', () => {
    expect(escapeHtml('<img src=x onerror="boom">')).toBe('&lt;img src=x onerror=&quot;boom&quot;&gt;');
  });

  it('escapes a marker title', () => {
    const html = markerTipHtml({ title: '<script>x</script>', desc: '' }, BAG_CAT);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('structure', () => {
  it('turns **Label:** sections into labelled rows', () => {
    const model = tipModel(
      { title: 'Cliff Descent [PMC]', desc: '**Always Open:** Yes\n**Requirements:**\n- 1 x Paracord\n- 1 x Red Rebel Ice Pick' },
      EXIT_CAT,
    );
    expect(model.rows).toEqual([
      { label: 'Always Open', lines: ['Yes'] },
      { label: 'Requirements', lines: ['1 x Paracord', '1 x Red Rebel Ice Pick'] },
    ]);
  });

  it('renders a single line as a value and several as a list', () => {
    const html = renderTip({
      title: 'T', category: '', lead: '', key: null, note: '',
      rows: [{ label: 'One', lines: ['a'] }, { label: 'Many', lines: ['a', 'b'] }],
    });
    expect(html).toContain('<span class="eft-tip-val">a</span>');
    expect(html).toContain('<ul class="eft-tip-list"><li>a</li><li>b</li></ul>');
  });

  it('folds a repeated spawn list into a count, since the links are gone', () => {
    const model = tipModel(
      { title: 'Quarantine Zone', desc: '**Key:** Lab. Blue Keycard\n- [Spawn #1 (Shoreline)](https://a)\n- [Spawn #2 (Shoreline)](https://b)\n- [Spawn #3 (Customs)](https://c)' },
      LOCK_CAT,
      { keyName: 'Lab. Blue Keycard', itemName: 'TerraGroup Labs keycard (Blue)', itemId: 'x', kind: 'keycard' },
    );
    // The key row owns the key; the spawn bullets under it are not repeated as a section.
    expect(model.rows.some((r) => /^key$/i.test(r.label))).toBe(false);
    expect(model.key.name).toBe('TerraGroup Labs keycard (Blue)');
  });

  it('keeps the prose that came before the first section', () => {
    const model = tipModel(
      { title: 'Rogue USEC Stash', desc: 'The second to southern-most container\n\n**Key Required:** Rogue USEC stash key' },
      LOCK_CAT,
      { keyName: 'Rogue USEC stash key', itemName: 'Rogue USEC stash key', itemId: 'y', kind: 'key' },
    );
    expect(model.lead).toBe('The second to southern-most container');
  });
});

describe('locks', () => {
  it('promotes the key out of the generic sections and shows the GAME\'s name for it', () => {
    const model = tipModel(
      { title: 'RB-VO Marked Room (RB-VO)', desc: '**Key Required:** RB-VO Key (Jackets/Scavs)' },
      LOCK_CAT,
      { keyName: 'RB-VO Key', itemName: 'RB-VO marked key', itemId: 'z', keyHint: 'Jackets/Scavs', kind: 'key' },
    );
    expect(model.key).toEqual({
      name: 'RB-VO marked key', hint: 'Jackets/Scavs', kind: 'key', known: true,
    });
    expect(model.rows.some((r) => /^key required$/i.test(r.label))).toBe(false);
  });

  it('falls back to mapgenie\'s wording when the item table has no such key', () => {
    // SPT's locale lags live EFT for Icebreaker/Labyrinth/Knossos keys; the door still
    // has to say which key it wants.
    const model = tipModel(
      { title: 'Engine Room', desc: '**Key Required:** Boreas Engine Room Keycard' },
      LOCK_CAT,
      { keyName: 'Boreas Engine Room Keycard', itemName: null, itemId: null, kind: 'keycard' },
    );
    expect(model.key.name).toBe('Boreas Engine Room Keycard');
    expect(model.key.known).toBe(false);
  });

  it('explains a door that takes no key at all', () => {
    const model = tipModel(
      { title: 'Security Keypad', desc: '**Key Required:** Use code 312220' },
      LOCK_CAT,
      { keyName: '', mechanism: '', kind: 'keypad' },
    );
    expect(model.key).toBe(null);
    expect(model.note).toBe('Opened with a code, not a key');
  });

  it('prefers the door\'s real mechanism over the generic note', () => {
    const model = tipModel(
      { title: 'Server Room', desc: '**Key Required:** Unlocked by button in adjacent room' },
      LOCK_CAT,
      { keyName: '', mechanism: 'Unlocked by button in adjacent room', kind: 'button' },
    );
    expect(model.note).toBe('Unlocked by button in adjacent room');
  });

  it('ignores a lock record on a category that is not a locked door', () => {
    const model = tipModel({ title: 'Duffle Bag', desc: '' }, BAG_CAT, { keyName: 'nope' });
    expect(model.key).toBe(null);
  });
});

describe('fallbacks', () => {
  it('never renders an empty tooltip', () => {
    const html = markerTipHtml({ title: '', desc: '' }, BAG_CAT);
    expect(html).toContain('Duffle Bag');
    expect(html).toContain('Loot — Duffle Bag');
  });

  it('survives a missing category', () => {
    expect(() => markerTipHtml({ title: 'Orphan', desc: '**A:** b' }, undefined)).not.toThrow();
  });
});
