// buildSpeciesFacts.mjs -- generates data/speciesFacts.json from REAL PokeAPI
// data (genus, flavor text, height/weight, legendary/mythical status) for
// every canonical species in the MedalDex Pokedex list. Not strategy content
// -- playful fun-facts + a light FAQ per species, per MedalDexPlan.md
// decision #2.
//
// Run with: node buildSpeciesFacts.mjs   (from this directory, or anywhere --
// paths below are resolved relative to this file, not cwd)
//
// Re-runs are cheap: the handful of fields actually used (genus, one
// flavor-text line, legendary/mythical flags, height/weight) are cached in
// pokeapiCache.json next to this script, keyed by dex number -- NOT the raw
// API payloads (those run ~150-200KB/species across both endpoints, mostly
// sprite URLs/moves/multi-language text nothing here uses; the distilled
// cache is a few hundred bytes/species instead). Only newly-missing species
// trigger network calls on a second run.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPECIES_JSON_PATH = path.join(__dirname, '../../pogoaccs/data/species.json');
const MEGAS_JSON_PATH = path.join(__dirname, '../../pogoaccs/data/megas.json');
const FEASIBILITY_JSON_PATH = path.join(__dirname, 'feasibility.json');
const OUT_PATH = path.join(__dirname, 'speciesFacts.json');
const CACHE_PATH = path.join(__dirname, 'pokeapiCache.json');

const speciesJson = JSON.parse(fs.readFileSync(SPECIES_JSON_PATH, 'utf8'));
const megasJson = JSON.parse(fs.readFileSync(MEGAS_JSON_PATH, 'utf8'));
const feasibilityJson = JSON.parse(fs.readFileSync(FEASIBILITY_JSON_PATH, 'utf8'));
const SPECIES = speciesJson.species;

// ---------------------------------------------------------------------
// Reconstruct the canonical National-Dex list EXACTLY as
// src/pages/medaldex/medaldexEngine.js does (one row per dex number,
// preferring the non-form id) so speciesFacts.json's keys line up 1:1
// with what the app actually renders per dex slot. Kept in sync by hand
// with that file -- see its own comment block for why the fallback exists.
// ---------------------------------------------------------------------
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
  if (FORM_PREFIXES.some((p) => id.startsWith(p))) return true;
  if (FORM_SUFFIXES.some((s) => id.endsWith(s))) return true;
  return false;
}
function buildDexList() {
  const byDex = new Map();
  Object.keys(SPECIES).forEach((id) => {
    const dex = SPECIES[id].dex;
    if (dex == null) return;
    if (!byDex.has(dex)) byDex.set(dex, []);
    byDex.get(dex).push(id);
  });
  const list = [];
  byDex.forEach((ids, dex) => {
    const nonForm = ids.filter((id) => !isFormId(id));
    const canonicalId = nonForm.length >= 1
      ? nonForm[0]
      : ids.slice().sort((a, b) => a.length - b.length)[0];
    list.push({ id: canonicalId, dex, name: SPECIES[canonicalId].name, types: SPECIES[canonicalId].types });
  });
  list.sort((a, b) => a.dex - b.dex);
  return list;
}
const DEX_LIST = buildDexList();

const MEGA_CAPABLE = new Set((megasJson.megas || []).map((m) => m.base));

// ---------------------------------------------------------------------
// Cache + throttled fetch with retry
// ---------------------------------------------------------------------
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { cache = {}; }
}
let sinceLastSave = 0;
function saveCacheThrottled(force = false) {
  sinceLastSave += 1;
  if (force || sinceLastSave >= 25) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
    sinceLastSave = 0;
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJsonWithRetry(url, { retries = 5, baseDelay = 300 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return { ok: false, notFound: true };
      if (res.status === 429) {
        await sleep(baseDelay * (attempt + 2));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ok: true, data: json };
    } catch (err) {
      if (attempt === retries) return { ok: false, error: err.message };
      await sleep(baseDelay * (attempt + 1));
    }
  }
  return { ok: false, error: 'exhausted retries' };
}

