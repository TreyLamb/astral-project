// Real card colors — Antiquities and Treasures are separate 5-color suits that
// partially overlap by name (both have Blue and Red), so the valid color list
// depends on which type is selected, not one shared flat list.
export const AQ_ANTIQUITY_COLORS = ['Yellow', 'Blue', 'Green', 'Red', 'Purple'];
export const AQ_TREASURE_COLORS = ['Copper', 'Pink', 'Blue', 'Red', 'Silver'];
export const AQ_NUMBERS = [1, 2, 3, 4, 5];
export const AQ_TYPES = ['antiquity', 'treasure'];

// A wild antiquity card's `number` field is literally this sentinel, never a
// resolved digit — resolution happens fresh every read (see resolveWildBook),
// so a wild always reflects whatever's currently missing, live.
export const WILD = 'wild';

// A chat bubble only renders for this long after sentAt — no cleanup write
// needed, every viewer (host + other players) just checks the clock locally.
const CHAT_DISPLAY_MS = 8000;
export function isMessageFresh(chatMessage) {
  if (!chatMessage) return false;
  return Date.now() - new Date(chatMessage.sentAt).getTime() < CHAT_DISPLAY_MS;
}

export function colorsForType(type) {
  return type === 'treasure' ? AQ_TREASURE_COLORS : AQ_ANTIQUITY_COLORS;
}

// Real swatch colors for each name (Copper/Silver are metallic, not a plain hue).
export const AQ_COLOR_HEX = {
  Yellow: '#e0b400',
  Blue: '#2f6fd6',
  Green: '#2f9e44',
  Red: '#d6392f',
  Purple: '#8b5cf6',
  Copper: '#b87333',
  Pink: '#ec4899',
  Silver: '#c7cad1',
};

// A book starts at 5 slots; empty slots are null. A filled slot is
// { color, type, number }. Only Mixed Collections can exceed 5 cards in the
// physical game ("Add to a Collection: ... your completed Mixed Collections.
// You cannot add cards to completed Perfect or Standard collections") — see
// maybeGrowBook below, which is the only thing that ever extends a book.
export function emptyBook() {
  return [null, null, null, null, null];
}

export const MAX_BOOK_SIZE = 20;

// Call after any slot fill/clear. Only a book that's full AND currently
// classifies as Mixed gets one more open slot appended (up to MAX_BOOK_SIZE) —
// Perfect/Standard books lock at exactly 5 per the physical rules, so they
// never grow. Strips trailing empty slots back to the 5-slot floor first, so a
// book that stops being full+mixed (e.g. a card swap reverts it to a plain
// single-suit set) loses the extra room it had grown — safe against clearing a
// middle slot too, since growth only ever happens while fully filled, so at
// most one trailing null can exist at a time.
export function maybeGrowBook(book) {
  let trimmed = book;
  while (trimmed.length > 5 && trimmed[trimmed.length - 1] === null) {
    trimmed = trimmed.slice(0, -1);
  }
  if (trimmed.length >= MAX_BOOK_SIZE) return trimmed;
  if (!trimmed.every(Boolean)) return trimmed;
  return classifyBook(trimmed) === 'mixed' ? [...trimmed, null] : trimmed;
}

// Assigns each wild antiquity card in the book the lowest number still missing
// among that book's real (non-wild) antiquity cards, in slot order — e.g. real
// 1/2/3 + one wild resolves the wild to 4; if a real 4 is added afterward, the
// wild re-resolves to 5 on the next call (nothing is cached/stored). Returns a
// parallel array; every entry gets a `resolvedNumber` (real cards: their own
// number) and `isWild` flag, non-antiquity/empty entries pass through as-is.
export function resolveWildBook(book) {
  const taken = new Set(
    book.filter((c) => c && c.type === 'antiquity' && c.number !== WILD).map((c) => c.number),
  );
  const missing = AQ_NUMBERS.filter((n) => !taken.has(n));
  let next = 0;
  return book.map((c) => {
    if (!c || c.type !== 'antiquity') return c;
    if (c.number === WILD) {
      const resolvedNumber = missing[next] ?? null;
      next += 1;
      return { ...c, resolvedNumber, isWild: true };
    }
    return { ...c, resolvedNumber: c.number, isWild: false };
  });
}

