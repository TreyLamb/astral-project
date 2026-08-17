// Tools whose NAME is an abbreviation get that abbreviation as their URL
// (/MFT, /VV, /TKB…). Two consequences this file exists to handle:
//
//  1. React Router paths are case-sensitive, so /mft would NOT match /MFT.
//     Typing a URL by hand is the whole point of a short path, and nobody
//     hits shift for it — so every segment is matched case-insensitively and
//     redirected to its canonical casing.
//  2. Old paths are already bookmarked and already synced into Google
//     Calendar event links, so they redirect instead of 404ing.

// old path segment -> canonical segment
export const LEGACY_SEGMENTS = {
  'fitness-tracker': 'MFT',
  'fitnesstracker': 'MFT',
  'myfitnesstracker': 'MFT',
  'vocab-vault': 'VV',
  'lang': 'VV',
  'qa-tracker': 'QA',
  'rs-market': 'RS',
  'pgo-tracker': 'POGO',
  'pgo': 'POGO',
  'pogo-accs': 'POGO-ACCS',
};

// Every first segment the app actually routes, in its canonical casing.
export const CANONICAL_SEGMENTS = [
  'MFT', 'VV', 'TKB', 'QA', 'RS', 'POGO', 'POGO-ACCS', 'EFTsh', 'TT',
  'daily-idiom', 'daily-idiom-widget', 'lexicon', 'google-photos', 'mymdb',
  'gitmon', 'bashmon', 'signal-lost', 'pokered', 'python-game',
  'antiquityquest', 'stashmap', 'medaldex', 'timer-tool', 'league-build',
  'orbit', 'planning-tool',
];

const BY_LOWER = new Map(CANONICAL_SEGMENTS.map((s) => [s.toLowerCase(), s]));

// Returns the path this one should redirect to, or null if it's already
// canonical (or genuinely unknown — the caller renders Not Found for that).
export function canonicalPathFor(pathname) {
  const parts = pathname.replace(/^\/+/, '').split('/');
  const first = parts[0] || '';
  if (!first) return null;
  const lower = first.toLowerCase();
  const target = LEGACY_SEGMENTS[lower] || BY_LOWER.get(lower) || null;
  if (!target || target === first) return null;
  return '/' + [target, ...parts.slice(1)].join('/');
}