// Fetches both PokeAPI endpoints for one dex number and distills them down
// to just the fields buildRecords()/buildFunFact()/buildFaq() use. Returns
// the distilled record, or null if either endpoint genuinely has nothing
// for this dex number (a hard failure -- not cached, so it retries on the
// next run instead of being remembered as permanently missing).
async function fetchDistilledRecord(dex) {
  const [speciesResult, pokemonResult] = await Promise.all([
    fetchJsonWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${dex}`),
    fetchJsonWithRetry(`https://pokeapi.co/api/v2/pokemon/${dex}`),
  ]);
  if (!speciesResult.ok || !pokemonResult.ok) return null;

  const speciesData = speciesResult.data;
  const pokemonData = pokemonResult.data;
  const genusEntry = (speciesData.genera || []).find((g) => g.language?.name === 'en');
  const flavorEntry = (speciesData.flavor_text_entries || []).find((f) => f.language?.name === 'en');

  return {
    genus: genusEntry ? genusEntry.genus : null,
    flavor: flavorEntry ? cleanFlavorText(flavorEntry.flavor_text) : null,
    isLegendary: !!speciesData.is_legendary,
    isMythical: !!speciesData.is_mythical,
    heightDm: pokemonData.height,
    weightHg: pokemonData.weight,
  };
}

async function getCachedRecord(dex) {
  const key = String(dex);
  if (cache[key] !== undefined) return cache[key];
  const record = await fetchDistilledRecord(dex);
  if (record) {
    cache[key] = record;
    saveCacheThrottled();
  }
  return record; // null is NOT cached -- lets a transient failure retry later
}

