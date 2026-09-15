import { describe, it, expect } from 'vitest';

import {
  stripLinks, stripBareUrls, plainText, splitSections, bodyLines, keyNameFrom,
  looksLikeKeyName, lockKindFrom, lockCode, roomName, parseLock,
  buildKeyPool, matchKeyItem, buildLockIndex, LOCK_KIND,
} from './eftLocks.js';

// A slice of itemNames.json's real rows, including the traps: the removed `(off)` twin,
// the Rogue-USEC sibling that a loose match would pick, and the Health Resort's thirty
// near-identical room keys (two of them are enough to recreate the tie).
const ROWS = [
  ['5448fee04bdc2dbc018b4567', 'Bottle of water (0.6L)', 'Water'],
  ['5c1d0c5f86f7744bb2683cf0', 'TerraGroup Labs keycard (Black)', 'Black'],
  ['5d80c93086f7744036212b41', '(off)Black Keycard', 'Black KC'],
  ['5d80c60f86f77440373c4ece', 'Rogue USEC stash key', 'Stash'],
  ['5eff09cd30a7dc22fd1ddfed', 'USEC stash key', 'USEC'],
  ['5d80c62a86f7744036212b3f', 'Rogue USEC barrack key', 'Barrack'],
  ['5a0ea69f8dc32e00097f8ed8', 'Health Resort office key with a blue tape', 'San tape'],
  ['5a0ea64786f7741d4a3ad100', 'Health Resort east wing room 205 key', 'San 205'],
  ['5a0ea62f8dc32e00097f8ed7', 'Health Resort west wing room 205 key', 'San w205'],
  ['5d80cb3886f77440556dbf09', 'Water treatment plant storage room key', 'WTP store'],
  ['5d947d4e86f774447b415895', 'Underground parking utility room key', 'Utility'],
  ['5ede7a8229445733cb4c18e2', 'RB-VO marked key', 'RB-VO mrk.'],
  ['5d80c6fc86f774403a401e3c', 'RB-KPRL key', 'RB-KPRL'],
  ['5780cf7f2459777de4559322', 'Dorm room 314 marked key', 'Mrk. 314'],
];

describe('markdown flattening', () => {
  it('unwraps a NESTED mapgenie link', () => {
    // A single non-greedy pass leaves the outer brackets stranded around the text.
    expect(stripLinks('[Key to OLI Office [Customs]](https://mapgenie.io/x)'))
      .toBe('Key to OLI Office [Customs]');
  });

  it('removes bare urls so no tooltip can ever print one', () => {
    expect(stripBareUrls('see https://tiles.mapgenie.io/a/b.png here').trim())
      .toBe('see here');
  });

  it('flattens bold, italics and links together', () => {
    expect(plainText('**Key:** [Cottage back door key](https://mapgenie.io/q) _random_'))
      .toBe('Key: Cottage back door key random');
  });
});

describe('splitSections', () => {
  it('keeps prose that appears BEFORE the first section', () => {
    const { lead, sections } = splitSections(
      'The northern white container.\n\n**Key Required:** Rogue USEC workshop key',
    );
    expect(lead).toBe('The northern white container.');
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('Key Required');
  });

  it('walks sections by index rather than a lookahead', () => {
    // JavaScript has no \Z; a `(?=^\*\*|\Z)` lookahead silently means "or a literal Z"
    // and would truncate any section at its first capital Z.
    const { sections } = splitSections(
      '**Key Required:** Zmeisky 5 apartment 20 key\n**Behind the Lock:**\n- Zarya\n- Loose Loot',
    );
    expect(sections[0].body.trim()).toBe('Zmeisky 5 apartment 20 key');
    expect(bodyLines(sections[1].body)).toEqual(['Zarya', 'Loose Loot']);
  });

  it('drops "??" placeholder bodies instead of listing them as loot', () => {
    const { sections } = splitSections('**Key Required:** ??  \n**Behind the Lock:** ??');
    expect(bodyLines(sections[1].body)).toEqual([]);
  });
});

