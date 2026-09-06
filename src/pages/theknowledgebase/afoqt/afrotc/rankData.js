// The eight AFROTC cadet grades.
//
// AFROTCI 36-2011 Vol 3, para 10.7.5: "No cadet is authorized to hold 'enlisted' cadet rank or
// any grade above Cadet Colonel (C/Col)." There are eight and only eight - Cadet Airman Basic
// and the rest of that ladder belong to AFJROTC and Civil Air Patrol, not college AFROTC.
// Reciting a cadet enlisted ladder in a graded recitation loses points, so this list must not
// grow "helpfully".
//
// Stripe patterns were confirmed against the official AFROTC rank chart. Two things that chart
// settles and other pubs disagree on: the abbreviations are C/2Lt and C/1Lt (not C/2d Lt and
// C/1st Lt), and it groups C/4C and C/3C under an "Airman" heading - a tier label on the chart,
// NOT an enlisted rank.
//
// `bars` reads OUTBOARD EDGE INWARD: 'w' is a wide stripe, 'n' a narrow one. That order is what
// the insignia renderer draws left-to-right, so reversing it silently draws C/1Lt as a mirror of
// itself - which is still a legal-looking image, which is why it is written down here.

export const RANKS = [
  {
    id: 'c4c', name: 'Cadet Fourth Class', abbr: 'C/4C',
    course: 'GMC', as: 'AS100', tier: 'GMC · AS100', kind: 'gmc', n: 1,
    note: 'Freshman. Blue and silver — worn with the point toward the neck.',
  },
  {
    id: 'c3c', name: 'Cadet Third Class', abbr: 'C/3C',
    course: 'GMC', as: 'AS200', tier: 'GMC · AS200', kind: 'gmc', n: 2,
    note: 'Sophomore. Every cadet wears C/3C at Field Training, whatever their detachment rank.',
  },
  {
    id: 'c2lt', name: 'Cadet Second Lieutenant', abbr: 'C/2Lt',
    course: 'POC', as: 'AS300', tier: 'POC · AS300', kind: 'off', bars: ['w'],
    note: 'First cadet officer grade. Black and silver, stripes parallel to the shoulder seam.',
  },
  {
    id: 'c1lt', name: 'Cadet First Lieutenant', abbr: 'C/1Lt',
    course: 'POC', as: 'AS300', tier: 'POC · AS300', kind: 'off', bars: ['w', 'n'], pair: 'two',
    note: 'One wide plus one narrow — the narrow stripe is what separates it from Cadet Captain.',
  },
  {
    id: 'ccapt', name: 'Cadet Captain', abbr: 'C/Capt',
    course: 'POC', as: 'AS300/400', tier: 'POC · AS300/400', kind: 'off', bars: ['w', 'w'], pair: 'two',
    note: 'Two equal wide stripes. No narrow stripe.',
  },
  {
    id: 'cmaj', name: 'Cadet Major', abbr: 'C/Maj',
    course: 'POC', as: 'AS400', tier: 'POC · AS400', kind: 'off', bars: ['w', 'n', 'w'], pair: 'three',
    note: 'Two wide with a narrow between them — three marks total, but the middle one is thin.',
  },
  {
    id: 'cltc', name: 'Cadet Lieutenant Colonel', abbr: 'C/Lt Col',
    course: 'POC', as: 'AS400', tier: 'POC · AS400', kind: 'off', bars: ['w', 'w', 'w'], pair: 'three',
    note: 'Three equal wide stripes. Against Cadet Major: count the widths, not the stripes.',
  },
  {
    id: 'ccol', name: 'Cadet Colonel', abbr: 'C/Col',
    course: 'POC', as: 'AS400', tier: 'POC · AS400', kind: 'off', bars: ['w', 'w', 'w', 'w'],
    note: 'Highest cadet grade — normally the Cadet Wing Commander. No cadet may hold a grade above C/Col.',
  },
];

export const RANK_IDS = RANKS.map((r) => r.id);
export const byId = (id) => RANKS.find((r) => r.id === id);

/**
 * Named subsets for the quiz's settings.
 *
 * `confusable` is the one worth having. Both graded mix-ups in this deck are pairs that show the
 * SAME NUMBER OF MARKS and differ only in stripe width - C/1Lt vs C/Capt (two marks) and C/Maj vs
 * C/Lt Col (three marks). Everything else in the deck is distinguishable at a glance, so a drill
 * over all eight spends most of its cards on grades that were never in doubt. Isolating the four
 * is the "hyper focus" case, and it is why the presets are here rather than leaving him to tick
 * four boxes by hand every time.
 */
export const PRESETS = [
  { id: 'all', label: 'All eight', hint: 'The full deck', ids: RANK_IDS },
  { id: 'gmc', label: 'GMC', hint: 'AS100–200 · C/4C and C/3C', ids: RANKS.filter((r) => r.course === 'GMC').map((r) => r.id) },
  { id: 'poc', label: 'POC', hint: 'AS300–400 · the six cadet officer grades', ids: RANKS.filter((r) => r.course === 'POC').map((r) => r.id) },
  { id: 'confusable', label: 'The two confusable pairs', hint: 'C/1Lt vs C/Capt · C/Maj vs C/Lt Col', ids: RANKS.filter((r) => r.pair).map((r) => r.id) },
];
