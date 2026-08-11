// The species table behind the CP matrix: one canonical row per dex number,
// with CP computed at the reference levels.
//
// Why not import medaldexEngine's DEX_LIST, which already does the
// form-collapsing? Because that module also imports speciesFacts.json (545 KB),
// medals.json and feasibility.json — ~600 KB of data this app never touches.
// The collapsing logic is ~25 lines, so it's cheaper to repeat it than to drag
// all that into the bundle. The FORM_ lists below are deliberately kept
// identical to medaldexEngine's so both apps agree on what "one species" means.
//
// CP math is imported, not reimplemented — computeCp is the same function POGO
// Accs rates raid lineups with.

// Import attributes and explicit .js extensions so this loads under Node too,
// not just Vite — anything in this folder is liable to end up in a .mjs check
// script sooner or later, and Node is strict about both.
import speciesJson from '../pogoaccs/data/species.json' with { type: 'json' };
import cpMultipliers from '../pogoaccs/data/cpMultipliers.json' with { type: 'json' };
import { computeCp } from '../pogoaccs/engine/stats.js';
import { REFERENCE_LEVELS } from './pogofiltersConfig.js';

const SPECIES = speciesJson.species;

// Average wild IVs. Matches cp_table_generator.py's AVG_IV, so the numbers here
// line up with the cp_table.csv Trey has been sorting from.
const AVG_IVS = { atk: 7, def: 7, sta: 7 };

const FORM_PREFIXES = ['mega_', 'primal_', 'alolan_', 'galarian_', 'hisuian_', 'paldea_'];
const FORM_SUFFIXES = [
  '_origin', '_therian', '_sky', '_attack', '_defense', '_speed',
  '_rainy', '_snowy', '_sunny', '_sandy', '_trash',
  '_fan', '_frost', '_heat', '_mow', '_wash',
  '_zen', '_standard', '_pirouette', '_shield',
  '_large', '_small', '_super',
  '_complete_fifty_percent', '_complete_ten_percent', '_fifty_percent', '_ten_percent',
  '_unbound', '_pau', '_pompom', '_sensu',
  '_midday', '_midnight', '_dawn_wings', '_dusk_mane', '_ultra',
  '_male', '_female', '_hero', '_eternamax', '_single_strike',
  '_black', '_white', '_a',
];

function isFormId(id) {
  return FORM_PREFIXES.some((p) => id.startsWith(p)) || FORM_SUFFIXES.some((s) => id.endsWith(s));
}

function build() {
  const byDex = new Map();
  for (const id of Object.keys(SPECIES)) {
    const dex = SPECIES[id].dex;
    if (dex == null) continue;
    if (!byDex.has(dex)) byDex.set(dex, []);
    byDex.get(dex).push(id);
  }

  const rows = [];
  byDex.forEach((ids, dex) => {
    const nonForm = ids.filter((id) => !isFormId(id));
    const canonicalId = nonForm.length
      ? nonForm[0]
      : ids.slice().sort((a, b) => a.length - b.length)[0];
    const entry = SPECIES[canonicalId];
    if (!entry?.baseStats) return;

    const cp = {};
    for (const lvl of REFERENCE_LEVELS) cp[lvl] = computeCp(entry, lvl, AVG_IVS, cpMultipliers);

    rows.push({
      dex,
      id: canonicalId,
      name: entry.name,
      types: entry.types || [],
      baseStats: entry.baseStats,
      cp,
      // The highest reference level is the species' practical ceiling for the
      // "needs custom" check — a species that can't reach the lowest preset
      // even here can never reach it in play.
      maxCp: cp[REFERENCE_LEVELS[REFERENCE_LEVELS.length - 1]],
      altForms: ids.filter((id) => id !== canonicalId).sort(),
    });
  });

  rows.sort((a, b) => a.dex - b.dex);
  return rows;
}

export const SPECIES_ROWS = build();

export const SPECIES_BY_DEX = new Map(SPECIES_ROWS.map((s) => [s.dex, s]));

export const ALL_TYPES = [...new Set(SPECIES_ROWS.flatMap((s) => s.types))].sort();

// PokeAPI official artwork, same mirror and URL pattern MedalDex uses
// (medaldexConfig.js:81) so the browser cache is shared between the two apps.
export function officialArtworkUrl(dex) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
}