describe('keyNameFrom', () => {
  it('splits the spawn hint off the name', () => {
    expect(keyNameFrom('Construction Site Bunkhouse Key (Jackets/Drawers/Scavs)'))
      .toEqual({ name: 'Construction Site Bunkhouse Key', hint: 'Jackets/Drawers/Scavs' });
  });

  it('cuts trailing commentary BEFORE stripping the qualifier it displaced', () => {
    // Ordering defect: stripping parentheses first leaves "(Random - Jackets/Scavs)"
    // welded to the name, because a following sentence pushed it off the end.
    expect(keyNameFrom('Trailer Park Cabin Key (Random - Jackets/Scavs). Also received upon starting the Golden Swag quest.').name)
      .toBe('Trailer Park Cabin Key');
  });

  it('never splits on "Lab.", which is how the Labs keycards are written', () => {
    expect(keyNameFrom('Lab. Black Keycard').name).toBe('Lab. Black Keycard');
  });

  it('drops the map the LOCK is on, which is not part of the item name', () => {
    expect(keyNameFrom('USEC Stash on Customs Key').name).toBe('USEC Stash Key');
  });

  it('drops a trailing spawn count that belongs to the bullet list below it', () => {
    expect(keyNameFrom('Corpse Room Key - 6 Possible Spawns:\n- [Corpse Room Key](https://x)').name)
      .toBe('Corpse Room Key');
  });

  it('reads only the first line, never the spawn bullets under it', () => {
    const body = 'Lab. Blue Keycard\n- [Spawn #1 (Shoreline)](https://mapgenie.io/a)\n- [Spawn #2](https://mapgenie.io/b)';
    expect(keyNameFrom(body).name).toBe('Lab. Blue Keycard');
  });
});

describe('looksLikeKeyName', () => {
  it.each([
    'Random Drop',
    'Unlocked by button in adjacent room',
    'Use the code provided on the nearby bulletin board',
    'There is a key card scanner on the wall next to a blast door. If you get close it opens',
    'Not available as of 0.12.9',
    '??',
  ])('rejects prose: %s', (text) => {
    expect(looksLikeKeyName(text)).toBe(false);
  });

  it.each(['RB-ORB2 Key', 'Lab. Black Keycard', 'Cottage back door key'])(
    'accepts a real name: %s',
    (text) => { expect(looksLikeKeyName(text)).toBe(true); },
  );
});

describe('lockKindFrom', () => {
  it('reads a keypad off the prose when no key is named', () => {
    expect(lockKindFrom({ keyName: '', desc: 'Use code 312220 after given code by Mechanic' }))
      .toBe(LOCK_KIND.KEYPAD);
  });

  it('separates a keycard from a key', () => {
    expect(lockKindFrom({ keyName: 'Lab. Black Keycard' })).toBe(LOCK_KIND.KEYCARD);
    expect(lockKindFrom({ keyName: 'RB-ORB2 Key' })).toBe(LOCK_KIND.KEY);
  });

  it('falls to unknown rather than guessing', () => {
    expect(lockKindFrom({ keyName: '', desc: 'Unknown how to access.' })).toBe(LOCK_KIND.UNKNOWN);
  });
});

describe('lockCode — the text drawn on the map', () => {
  it('prefers the code the community already uses', () => {
    expect(lockCode({ title: 'White Pawn Armory (RB-ORB1)' })).toBe('RB-ORB1');
  });

  it('never labels a door with the MAP its key spawns on', () => {
    // "Tarcone Director's Office (Customs)" — the parenthetical is where the key is
    // found, and using it would caption the door "Customs".
    expect(lockCode({ title: "Tarcone Director's Office (Customs)", itemShortName: 'Director' }))
      .toBe('Director');
  });

  it('drops a trailing "Key" from the code', () => {
    expect(lockCode({ title: 'Dorm Room 108 (108 Key)' })).toBe('108');
  });

  it('falls back to the item short name, then to the key name', () => {
    expect(lockCode({ title: 'Cottage', keyName: 'Cottage back door key', itemShortName: 'Cott. bd' }))
      .toBe('Cott. bd');
    expect(lockCode({ title: 'Cottage', keyName: 'Cottage back door key' })).toBe('Cottage back do…');
  });
});

describe('roomName', () => {
  it('takes the code parenthetical back off', () => {
    expect(roomName('White Pawn Armory (RB-ORB1)')).toBe('White Pawn Armory');
  });
});