// ---------------------------------------------------------------------
// Small async worker pool -- polite concurrency, still throttled per-worker
// ---------------------------------------------------------------------
async function runPool(items, worker, concurrency = 6) {
  let idx = 0;
  const results = new Array(items.length);
  async function runOne() {
    while (idx < items.length) {
      const my = idx++;
      results[my] = await worker(items[my], my);
      await sleep(45 + Math.floor(Math.random() * 20)); // 45-65ms throttle per worker slot
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runOne);
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------
// Unit conversion + text helpers
// ---------------------------------------------------------------------
function formatHeight(dm) {
  const meters = dm / 10;
  const totalInches = meters * 39.3701;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) { feet += 1; inches = 0; }
  return `${feet}'${String(inches).padStart(2, '0')}"`;
}
function formatWeightLbs(hg) {
  const kg = hg / 10;
  const lbs = kg * 2.20462;
  return Math.round(lbs * 10) / 10;
}
function cleanFlavorText(text) {
  if (!text) return '';
  return text
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    // Early-generation flavor text stores "Pokemon" as all-caps "POKeMON"
    // (an artifact of the original game's text encoding) -- same word,
    // normalized so it doesn't read as shouting mid-sentence.
    .replace(/POK[EÉeé]MON/g, 'Pokémon')
    .trim();
}
function firstSentence(text) {
  const cleaned = cleanFlavorText(text);
  const m = cleaned.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : cleaned;
}
function lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

// ---------------------------------------------------------------------
// Step 1: fetch pokemon-species + pokemon for every canonical dex entry
// ---------------------------------------------------------------------
async function fetchAll() {
  console.log(`Fetching PokeAPI data for ${DEX_LIST.length} canonical species...`);
  let done = 0;
  const raw = await runPool(DEX_LIST, async (entry) => {
    const record = await getCachedRecord(entry.dex);
    done += 1;
    if (done % 100 === 0) console.log(`  ...${done}/${DEX_LIST.length}`);
    return { entry, record };
  }, 6);
  saveCacheThrottled(true);

  // Retry sweep for anything that came back null (transient failures aren't
  // cached, so they're still fetchable here) before finally giving up.
  const missing = raw.filter((r) => r.record == null);
  if (missing.length) {
    console.log(`Retry sweep for ${missing.length} incomplete entries...`);
    await runPool(missing, async (r) => {
      r.record = await getCachedRecord(r.entry.dex);
      return r;
    }, 4);
    saveCacheThrottled(true);
  }
  return raw;
}

// ---------------------------------------------------------------------
// Step 2: build per-species stat records + dataset-wide percentiles so
// fun facts can lean on REAL relative extremes ("one of the lightest for
// its height in the game") instead of generic filler.
// ---------------------------------------------------------------------
function percentileRank(sortedValues, value) {
  // % of the dataset at or below this value (binary search would be
  // faster but 936 entries is trivial either way)
  let countLE = 0;
  for (const v of sortedValues) if (v <= value) countLE++;
  return (countLE / sortedValues.length) * 100;
}

function buildRecords(raw) {
  const records = [];
  const failures = [];
  raw.forEach(({ entry, record }) => {
    if (!record) {
      failures.push(entry);
      return;
    }
    const { heightDm, weightHg } = record;
    const heightM = heightDm / 10;
    const weightKg = weightHg / 10;
    records.push({
      id: entry.id,
      dex: entry.dex,
      name: entry.name,
      types: entry.types || [],
      genus: record.genus,
      flavor: record.flavor,
      isLegendary: record.isLegendary,
      isMythical: record.isMythical,
      heightDm,
      weightHg,
      heightM,
      weightKg,
      bmi: weightKg / (heightM * heightM),
      heightStr: formatHeight(heightDm),
      weightLbs: formatWeightLbs(weightHg),
    });
  });

  const heights = records.map((r) => r.heightM).sort((a, b) => a - b);
  const weights = records.map((r) => r.weightKg).sort((a, b) => a - b);
  const bmis = records.map((r) => r.bmi).sort((a, b) => a - b);

  records.forEach((r) => {
    r.heightPct = percentileRank(heights, r.heightM);
    r.weightPct = percentileRank(weights, r.weightKg);
    r.bmiPct = percentileRank(bmis, r.bmi);
  });

  return { records, failures };
}

// ---------------------------------------------------------------------
// Step 3: fun fact + FAQ generation. Multiple phrasing templates per
// "angle" (chosen deterministically from dex number so re-runs are
// stable) so 900+ entries don't all read identically.
// ---------------------------------------------------------------------
function pick(templates, seed) {
  return templates[seed % templates.length];
}

function buildFunFact(r) {
  const { name, genus, heightStr, weightLbs, dex } = r;
  const flavor = firstSentence(r.flavor);

  // Priority order matters: a skewed weight-for-height ratio (BMI) is the
  // genuinely "fun" quirk (Trey's own example -- Wailord, 47' but only
  // 877 lbs, "basically a balloon") and should win even when a species is
  // ALSO merely tall/short/heavy/light in absolute terms (Wailord and Onix
  // both are). Plain height/weight extremes are the fallback quirk, and
  // genus+flavor-text is the fallback for everything statistically average.
  let angle;
  if (r.bmiPct <= 8) angle = 'bmi_low';
  else if (r.bmiPct >= 92) angle = 'bmi_high';
  else if (r.heightPct >= 95) angle = 'height_high';
  else if (r.heightPct <= 5) angle = 'height_low';
  else if (r.weightPct >= 95) angle = 'weight_high';
  else if (r.weightPct <= 5) angle = 'weight_low';
  else angle = 'genus_flavor';

  const genusPhrase = genus ? `the ${genus}` : 'a Pokemon';

  const templatesByAngle = {
    bmi_low: [
      `${name}, ${genusPhrase}, is ${heightStr} tall but only ${weightLbs} lbs -- basically a balloon.`,
      `Don't let the ${heightStr} frame fool you: ${name} weighs just ${weightLbs} lbs, shockingly light for something that size.`,
      `${name} stretches to ${heightStr} yet tips the scale at a feathery ${weightLbs} lbs.`,
      `For something ${heightStr} tall, ${name} is suspiciously light at ${weightLbs} lbs -- one of the least dense builds in the whole dex.`,
    ],
    bmi_high: [
      `${name} is only ${heightStr} tall but packs ${weightLbs} lbs onto that frame -- dense in a way its height doesn't warn you about.`,
      `At ${heightStr}, ${name} looks manageable, right up until you try to lift its ${weightLbs} lbs.`,
      `${name}, ${genusPhrase}, is proof size isn't everything: ${heightStr} tall, ${weightLbs} lbs heavy, among the densest Pokemon around.`,
      `Don't judge ${name} by its ${heightStr} height -- ${weightLbs} lbs says otherwise.`,
    ],
    height_high: [
      `${name} towers at ${heightStr} -- taller than almost every other Pokemon in the dex.`,
      `${name}, ${genusPhrase}, stands ${heightStr} tall, one of the biggest builds you'll run into.`,
      `At a staggering ${heightStr}, ${name} is one of the tallest Pokemon that exists.`,
    ],
    height_low: [
      `${name} measures a mere ${heightStr} tall, one of the tiniest Pokemon around.`,
      `At just ${heightStr}, ${name} is pocket-sized even by Pokemon standards.`,
      `${name}, ${genusPhrase}, barely clears ${heightStr} -- among the shortest in the entire dex.`,
    ],
    weight_high: [
      `${name} weighs a whopping ${weightLbs} lbs -- near the top of the scoreboard for the whole Pokedex.`,
      `${name}, ${genusPhrase}, tips the scales at ${weightLbs} lbs, heavier than almost everything else out there.`,
      `${weightLbs} lbs. That's ${name} for you -- one of the heaviest Pokemon in the game.`,
    ],
    weight_low: [
      `${name} weighs next to nothing at ${weightLbs} lbs, among the lightest Pokemon that exist.`,
      `${name} is a featherweight: just ${weightLbs} lbs on the scale.`,
      `At a mere ${weightLbs} lbs, ${name} barely tips the scale at all.`,
    ],
    genus_flavor: flavor ? [
      `${name}, ${genusPhrase}, stands ${heightStr} tall and weighs ${weightLbs} lbs. ${flavor}`,
      `Pokedex files ${name} as ${genusPhrase} -- ${heightStr}, ${weightLbs} lbs, and ${lowerFirst(flavor)}`,
      `${flavor} That's ${name} for you: ${genusPhrase}, ${heightStr} tall, ${weightLbs} lbs.`,
    ] : [
      `${name}, ${genusPhrase}, stands ${heightStr} tall and weighs ${weightLbs} lbs.`,
      `${name} checks in at ${heightStr} and ${weightLbs} lbs -- officially classified as ${genusPhrase}.`,
    ],
  };

  const templates = templatesByAngle[angle];
  return pick(templates, dex);
}

function buildFaq(r) {
  const { id, name, types, dex } = r;
  const typeList = types.length > 1 ? `${types[0]} / ${types[1]}` : (types[0] || 'unknown');

  const sizeAnswers = [
    `${name} measures ${r.heightStr} and weighs ${r.weightLbs} lbs, officially the Pokedex's ${r.genus || 'entry for this species'}.`,
    `Official Pokedex stats: ${r.heightStr} tall, ${r.weightLbs} lbs.`,
  ];
  const q1 = { q: `How big is ${name}?`, a: pick(sizeAnswers, dex) };

  const typeAnswers = types.length > 1
    ? [`${name} is a dual ${typeList} type.`, `${name} carries both the ${types[0]} and ${types[1]} types.`]
    : [`${name} is a pure ${typeList} type.`, `${name} carries only the ${typeList} type.`];
  const q2 = { q: `What type is ${name}?`, a: pick(typeAnswers, dex + 1) };

  let q3;
  if (r.isMythical) {
    q3 = { q: `Is ${name} a Mythical Pokemon?`, a: `Yes -- ${name} is classified as a Mythical Pokemon, one of the rarest tiers in the series.` };
  } else if (r.isLegendary) {
    q3 = { q: `Is ${name} Legendary?`, a: `Yes, ${name} is classified as a Legendary Pokemon.` };
  } else if (MEGA_CAPABLE.has(id)) {
    q3 = { q: `Can ${name} Mega Evolve in GO?`, a: `Yes -- ${name} has a Mega Evolution available in Pokemon GO.` };
  } else if (feasibilityJson.shinyReleased?.[id]) {
    q3 = { q: `Is Shiny ${name} available?`, a: `Yes, Shiny ${name} has been released in Pokemon GO.` };
  } else {
    q3 = { q: `Is Shiny ${name} available?`, a: `Not yet -- ${name}'s Shiny form hasn't been released in Pokemon GO as of this writing.` };
  }

  return [q1, q2, q3];
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
async function main() {
  const raw = await fetchAll();
  const { records, failures } = buildRecords(raw);

  const out = {};
  records.forEach((r) => {
    out[r.id] = {
      funFact: buildFunFact(r),
      faq: buildFaq(r),
    };
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');

  console.log('----------------------------------------');
  console.log(`Wrote ${Object.keys(out).length}/${DEX_LIST.length} species to ${OUT_PATH}`);
  if (failures.length) {
    console.log(`FAILED to fetch ${failures.length} species after retries:`);
    failures.forEach((f) => console.log(`  dex ${f.dex} -- ${f.id} (${f.name})`));
  } else {
    console.log('All species fetched successfully -- 100% coverage.');
  }
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
