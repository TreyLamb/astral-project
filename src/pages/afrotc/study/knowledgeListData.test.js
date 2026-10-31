import { describe, it, expect } from 'vitest';
import { SECTIONS, SECTION_IDS, cardsFor, sequenceFor, sheetRows, initials } from './knowledgeListData';
import { CARDS } from './cardData';

const text = (id, withExtra = true) => {
  const s = SECTIONS.find((x) => x.id === id);
  return s.lines ? s.lines.join('\n') : sheetRows(s, withExtra).map((r) => `${r.k} = ${r.v} ${r.abbr ?? ''}`).join('\n');
};

// Every line of the list as it was handed out on 28 Oct 2026. If one of these fails, the review has
// lost an item from the list, which is the one thing this page exists to prevent.
describe('the knowledge list is all there', () => {
  it('chain of command, in the list order, with every name', () => {
    const chain = sequenceFor('chain', false).map((x) => `${x.label}: ${x.text}`);
    expect(chain).toEqual([
      'Commander in Chief: President Donald J. Trump',
      'Secretary of War: The Honorable Peter B. Hegseth',
      'Secretary of the Air Force: The Honorable Troy E. Meink',
      'Chairman of the Joint Chiefs of Staff: General Dan Caine',
      'Chief of Staff of the Air Force: General Kenneth S. Wilsbach',
      'Chief of Space Operations: General Douglas A. Schiess',
      'AETC Commander: Lt. Gen. Clark J. Quinn',
      'AFAC Commander: Maj. Gen. Jeffrey W. Nelson',
      'Holm Center Commander: Brig. Gen. Christopher Lay',
      'AFROTC Commander: Col. Michael Fleming',
      'NW Region Director: Col. Sandra Coble',
    ]);
  });

  it('the optional Det 855 block comes from the OPLAN data and only when asked for', () => {
    expect(sequenceFor('chain', true).length).toBeGreaterThan(11);
    expect(text('chain')).toMatch(/Charlie Flight Commander = C\/Capt McGuire/);
    expect(sequenceFor('chain', false).some((x) => /Det 855/.test(x.label))).toBe(false);
  });

  it('birthdays, Honor Code, tiers, CGO/FGO', () => {
    expect(text('birthdays')).toMatch(/Air Force birthday = 18 September 1947/);
    expect(text('birthdays')).toMatch(/Space Force birthday = 20 December 2019/);
    expect(text('honor')).toContain('We will not lie, steal, or cheat, nor tolerate among us anyone who does.');
    expect(text('tiers')).toMatch(/Airmen = E-1 through E-4/);
    expect(text('tiers')).toMatch(/NCOs .* = E-5 and E-6/);
    expect(text('tiers')).toMatch(/SNCOs .* = E-7 through E-9/);
    expect(text('cgofgo')).toMatch(/O-1 through O-3: Second Lieutenant, First Lieutenant, Captain/);
    expect(text('cgofgo')).toMatch(/O-4 through O-6: Major, Lieutenant Colonel, Colonel/);
  });

  it('officer ranks O-1 to O-10 and the Navy list ending in Fleet Admiral', () => {
    expect(sequenceFor('officers').map((x) => x.label)).toEqual(['O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10']);
    expect(sequenceFor('navy').map((x) => x.text.replace(/ \(.*\)$/, ''))).toEqual([
      'Ensign', 'Lieutenant Junior Grade', 'Lieutenant', 'Lieutenant Commander', 'Commander', 'Captain',
      'Rear Admiral Lower Half', 'Rear Admiral Upper Half', 'Vice Admiral', 'Admiral', 'Fleet Admiral',
    ]);
  });

  it("the Creed, Core Values, both songs and the seven responses", () => {
    const creed = sequenceFor('creed').map((x) => x.text);
    expect(creed[0]).toBe('I am an American Airman.');
    expect(creed.at(-1)).toBe('And I will not fail.');
    expect(sequenceFor('values').map((x) => x.text)).toEqual(['Integrity First', 'Service Before Self', 'Excellence In All We Do']);
    expect(text('songs')).toMatch(/Air Force Song/);
    expect(text('songs')).toMatch(/Space Force Song/);
    expect(sequenceFor('responses')).toHaveLength(7);
    expect(text('responses')).toMatch(/No excuse, Sir\/Ma’am/);
  });

  it('all nine Air Force MAJCOMs with their headquarters, and the three Space Force commands', () => {
    const m = text('majcoms');
    for (const [cmd, hq] of [
      ['ACC', 'Langley-Eustis'], ['AETC', 'Randolph'], ['AFGSC', 'Barksdale'], ['AFMC', 'Wright-Patterson'],
      ['AFRC', 'Robins'], ['AFSOC', 'Hurlburt'], ['AMC', 'Scott'], ['PACAF', 'Hickam'], ['USAFE-AFAFRICA', 'Ramstein'],
    ]) expect(m).toMatch(new RegExp(`\\(${cmd}\\) = [^\\n]*${hq}`));
    expect(sequenceFor('majcoms')).toHaveLength(9);
    expect(text('sfcommands')).toMatch(/Space Systems Command \(SSC\)/);
    expect(text('sfcommands')).toMatch(/Combat Forces Command \(CFC\)/);
    expect(text('sfcommands')).toMatch(/STARCOM/);
  });
});

