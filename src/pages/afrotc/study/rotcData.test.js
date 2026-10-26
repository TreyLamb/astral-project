import { describe, it, expect } from 'vitest';
import { pickLegacy, withLegacy, emptyState, addCardFlag, removeCardFlag, isCardFlagged } from './rotcData.js';
import { parseSong, buildSteps } from './songEngine.js';
import { AIRMANS_CREED } from './creedText.js';

describe('AFROTC study data', () => {
  it('copies only the AFROTC parts of an old AFOQT blob, and nothing when there is none', () => {
    const blob = { settings: { afrotc: { a: 1 }, afrotcSong: { lyrics: { af: 'x' } }, voice: { rate: 1 } }, flaggedCards: { c1: { id: 'c1' } }, runs: [1, 2] };
    expect(pickLegacy(blob)).toEqual({ settings: { afrotc: { a: 1 }, afrotcSong: { lyrics: { af: 'x' } } }, flaggedCards: { c1: { id: 'c1' } } });
    expect(pickLegacy({ settings: { voice: {} } })).toBeNull();
    expect(pickLegacy(null)).toBeNull();
  });

  it('takes the old data only where the new state has none', () => {
    const legacy = { settings: { afrotcSong: { lyrics: { af: 'old' } }, afrotc: { keep: 'old' } }, flaggedCards: { a: { id: 'a' } } };
    const state = { ...emptyState(), settings: { afrotc: { keep: 'new' } } };
    const out = withLegacy(state, legacy);
    expect(out.settings.afrotc).toEqual({ keep: 'new' });
    expect(out.settings.afrotcSong.lyrics.af).toBe('old');
    expect(out.flaggedCards.a.id).toBe('a');
    expect(withLegacy(state, null)).toBe(state);
  });

  it('flags and unflags a card', () => {
    let p = emptyState();
    p = addCardFlag(p, { id: 'x-1', subject: 'x', front: 'Q' });
    expect(isCardFlagged(p, 'x-1')).toBe(true);
    p = removeCardFlag(p, 'x-1');
    expect(isCardFlagged(p, 'x-1')).toBe(false);
  });

  it('the built-in Airman’s Creed parses into four parts and eighteen lines to drill', () => {
    const parsed = parseSong(AIRMANS_CREED, { stanzaWord: 'Part' });
    expect(parsed.stanzas).toHaveLength(4);
    expect(parsed.lines).toHaveLength(18);
    expect(buildSteps(parsed, { mode: 'forward', stanza: null, seed: 1 })).toHaveLength(18);
  });
});
