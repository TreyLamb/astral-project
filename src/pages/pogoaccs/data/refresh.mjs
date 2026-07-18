#!/usr/bin/env node
// refresh.mjs — regenerate the pogoaccs raid/mega reference dataset.
//
// Plain Node ESM, zero npm deps, global fetch. Two modes:
//   node refresh.mjs             download + rebuild the automatable JSONs
//   node refresh.mjs --validate  no network; integrity-check the existing JSONs
//
// Automated files (this script writes them): species.json, moves.json,
// typeChart.json, cpMultipliers.json, raidBosses.json, megas.json.
// Curated files (hand-maintained, only validated here): raidConstants.json,
// anchors.json. See SOURCES.md for which source is authoritative for what.

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const TODAY = '2026-07-17';
const VALIDATE = process.argv.includes('--validate');

const POGOAPI = 'https://pogoapi.net/api/v1';
const PVPOKE_GM = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json';
const POKEMINERS_GM = 'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json';
const SCRAPEDDUCK_RAIDS = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json';

const VALID_TYPES = new Set(['normal','fire','water','electric','grass','ice','fighting',
  'poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const snake = (s) => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const lc = (s) => String(s).toLowerCase();
const j = (o) => JSON.stringify(o, null, 2) + '\n';
const readJson = (name) => JSON.parse(readFileSync(join(DIR, name), 'utf8'));
// species.json ships in the app bundle, so it is written compact to stay small;
// the smaller reference files are pretty-printed for human diffing.
const writeJson = (name, o, compact = false) => {
  const text = compact ? JSON.stringify(o) + '\n' : j(o);
  writeFileSync(join(DIR, name), text);
  return Buffer.byteLength(text);
};
async function getJson(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'pogoaccs-refresh/1.0' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
// CPM for a half level, per Niantic formula: sqrt((cpm(L)^2 + cpm(L+1)^2) / 2)
const halfCpm = (a, b) => Math.sqrt((a * a + b * b) / 2);
const levelKey = (n2) => String(n2 / 2); // n2 = level*2 -> "45" or "45.5"

// ---------------------------------------------------------------------------
// curation (the parts a scraper cannot decide — cross-referenced, see SOURCES.md)
// ---------------------------------------------------------------------------

// Megas released AFTER the pogoapi mega_pokemon.json snapshot. Confirmed
// released as of 2026-07-17 by theclick.gg + pokemongohub (53 mega forms total;
// Mega Raichu X/Y debut 2026-07-18 so they are deliberately EXCLUDED today).
// Stats/types are pulled live from the PvPoke gamemaster below — not hardcoded.
const NEW_MEGAS = [
  { pv: 'dragonite_mega', id: 'mega_dragonite', base: 'dragonite', dex: 149, name: 'Mega Dragonite' },
  { pv: 'mewtwo_mega_x',  id: 'mega_mewtwo_x',  base: 'mewtwo',    dex: 150, name: 'Mega Mewtwo X' },
  { pv: 'mewtwo_mega_y',  id: 'mega_mewtwo_y',  base: 'mewtwo',    dex: 150, name: 'Mega Mewtwo Y' },
  { pv: 'victreebel_mega',id: 'mega_victreebel',base: 'victreebel',dex: 71,  name: 'Mega Victreebel' },
  { pv: 'skarmory_mega',  id: 'mega_skarmory',  base: 'skarmory',  dex: 227, name: 'Mega Skarmory' },
  { pv: 'malamar_mega',   id: 'mega_malamar',   base: 'malamar',   dex: 687, name: 'Mega Malamar' },
  { pv: 'falinks_mega',   id: 'mega_falinks',   base: 'falinks',   dex: 870, name: 'Mega Falinks' },
];

// A handful of obvious community shorthands.
const ALIASES = {
  tyranitar: ['ttar'], rayquaza: ['ray'], mega_rayquaza: ['mray'], garchomp: ['chomp'],
  metagross: ['meta'], machamp: ['champ'], conkeldurr: ['conk'], rhyperior: ['rhyp'],
  gengar: ['gar'], dragonite: ['dnite'], excadrill: ['exca'], mewtwo: ['mew2'],
};

// ScrapedDuck tier label -> our tier key.
const TIER_MAP = {
  '1-Star Raids': '1', '3-Star Raids': '3', '5-Star Raids': '5',
  'Mega Raids': 'mega', 'Elite Raids': 'elite', 'Primal Raids': 'primal',
};

// Resolve a ScrapedDuck boss display name to a species id. `speciesIds` is the
// Set of ids that actually exist in species.json. Returns { speciesId, shadow }.
function resolveBossSpecies(rawName, speciesIds) {
  let name = rawName;
  let shadow = false;
  if (/^shadow\s+/i.test(name)) { shadow = true; name = name.replace(/^shadow\s+/i, ''); }
  // Costumed Pikachu (many variants) all map to the base species.
  if (/pikachu/i.test(name)) return { speciesId: 'pikachu', shadow };
  // Regional / mega prefixes.
  const prefix = [
    [/^alolan\s+/i, 'alolan_'], [/^galarian\s+/i, 'galarian_'], [/^hisuian\s+/i, 'hisuian_'],
    [/^paldean\s+/i, 'paldea_'], [/^mega\s+/i, 'mega_'], [/^primal\s+/i, 'primal_'],
  ];
  for (const [re, pre] of prefix) {
    if (re.test(name)) {
      const rest = snake(name.replace(re, ''));
      const candidate = pre + rest;
      if (speciesIds.has(candidate)) return { speciesId: candidate, shadow };
    }
  }
  const direct = snake(name);
  if (speciesIds.has(direct)) return { speciesId: direct, shadow };
  return { speciesId: direct, shadow }; // let --validate flag it if truly unknown
}

// id for a non-base form, e.g. Alolan Raichu -> alolan_raichu, Origin Giratina -> giratina_origin
function formId(name, form) {
  const base = snake(name);
  const f = form.toLowerCase();
  if (f === 'alola') return 'alolan_' + base;
  if (f === 'galarian' || f === 'galarian_standard') return 'galarian_' + base;
  if (f === 'galarian_zen') return 'galarian_zen_' + base;
  if (f === 'hisuian') return 'hisuian_' + base;
  if (f.startsWith('paldea')) return snake('paldea ' + f.replace(/^paldea_?/, '') + ' ' + name);
  return base + '_' + snake(form);
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------
async function build() {
  console.log('fetching sources...');
  const [statsRaw, typesRaw, movesRaw, megaRaw, fastRaw, chargedRaw, cpmRaw, typeEff, released, pvpoke, pokeminers, raidsRaw] =
    await Promise.all([
      getJson(`${POGOAPI}/pokemon_stats.json`),
      getJson(`${POGOAPI}/pokemon_types.json`),
      getJson(`${POGOAPI}/current_pokemon_moves.json`),
      getJson(`${POGOAPI}/mega_pokemon.json`),
      getJson(`${POGOAPI}/fast_moves.json`),
      getJson(`${POGOAPI}/charged_moves.json`),
      getJson(`${POGOAPI}/cp_multiplier.json`),
      getJson(`${POGOAPI}/type_effectiveness.json`),
      getJson(`${POGOAPI}/released_pokemon.json`),
      getJson(PVPOKE_GM),
      getJson(POKEMINERS_GM),
      getJson(SCRAPEDDUCK_RAIDS),
    ]);

  const releasedIds = new Set(Object.values(released).map((r) => r.id));

  // ---- moves.json (pogoapi PvE stats == Niantic GAME_MASTER, cross-checked) ----
  const moves = {};
  for (const m of fastRaw) {
    moves[snake(m.name)] = {
      name: m.name, type: lc(m.type), kind: 'fast',
      power: m.power, energyGain: m.energy_delta, duration: m.duration / 1000,
    };
  }
  for (const m of chargedRaw) {
    moves[snake(m.name)] = {
      name: m.name, type: lc(m.type), kind: 'charged',
      power: m.power, energyCost: -m.energy_delta, duration: m.duration / 1000,
    };
  }
  // GAME_MASTER move index — used to fill any move a species references that
  // pogoapi's fast/charged lists have not caught up on yet (e.g. new signatures).
  const titleCase = (id) => id.split('_').map((w) => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
  const gmMoveIndex = new Map();
  for (const t of pokeminers) {
    const ms = t.data?.moveSettings;
    if (!ms || typeof ms.movementId !== 'string') continue;
    const isFast = ms.movementId.endsWith('_FAST');
    const id = snake(ms.movementId.replace(/_FAST$/, ''));
    const type = lc((ms.pokemonType || '').replace('POKEMON_TYPE_', ''));
    const common = { name: titleCase(id), type, kind: isFast ? 'fast' : 'charged', power: ms.power || 0 };
    gmMoveIndex.set(id, isFast
      ? { ...common, energyGain: ms.energyDelta || 0, duration: (ms.durationMs || 0) / 1000 }
      : { ...common, energyCost: -(ms.energyDelta || 0), duration: (ms.durationMs || 0) / 1000 });
  }

  // ---- species.json ----
  // Index pogoapi rows by pokemon_id.
  const statById = new Map();
  for (const s of statsRaw) {
    if (!statById.has(s.pokemon_id)) statById.set(s.pokemon_id, []);
    statById.get(s.pokemon_id).push(s);
  }
  const typeKey = (id, form) => `${id}|${form}`;
  const typeMap = new Map();
  for (const t of typesRaw) typeMap.set(typeKey(t.pokemon_id, t.form), t.type.map(lc));
  const moveMap = new Map();
  for (const m of movesRaw) moveMap.set(typeKey(m.pokemon_id, m.form), m);

  const pickBase = (rows) => rows.find((r) => r.form === 'Normal') || rows[0];
  const typesFor = (id, form, fallbackForm) =>
    typeMap.get(typeKey(id, form)) || typeMap.get(typeKey(id, fallbackForm)) || [];
  const movesFor = (id, form, fallbackForm) =>
    moveMap.get(typeKey(id, form)) || moveMap.get(typeKey(id, fallbackForm)) || null;
  const moveIds = (arr) => (arr || []).map(snake).filter(Boolean);

  const species = {};
  const addSpecies = (id, entry) => { if (!species[id]) species[id] = entry; };

  for (const [id, rows] of statById) {
    if (!releasedIds.has(id)) continue;
    const base = pickBase(rows);
    const baseName = base.pokemon_name;
    const baseTypes = typesFor(id, base.form, 'Normal');
    const baseMoves = movesFor(id, base.form, 'Normal');
    const baseStats = { atk: base.base_attack, def: base.base_defense, sta: base.base_stamina };

    addSpecies(snake(baseName), speciesEntry(baseName, id, baseTypes, baseStats, baseMoves));

    // distinct alternate forms (skip cosmetics: kept only if types or stats differ)
    for (const r of rows) {
      if (r === base) continue;
      const t = typesFor(id, r.form, base.form);
      const sameTypes = JSON.stringify(t) === JSON.stringify(baseTypes);
      const sameStats = r.base_attack === base.base_attack &&
        r.base_defense === base.base_defense && r.base_stamina === base.base_stamina;
      if (sameTypes && sameStats) continue; // cosmetic / costume duplicate
      const fid = formId(baseName, r.form);
      const fMoves = movesFor(id, r.form, base.form);
      const stats = { atk: r.base_attack, def: r.base_defense, sta: r.base_stamina };
      addSpecies(fid, speciesEntry(displayForm(baseName, r.form), id, t, stats, fMoves));
    }
  }

  // ---- megas + primals into species.json, and megas.json list ----
  const megasList = [];
  for (const m of megaRaw) {
    const baseId = snake(m.pokemon_name);
    let id;
    const isPrimal = /^primal/i.test(m.mega_name);
    if (isPrimal) id = 'primal_' + baseId;
    else if (m.form === 'X') id = 'mega_' + baseId + '_x';
    else if (m.form === 'Y') id = 'mega_' + baseId + '_y';
    else id = 'mega_' + baseId;
    const baseSp = species[baseId];
    addSpecies(id, {
      name: m.mega_name, base: baseId, dex: m.pokemon_id, types: m.type.map(lc),
      baseStats: { atk: m.stats.base_attack, def: m.stats.base_defense, sta: m.stats.base_stamina },
      fastMoves: baseSp ? baseSp.fastMoves : [], chargedMoves: baseSp ? baseSp.chargedMoves : [],
    });
    megasList.push({ id, base: baseId, dex: m.pokemon_id });
  }

  // newer megas (data from PvPoke, curated allowlist)
  const pvById = new Map(pvpoke.pokemon.map((p) => [p.speciesId, p]));
  for (const nm of NEW_MEGAS) {
    const p = pvById.get(nm.pv);
    if (!p) { console.warn(`  ! PvPoke missing ${nm.pv}, skipped`); continue; }
    const baseSp = species[nm.base];
    addSpecies(nm.id, {
      name: nm.name, base: nm.base, dex: nm.dex,
      types: p.types.filter((t) => t !== 'none'),
      baseStats: { atk: p.baseStats.atk, def: p.baseStats.def, sta: p.baseStats.hp },
      fastMoves: baseSp ? baseSp.fastMoves : [], chargedMoves: baseSp ? baseSp.chargedMoves : [],
    });
    megasList.push({ id: nm.id, base: nm.base, dex: nm.dex });
  }
  megasList.sort((a, b) => a.dex - b.dex || a.id.localeCompare(b.id));
  const megasOut = { _meta: metaMegas(), megas: megasList.map(({ id, base }) => ({ id, base })) };

  // aliases
  for (const [id, al] of Object.entries(ALIASES)) if (species[id]) species[id].aliases = al;

  const speciesOut = { _meta: metaSpecies(), species };

  // ---- typeChart.json ----
  const chart = {};
  for (const [atk, row] of Object.entries(typeEff)) {
    const a = lc(atk);
    for (const [def, mult] of Object.entries(row)) {
      if (mult === 1) continue;
      (chart[a] ||= {})[lc(def)] = mult;
    }
  }
  const typeChartOut = { _meta: metaTypeChart(), ...chart };

  // ---- cpMultipliers.json ----
  // levels 1..45 from pogoapi (whole + half), 46..51 whole from PokeMiners
  // GAME_MASTER, 45.5..50.5 half via Niantic formula.
  const cpmByLevel = new Map();
  for (const row of cpmRaw) cpmByLevel.set(row.level, row.multiplier);
  const plSettings = pokeminers.find((t) => t.templateId === 'PLAYER_LEVEL_SETTINGS')?.data?.playerLevel;
  if (!plSettings?.cpMultiplier) throw new Error('GAME_MASTER PLAYER_LEVEL_SETTINGS.playerLevel.cpMultiplier not found');
  const gmCpm = plSettings.cpMultiplier; // index i -> whole level i+1
  const wholeCpm = (L) => gmCpm[L - 1];
  const cpm = {};
  for (let n2 = 2; n2 <= 102; n2++) {
    const L = n2 / 2;
    if (cpmByLevel.has(L)) { cpm[levelKey(n2)] = cpmByLevel.get(L); continue; }
    if (Number.isInteger(L)) cpm[levelKey(n2)] = wholeCpm(L);
    else cpm[levelKey(n2)] = round8(halfCpm(wholeCpm(L - 0.5), wholeCpm(L + 0.5)));
  }
  const cpmOut = { _meta: metaCpm(), ...cpm };

  // ---- supplement moves.json for anything species reference but pogoapi lacks ----
  const referenced = new Set();
  for (const s of Object.values(species))
    for (const k of ['fastMoves', 'chargedMoves', 'eliteMoves'])
      for (const m of s[k] || []) referenced.add(m);
  let filled = 0;
  for (const id of referenced) {
    if (moves[id]) continue;
    const gm = gmMoveIndex.get(id);
    if (gm) { moves[id] = gm; filled++; }
  }
  if (filled) console.log(`  supplemented ${filled} move(s) from GAME_MASTER`);

  // ---- raidBosses.json (current rotation from ScrapedDuck) ----
  const speciesIds = new Set(Object.keys(species));
  const usedIds = new Set();
  const bosses = [];
  const eliteOf = (sp, kind) => (sp.eliteMoves || []).filter((m) => moves[m]?.kind === kind);
  const uniq = (a) => [...new Set(a)];
  for (const b of raidsRaw) {
    const tier = TIER_MAP[b.tier];
    if (!tier) { console.warn(`  ! unknown tier "${b.tier}" for ${b.name}, skipped`); continue; }
    const { speciesId } = resolveBossSpecies(b.name, speciesIds);
    let id = snake(b.name); // ScrapedDuck names already carry "Shadow"/"Mega"/regional prefixes
    while (usedIds.has(id)) id += '_x';
    usedIds.add(id);
    const sp = species[speciesId];
    bosses.push({
      id, speciesId, tier,
      // full raid movepool = standard moves + elite/legacy options (what a boss can spawn with)
      fastMoves: sp ? uniq([...sp.fastMoves, ...eliteOf(sp, 'fast')]) : [],
      chargedMoves: sp ? uniq([...sp.chargedMoves, ...eliteOf(sp, 'charged')]) : [],
      endsAt: null,
    });
  }
  const raidBossesOut = { _meta: metaRaidBosses(), bosses };

  // ---- write ----
  const written = {
    'moves.json': writeJson('moves.json', { _meta: metaMoves(), ...moves }),
    'species.json': writeJson('species.json', speciesOut, true),
    'typeChart.json': writeJson('typeChart.json', typeChartOut),
    'cpMultipliers.json': writeJson('cpMultipliers.json', cpmOut),
    'megas.json': writeJson('megas.json', megasOut),
    'raidBosses.json': writeJson('raidBosses.json', raidBossesOut),
  };
  for (const [f, bytes] of Object.entries(written)) {
    console.log(`  wrote ${f.padEnd(20)} ${(bytes / 1024).toFixed(1)} KB`);
  }
  console.log(`  species: ${Object.keys(species).length}, moves: ${Object.keys(moves).length}, ` +
    `megas: ${megasList.length}, bosses: ${bosses.length}`);
  console.log('done. (raidConstants.json + anchors.json are curated — not regenerated)');
}

function speciesEntry(name, dex, types, stats, mv) {
  const e = {
    name, dex, types,
    baseStats: stats,
    fastMoves: mv ? moveIdList(mv.fast_moves) : [],
    chargedMoves: mv ? moveIdList(mv.charged_moves) : [],
  };
  const elite = [...(mv?.elite_fast_moves || []), ...(mv?.elite_charged_moves || [])];
  if (elite.length) e.eliteMoves = elite.map(snake).filter(Boolean);
  e.aliases = [];
  return e;
}
const moveIdList = (arr) => (arr || []).map(snake).filter(Boolean);
function displayForm(name, form) {
  const f = form.toLowerCase();
  if (f === 'alola') return 'Alolan ' + name;
  if (f.startsWith('galarian')) return 'Galarian ' + name;
  if (f === 'hisuian') return 'Hisuian ' + name;
  return name + ' (' + form.replace(/_/g, ' ') + ')';
}
const round8 = (x) => Math.round(x * 1e8) / 1e8;

// _meta blocks
const SRC = {
  pogoapi: 'https://pogoapi.net/ (Niantic GAME_MASTER mirror)',
  pvpoke: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json',
  pokeminers: 'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json',
  scrapedduck: 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json (LeekDuck scrape)',
};
const metaMoves = () => ({ updated: TODAY, note: 'PvE (raid) move stats', sources: [SRC.pogoapi, SRC.pokeminers] });
const metaSpecies = () => ({ updated: TODAY, note: 'Released species/forms + all mega/primal forms', sources: [SRC.pogoapi, SRC.pvpoke] });
const metaTypeChart = () => ({ updated: TODAY, note: 'GO type effectiveness; non-1.0 entries only', sources: [SRC.pogoapi] });
const metaCpm = () => ({ updated: TODAY, note: 'Levels 1-51 in 0.5 steps; 46-51 from GAME_MASTER, half-levels via sqrt formula', sources: [SRC.pogoapi, SRC.pokeminers] });
const metaMegas = () => ({ updated: TODAY, note: 'Complete released mega + primal list', sources: [SRC.pogoapi, SRC.pvpoke, 'https://www.theclick.gg/pokemon-go-mega-evolutions/'] });
const metaRaidBosses = () => ({ updated: TODAY, note: 'Current raid rotation', sources: [SRC.scrapedduck] });

// ---------------------------------------------------------------------------
// validate (no network)
// ---------------------------------------------------------------------------
function validate() {
  const errors = [];
  const files = ['species.json', 'moves.json', 'typeChart.json', 'cpMultipliers.json',
    'raidConstants.json', 'megas.json', 'raidBosses.json', 'anchors.json'];
  const data = {};
  for (const f of files) {
    try { data[f] = readJson(f); }
    catch (e) { errors.push(`cannot read/parse ${f}: ${e.message}`); }
  }
  if (errors.length) return finish(errors);

  const species = data['species.json'].species;
  const moves = data['moves.json'];
  const speciesIds = new Set(Object.keys(species));
  const moveIds = new Set(Object.keys(moves).filter((k) => k !== '_meta'));

  // species moves resolve
  for (const [id, s] of Object.entries(species)) {
    for (const key of ['fastMoves', 'chargedMoves', 'eliteMoves']) {
      for (const mv of s[key] || []) if (!moveIds.has(mv)) errors.push(`species ${id}: move '${mv}' not in moves.json`);
    }
    if (s.base && !speciesIds.has(s.base)) errors.push(`species ${id}: base '${s.base}' not in species.json`);
    for (const t of s.types || []) if (!VALID_TYPES.has(t)) errors.push(`species ${id}: invalid type '${t}'`);
  }

  // megas
  for (const m of data['megas.json'].megas) {
    if (!speciesIds.has(m.id)) errors.push(`megas: id '${m.id}' not in species.json`);
    if (!speciesIds.has(m.base)) errors.push(`megas: base '${m.base}' not in species.json`);
  }

  // raid bosses
  for (const b of data['raidBosses.json'].bosses) {
    if (!speciesIds.has(b.speciesId)) errors.push(`raidBosses ${b.id}: speciesId '${b.speciesId}' not in species.json`);
    for (const mv of [...(b.fastMoves || []), ...(b.chargedMoves || [])])
      if (!moveIds.has(mv)) errors.push(`raidBosses ${b.id}: move '${mv}' not in moves.json`);
  }

  // cpm coverage 1..51 step 0.5
  const cpm = data['cpMultipliers.json'];
  for (let n2 = 2; n2 <= 102; n2++) {
    const k = String(n2 / 2);
    if (typeof cpm[k] !== 'number' || !(cpm[k] > 0)) errors.push(`cpMultipliers: missing/invalid level ${k}`);
  }

  // type chart
  const tc = data['typeChart.json'];
  for (const [atk, row] of Object.entries(tc)) {
    if (atk === '_meta') continue;
    if (!VALID_TYPES.has(atk)) errors.push(`typeChart: invalid attack type '${atk}'`);
    for (const def of Object.keys(row)) if (!VALID_TYPES.has(def)) errors.push(`typeChart: invalid defend type '${def}'`);
  }

  // raid constants
  const rc = data['raidConstants.json'];
  for (const tier of ['1', '3', '5', 'mega', 'elite', 'primal']) {
    const t = rc.tiers?.[tier];
    if (!t) { errors.push(`raidConstants: missing tier '${tier}'`); continue; }
    for (const f of ['hp', 'cpm', 'timerSec']) if (typeof t[f] !== 'number') errors.push(`raidConstants tier ${tier}: missing '${f}'`);
  }
  if (typeof rc.shadow?.atkMult !== 'number' || typeof rc.shadow?.defMult !== 'number')
    errors.push('raidConstants: shadow atkMult/defMult missing');

  // anchors
  const bossIds = new Set(data['raidBosses.json'].bosses.map((b) => b.id));
  for (const a of data['anchors.json'].anchors) {
    if (!bossIds.has(a.bossId)) errors.push(`anchors: bossId '${a.bossId}' not in raidBosses.json`);
    for (const c of a.topCounters || []) {
      if (!speciesIds.has(c.speciesId)) errors.push(`anchors ${a.bossId}: counter '${c.speciesId}' not in species.json`);
      if (c.fastMove && !moveIds.has(c.fastMove)) errors.push(`anchors ${a.bossId}: fastMove '${c.fastMove}' not in moves.json`);
      if (c.chargedMove && !moveIds.has(c.chargedMove)) errors.push(`anchors ${a.bossId}: chargedMove '${c.chargedMove}' not in moves.json`);
    }
  }

  // meta ages
  console.log('file freshness:');
  const now = new Date(TODAY + 'T00:00:00Z').getTime();
  for (const f of files) {
    const u = data[f]?._meta?.updated;
    const age = u ? Math.round((now - new Date(u + 'T00:00:00Z').getTime()) / 86400000) : '??';
    console.log(`  ${f.padEnd(20)} updated ${u || '(none)'}  (${age} days old)`);
  }
  return finish(errors);
}

function finish(errors) {
  if (errors.length) {
    console.error(`\nVALIDATION FAILED (${errors.length}):`);
    for (const e of errors.slice(0, 60)) console.error('  - ' + e);
    if (errors.length > 60) console.error(`  ... and ${errors.length - 60} more`);
    process.exit(1);
  }
  console.log('\nvalidation OK');
}

// ---------------------------------------------------------------------------
if (VALIDATE) validate();
else build().catch((e) => { console.error(e); process.exit(1); });
