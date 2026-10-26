// Line-by-line memorization engine for a song. Pure: no React, no storage, no lyrics.
//
// The lyrics are NEVER stored in the repo. Both service songs are under copyright, and the wording
// that gets graded is the printed handbook's, so the page takes the text from the cadet (pasted or
// typed once) and keeps it in his own settings. Everything here works on whatever text it is handed.

const LABEL = /^\[?\s*(verse|chorus|refrain|bridge|stanza|intro|outro)\b[^\]]*\]?:?\s*$/i;

export const MODES = [
  { id: 'forward', label: 'Next line', hint: 'Top to bottom: see the line before, say the next one' },
  { id: 'backward', label: 'Line before', hint: 'Bottom to top: see a line, say the one that comes before it' },
  { id: 'shuffle', label: 'Shuffled', hint: 'Random lines, random direction' },
];

/** Text -> { lines, stanzas }. A blank line starts a new stanza; "Verse 2:" style labels are kept as names (`stanzaWord` names unlabeled ones: Verse for a song, Part for a creed). */
export function parseSong(text, { stanzaWord = 'Verse' } = {}) {
  const lines = [];
  const stanzas = [];
  let cur = null;
  let label = '';
  for (const raw of String(text ?? '').replace(/\r/g, '').split('\n')) {
    const t = raw.trim().replace(/\s+/g, ' ');
    if (!t) { cur = null; continue; }
    if (LABEL.test(t)) { label = t.replace(/^\[|\]$/g, '').replace(/:$/, '').trim(); cur = null; continue; }
    if (!cur) {
      cur = { index: stanzas.length, label: label || `${stanzaWord} ${stanzas.length + 1}`, lines: [] };
      label = '';
      stanzas.push(cur);
    }
    const line = { text: t, n: lines.length, stanza: cur.index, pos: cur.lines.length };
    cur.lines.push(line);
    lines.push(line);
  }
  return { lines, stanzas };
}

const rngFrom = (seed) => {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * The ordered steps of one run. A step asks for ONE line (`answer`) and carries every line above and
 * below it inside the scope, so the screen can show as much or as little context as it wants.
 *  dir 'next': the cadet sees the lines above and says the answer (the line that FOLLOWS them).
 *  dir 'prev': the cadet sees the lines below and says the answer (the line that comes BEFORE them).
 *  edge: 'start' (no line above: the top of the song or stanza) or 'end' (no line below).
 * forward walks top to bottom, backward bottom to top, so a full run is always the whole scope once.
 */
export function buildSteps(song, { mode = 'forward', stanza = null, seed = 1 } = {}) {
  const pool = stanza == null ? song.lines : (song.stanzas[stanza]?.lines ?? []);
  const last = pool.length - 1;
  const mk = (i, dir) => ({
    answer: pool[i],
    above: pool.slice(0, i),
    below: pool.slice(i + 1),
    dir,
    edge: dir === 'next' ? (i === 0 ? 'start' : null) : (i === last ? 'end' : null),
  });
  if (!pool.length) return [];
  if (mode === 'backward') return pool.map((_, k) => mk(last - k, 'prev'));
  if (mode === 'shuffle') {
    const rnd = rngFrom(seed);
    const order = pool.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order.map((i) => mk(i, rnd() < 0.6 ? 'next' : 'prev'));
  }
  return pool.map((_, i) => mk(i, 'next'));
}

/** "Off we go" -> "O__ w_ g_": the first letter of every word, the rest blanked, punctuation kept. */
export function hintInitials(text) {
  return String(text).split(' ').map((w) => {
    const k = w.search(/[A-Za-z0-9]/);
    if (k < 0) return w;
    return w.slice(0, k + 1) + w.slice(k + 1).replace(/[A-Za-z0-9]/g, '_');
  }).join(' ');
}

/** Level 1: just the first word. Level 2: every word's first letter. Level 3+: nothing more to give. */
export function hintAt(level, text) {
  if (level === 1) return `${String(text).split(' ')[0]} …`;
  if (level === 2) return hintInitials(text);
  return null;
}