describe('matchKeyItem', () => {
  const pool = buildKeyPool(ROWS);

  it('excludes removed (off) items outright', () => {
    // "(off)Black Keycard" beat the real Labs keycard on a plain name match.
    expect(pool.some((p) => p.name.startsWith('(off)'))).toBe(false);
  });

  it('only pools things that are actually keys', () => {
    expect(pool.some((p) => p.name.includes('Bottle of water'))).toBe(false);
  });

  it.each([
    ['Rogue USEC barracks key', 'Rogue USEC barrack key'],
    ['Water treatment storage room key', 'Water treatment plant storage room key'],
    ['RB-VO Key', 'RB-VO marked key'],
    ['RB-KPRL', 'RB-KPRL key'],
  ])('matches mapgenie wording "%s" to "%s"', (query, expected) => {
    expect(matchKeyItem(query, pool).item?.name).toBe(expected);
  });

  it('resolves the Labs keycards through the alias table', () => {
    const hit = matchKeyItem('Lab. Black Keycard', pool);
    expect(hit.item?.name).toBe('TerraGroup Labs keycard (Black)');
    expect(hit.via).toBe('alias');
  });

  it('takes a high-scoring match even against thirty sibling room keys', () => {
    expect(matchKeyItem('Key with Tape', pool).item?.name)
      .toBe('Health Resort office key with a blue tape');
  });

  it('refuses a mid-confidence match that cannot beat its runner-up', () => {
    // A WRONG key is worse than no key: nothing here should silently become one of the
    // two near-identical 205 room keys.
    const hit = matchKeyItem('Room 205 key', pool);
    expect(hit.item).toBe(null);
    expect(hit.via).toBe('ambiguous');
  });

  it('returns nothing for a key the item table does not have', () => {
    // Real case: SPT's locale lags live EFT for Icebreaker/Labyrinth/Knossos keys.
    expect(matchKeyItem('Boreas engine room keycard', pool).item).toBe(null);
  });
});

describe('parseLock', () => {
  it('parses a full Reserve lock end to end', () => {
    const lock = parseLock({
      id: 7,
      cat: 957,
      title: 'White Pawn Armory (RB-ORB1)',
      desc: '**Key Required:** [RB-ORB1 Key](https://mapgenie.io/tarkov/maps/reserve?locationIds=66967) (+ Jackets/Scavs)',
      lat: 1,
      lng: 2,
    });
    expect(lock.room).toBe('White Pawn Armory');
    expect(lock.keyName).toBe('RB-ORB1 Key');
    expect(lock.keyHint).toBe('+ Jackets/Scavs');
    expect(lock.kind).toBe(LOCK_KIND.KEY);
    expect(lock.raw).toContain('mapgenie.io');
  });

  it('keeps the loot list and the lead prose apart', () => {
    const lock = parseLock({
      title: 'Rogue USEC Stash',
      desc: 'The second to southern-most container\n\n**Key Required:** Rogue USEC stash key (Jackets/Drawers/Scavs)\n**Behind the Lock:**\n- 2x Weapon Box\n- Loose Loot',
    });
    expect(lock.lead).toBe('The second to southern-most container');
    expect(lock.behind).toEqual(['2x Weapon Box', 'Loose Loot']);
  });

  it('records the mechanism when the "key" line was really prose', () => {
    const lock = parseLock({ title: 'Server Room', desc: '**Key Required:** Unlocked by button in adjacent room' });
    expect(lock.keyName).toBe('');
    expect(lock.mechanism).toBe('Unlocked by button in adjacent room');
    expect(lock.kind).toBe(LOCK_KIND.BUTTON);
  });

  it('never loses the raw description, however badly it parses', () => {
    const lock = parseLock({ title: 'Weird', desc: 'total nonsense ??? ***' });
    expect(lock.raw).toBe('total nonsense ??? ***');
  });
});

describe('buildLockIndex', () => {
  const mapData = {
    categories: [
      { id: 957, title: 'Locked Door', icon: 'locked_door' },
      { id: 947, title: 'Key', icon: 'key' },
    ],
    markers: [
      { id: 1, cat: 957, title: 'Armory (RB-ORB1)', desc: '**Key:** RB-KPRL', lat: 1, lng: 2 },
      // A KEY SPAWN, not a lock — this overlay is about where a key is used.
      { id: 2, cat: 947, title: 'RB-ORB1 Key', desc: 'in a jacket', lat: 3, lng: 4 },
    ],
  };

  it('takes locked doors only, never key spawns', () => {
    const locks = buildLockIndex(mapData, ROWS);
    expect(locks).toHaveLength(1);
    expect(locks[0].id).toBe(1);
  });

  it('carries the joined item and the map label through', () => {
    const [lock] = buildLockIndex(mapData, ROWS);
    expect(lock.itemName).toBe('RB-KPRL key');
    expect(lock.code).toBe('RB-ORB1');
  });
});