// A book only counts as a completed collection once all 5 slots are filled —
// mirrors the physical rule ("a collection becomes completed once it has 5 cards").
// Returns 'perfectTreasure' | 'perfectAntiquity' | 'standard' | 'mixed' | null
// (null covers both "not full yet" and "full but doesn't match any bonus shape",
// e.g. antiquities from two different suits played into the same book).
export function classifyBook(book) {
  const filled = book.filter(Boolean);
  if (filled.length < 5) return null;

  const allAntiquity = filled.every((c) => c.type === 'antiquity');
  const allTreasure = filled.every((c) => c.type === 'treasure');

  if (allTreasure) {
    // Treasures carry no number — identity is color alone. "5 unique Treasure
    // cards" means 5 distinct colors (one of each in the 5-color palette);
    // any repeated color makes it a Standard (not Perfect) Treasure Collection.
    const uniqueColors = new Set(filled.map((c) => c.color));
    return uniqueColors.size === 5 ? 'perfectTreasure' : 'standard';
  }

  if (allAntiquity) {
    const sameColor = filled.every((c) => c.color === filled[0].color);
    if (!sameColor) return null; // not a valid single-suit collection
    const numbers = resolveWildBook(book).filter(Boolean).map((c) => c.resolvedNumber);
    const isSequential =
      new Set(numbers).size === 5 && AQ_NUMBERS.every((n) => numbers.includes(n));
    return isSequential ? 'perfectAntiquity' : 'standard';
  }

  // Mixed types: only a valid Mixed Collection if every antiquity in it shares one suit.
  const antiquityColors = new Set(filled.filter((c) => c.type === 'antiquity').map((c) => c.color));
  return antiquityColors.size <= 1 ? 'mixed' : null;
}

// A provisional, always-on label for a book — unlike classifyBook (which
// only ever judges completed 5-card books, for scoring), this also covers
// books still being built: 'perfectTreasure' | 'perfectAntiquity' | 'standard'
// | 'mixed' | 'dirty' | null (empty book). Once a book is actually complete,
// this defers straight to classifyBook so a genuine Perfect reports as such
// instead of being stuck on the incomplete-book trend guess below — "dirty"
// means the book can never score any bonus no matter what's added later
// (e.g. two different Antiquity suits mixed together); "standard" while
// incomplete just means still on track and could still become Perfect.
export function classifyBookLive(book) {
  const filled = book.filter(Boolean);
  if (filled.length === 0) return null;

  const resolved = classifyBook(book);
  if (resolved) return resolved;

  const allAntiquity = filled.every((c) => c.type === 'antiquity');
  const allTreasure = filled.every((c) => c.type === 'treasure');

  if (allTreasure) return 'standard';

  if (allAntiquity) {
    const sameColor = filled.every((c) => c.color === filled[0].color);
    return sameColor ? 'standard' : 'dirty';
  }

  const antiquityColors = new Set(filled.filter((c) => c.type === 'antiquity').map((c) => c.color));
  return antiquityColors.size <= 1 ? 'mixed' : 'dirty';
}

// Reorders a book's filled slots by resolved number ascending (1-5 chronological),
// pushing empty slots to the end — e.g. a wild currently resolved as W(4) moves to
// the 4th position, and re-sorts again if a later change shifts what it resolves
// to. Treasures/mixed books have no defined chronological order, so left as-is;
// callers are expected to debounce this (see AntiquityQuestPlayer's scheduleSort)
// so it doesn't reorder cards while the player is still actively picking.
export function sortAntiquityBook(book) {
  if (book.some((c) => c && c.type === 'treasure')) return book;
  const resolved = resolveWildBook(book);
  const ordered = book
    .map((card, i) => ({ card, key: card ? resolved[i].resolvedNumber : Infinity }))
    .filter((x) => x.card)
    .sort((a, b) => a.key - b.key)
    .map((x) => x.card);
  return [...ordered, ...Array(book.length - ordered.length).fill(null)];
}

// Turns the player's books + held-card counts + Went-Out input into the flat
// shape aqScoring.calculateRoundScore expects. Individual card base values
// (+25/+50 each) are awarded for every played card regardless of whether its book
// ever completes — collection bonuses stack on top, they don't replace this.
// Nigel Remington has no positive scoring path (see aqScoring.js) — only its
// held-penalty count is tracked here, there's no "Remingtons played" input.
// Tess Wynter is a pure action card at the table (0 points played, per
// antiquityquest.md), but a held/unplayed one still costs -100 at round end
// — same shape as Remington's held penalty, confirmed directly since the
// doc's formula omits it.
export function deriveRoundInputs(books, held, wentOut) {
  const inputs = {
    perfectTreasures: 0,
    perfectAntiquities: 0,
    standardCollections: 0,
    mixedCollections: 0,
    individualAntiquities: 0,
    individualTreasures: 0,
    wentOut: !!wentOut,
    heldAntiquities: held?.antiquities || 0,
    heldTreasures: held?.treasures || 0,
    heldRemingtons: held?.remingtons || 0,
    heldTess: held?.tess || 0,
  };

  books.forEach((book) => {
    book.filter(Boolean).forEach((c) => {
      if (c.type === 'antiquity') inputs.individualAntiquities += 1;
      else inputs.individualTreasures += 1;
    });

    const classification = classifyBook(book);
    if (classification === 'perfectTreasure') inputs.perfectTreasures += 1;
    else if (classification === 'perfectAntiquity') inputs.perfectAntiquities += 1;
    else if (classification === 'standard') inputs.standardCollections += 1;
    else if (classification === 'mixed') inputs.mixedCollections += 1;
  });

  return inputs;
}