describe('cards', () => {
  it('ids are unique across every section and direction', () => {
    const ids = cardsFor(SECTION_IDS, 'both').map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('one-way decks only deal their own direction, and no section drops out of either', () => {
    const fwd = cardsFor(SECTION_IDS, 'forward');
    const rev = cardsFor(SECTION_IDS, 'reverse');
    const twoWay = new Set(SECTIONS.filter((s) => s.reverse).map((s) => s.id));
    expect(fwd.some((c) => c.id.endsWith('-r'))).toBe(false);
    expect(rev.some((c) => c.id.endsWith('-f') && twoWay.has(c.section))).toBe(false);
    expect(rev.some((c) => c.front === 'Which MAJCOM is headquartered at Ramstein Air Base, Germany?')).toBe(true);
    for (const id of SECTION_IDS) expect(cardsFor([id], 'reverse').length).toBeGreaterThan(0);
  });

  it('a card never asks the question it answers', () => {
    for (const c of cardsFor(SECTION_IDS, 'both')) expect(c.front.includes(c.back)).toBe(false);
  });
});

describe('initials', () => {
  it('keeps the shape of the line without giving it away', () => {
    expect(initials('The Honorable Troy E. Meink')).toBe('T… H… T… E… M…');
    expect(initials('Sir/Ma’am, may I ask?')).toBe('S… m… I… a…');
  });
});

describe('knowledge-card additions from the same list', () => {
  it('the field-command card names Combat Forces Command, not SpOC', () => {
    const fc = CARDS.find((c) => c.front === 'The Space Force’s three Field Commands');
    expect(fc.back).toMatch(/Combat Forces Command/);
    expect(fc.back).not.toMatch(/Space Operations Command/);
  });

  it('new cards were appended, so existing ids (and their flags) did not move', () => {
    // Chain-of-command cards (2026-10-30) carry position-based ids, so they sit after the positional ones.
    const tail = CARDS.filter((c) => c.subject !== 'chain').slice(-7).map((c) => c.front);
    expect(tail).toContain('Air Force birthday');
    expect(tail).toContain('The nine Air Force MAJCOMs and their headquarters');
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });
});

describe('chain of command deck', () => {
  it('asks every name in text, and again with a portrait wherever one exists', async () => {
    const { CHAIN_CARDS, CHAIN_PEOPLE } = await import('./chainDeck.js');
    const { CHAIN_PHOTOS } = await import('./chainPhotos.js');
    const text = CHAIN_CARDS.filter((c) => !c.frontImg);
    const pics = CHAIN_CARDS.filter((c) => c.frontImg);
    expect(text).toHaveLength(CHAIN_PEOPLE);
    expect(pics).toHaveLength(Object.keys(CHAIN_PHOTOS).length);
    const cic = CHAIN_CARDS.filter((c) => c.front === 'Who is the Commander in Chief?');
    expect(cic).toHaveLength(2);
    expect(cic.every((c) => c.back === 'President Donald J. Trump')).toBe(true);
    expect(CHAIN_CARDS.some((c) => /stationed/i.test(c.front))).toBe(false);
  });

  it('every portrait file is on disk', async () => {
    const fs = await import('node:fs');
    const { CHAIN_PHOTOS } = await import('./chainPhotos.js');
    for (const f of Object.values(CHAIN_PHOTOS)) expect(fs.existsSync(`public/afrotc/chain/${f}.jpg`)).toBe(true);
  });
});
