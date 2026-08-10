// Shared sample data for the five design mockups.
// CP values are REAL, pulled from cp_table.csv (7/7/7 IVs) so the mockups show
// honest numbers rather than placeholders. Sprites come from the same PokeAPI
// mirror MedalDex already uses (medaldexConfig.js:81).
//
// Fields: dex, name, types, cp at level 15 / 25 / 35, and the current saved
// assignment (tier / stars / labels) so each mockup can show assigned,
// unassigned and needs-custom states side by side.

const TIERS = [800, 1300, 1600, 1900, 2300];

const SAMPLE = [
  { dex:   1, name: 'Bulbasaur',  types: ['grass','poison'],   l15:  422, l25:  703, l35:  915, tier:  800, stars: 2, labels: ['EvolveMe'] },
  { dex:   2, name: 'Ivysaur',    types: ['grass','poison'],   l15:  659, l25: 1098, l35: 1428, tier: null,  stars: null, labels: [] },
  { dex:   3, name: 'Venusaur',   types: ['grass','poison'],   l15: 1078, l25: 1797, l35: 2336, tier: 1900, stars: 3, labels: ['PVP'] },
  { dex:   4, name: 'Charmander', types: ['fire'],             l15:  368, l25:  613, l35:  797, tier: null, stars: 2, labels: [], custom: 790 },
  { dex:   6, name: 'Charizard',  types: ['fire','flying'],    l15: 1147, l25: 1912, l35: 2486, tier: 1900, stars: 3, labels: ['MegaEv'] },
  { dex:   7, name: 'Squirtle',   types: ['water'],            l15:  354, l25:  590, l35:  767, tier: null, stars: 2, labels: [], custom: 760 },
  { dex:   9, name: 'Blastoise',  types: ['water'],            l15:  973, l25: 1622, l35: 2108, tier: 1600, stars: 2, labels: [] },
  { dex:  10, name: 'Caterpie',   types: ['bug'],              l15:  151, l25:  253, l35:  328, tier: null,  stars: null, labels: [] },
  { dex:  13, name: 'Weedle',     types: ['bug','poison'],     l15:  159, l25:  265, l35:  345, tier: null,  stars: null, labels: [] },
  { dex:  16, name: 'Pidgey',     types: ['normal','flying'],  l15:  248, l25:  413, l35:  537, tier: null,  stars: null, labels: [] },
  { dex:  19, name: 'Rattata',    types: ['normal'],           l15:  269, l25:  449, l35:  584, tier: null,  stars: null, labels: [] },
  { dex:  25, name: 'Pikachu',    types: ['electric'],         l15:  351, l25:  585, l35:  760, tier: null, stars: 3, labels: ['Trade4Candy'], custom: 750 },
  { dex:  26, name: 'Raichu',     types: ['electric'],         l15:  856, l25: 1427, l35: 1855, tier: 1300, stars: 2, labels: [] },
  { dex:  32, name: 'Nidoran♂', types: ['poison'],        l15:  319, l25:  532, l35:  692, tier: null,  stars: null, labels: [] },
  { dex:  34, name: 'Nidoking',   types: ['poison','ground'],  l15: 1014, l25: 1691, l35: 2198, tier: 1600, stars: 2, labels: [] },
  { dex:  63, name: 'Abra',       types: ['psychic'],          l15:  510, l25:  850, l35: 1105, tier:  800, stars: 0, labels: ['TTE'] },
  { dex:  64, name: 'Kadabra',    types: ['psychic'],          l15:  802, l25: 1338, l35: 1739, tier: 1300, stars: 0, labels: ['TTE'] },
  { dex:  65, name: 'Alakazam',   types: ['psychic'],          l15: 1214, l25: 2023, l35: 2630, tier: 1900, stars: 3, labels: [] },
  { dex:  68, name: 'Machamp',    types: ['fighting'],         l15: 1215, l25: 2026, l35: 2634, tier: 1900, stars: 2, labels: ['PVP'] },
  { dex:  74, name: 'Geodude',    types: ['rock','ground'],    l15:  494, l25:  823, l35: 1071, tier: null,  stars: null, labels: [] },
  { dex: 113, name: 'Chansey',    types: ['normal'],           l15:  463, l25:  771, l35: 1003, tier:  800, stars: 0, labels: ['GymDef'] },
  { dex: 129, name: 'Magikarp',   types: ['water'],            l15:   88, l25:  147, l35:  192, tier: null,  stars: null, labels: [], custom: 190 },
  { dex: 130, name: 'Gyarados',   types: ['water','flying'],   l15: 1355, l25: 2258, l35: 2935, tier: 2300, stars: 2, labels: ['MegaEv'] },
  { dex: 132, name: 'Ditto',      types: ['normal'],           l15:  308, l25:  513, l35:  668, tier: null,  stars: null, labels: [] },
  { dex: 133, name: 'Eevee',      types: ['normal'],           l15:  404, l25:  673, l35:  875, tier:  800, stars: 3, labels: ['EvolveMe'] },
  { dex: 143, name: 'Snorlax',    types: ['normal'],           l15: 1284, l25: 2140, l35: 2782, tier: 2300, stars: 2, labels: ['GymDef'] },
  { dex: 149, name: 'Dragonite',  types: ['dragon','flying'],  l15: 1520, l25: 2534, l35: 3295, tier: 2300, stars: 2, labels: ['PVP'] },
  { dex: 213, name: 'Shuckle',    types: ['bug','rock'],       l15:  123, l25:  206, l35:  268, tier: null,  stars: null, labels: [] },
  { dex: 242, name: 'Blissey',    types: ['normal'],           l15: 1083, l25: 1805, l35: 2346, tier: 1900, stars: 0, labels: ['GymDef'] },
  { dex: 248, name: 'Tyranitar',  types: ['rock','dark'],      l15: 1538, l25: 2564, l35: 3334, tier: 2300, stars: 2, labels: ['PVP','MegaEv'] },
  { dex: 320, name: 'Wailmer',    types: ['water'],            l15:  558, l25:  931, l35: 1210, tier: null,  stars: null, labels: [] },
  { dex: 321, name: 'Wailord',    types: ['water'],            l15:  888, l25: 1481, l35: 1925, tier: 1300, stars: 0, labels: [] },
  { dex: 376, name: 'Metagross',  types: ['steel','psychic'],  l15: 1520, l25: 2534, l35: 3294, tier: 2300, stars: 3, labels: ['PVP'] },
  { dex: 445, name: 'Garchomp',   types: ['dragon','ground'],  l15: 1591, l25: 2652, l35: 3447, tier: 2300, stars: 2, labels: [] },
  { dex: 659, name: 'Bunnelby',   types: ['normal'],           l15:  197, l25:  329, l35:  428, tier: null,  stars: null, labels: [] },
];

// A species "needs custom" when even its level-35 CP sits below the lowest
// preset — every tier button would be meaningless for it.
function needsCustom(s) { return s.l35 < TIERS[0]; }

function spriteUrl(dex) {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + dex + '.png';
}

const TYPE_COLORS = {
  normal:'#a8a878', fire:'#f08030', water:'#6890f0', electric:'#f8d030',
  grass:'#78c850', ice:'#98d8d8', fighting:'#c03028', poison:'#a040a0',
  ground:'#e0c068', flying:'#a890f0', psychic:'#f85888', bug:'#a8b820',
  rock:'#b8a038', ghost:'#705898', dragon:'#7038f8', dark:'#705848',
  steel:'#b8b8d0', fairy:'#ee99ac',
};

// Repeat the sample to ~350 rows so scrolling and frozen headers can be judged
// honestly. Real app has ~900.
function bulked(times) {
  const out = [];
  for (let i = 0; i < times; i++) {
    for (const s of SAMPLE) out.push({ ...s, _rep: i });
  }
  return out;
}
