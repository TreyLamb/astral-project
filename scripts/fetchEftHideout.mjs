// Regenerates src/pages/eftShopping/data/hideoutSnapshot.json.
//
//   node scripts/fetchEftHideout.mjs          (or: npm run eft:snapshot)
//
// The snapshot is the offline/degraded-mode fallback for the EFT Shopping tool.
// At runtime the app prefers a live tarkov.dev fetch; the snapshot is what it
// renders when that fetch fails, and what it renders instantly on a cold load
// while the live fetch is still in flight.
//
// Two sources, in order:
//   1. tarkov.dev GraphQL — everything, in the exact shape the app expects.
//   2. SPT game-file mirror — raw BSG hideout data + the English locale. Used
//      only when tarkov.dev is unreachable (its Cloudflare worker 422s during
//      an outage). Produces the same shape, minus the fields BSG's own files
//      don't carry (see FALLBACK_GAPS below).
//
// Prices ARE included, timestamped, and treated as stale-by-default by the app
// — a week-old price is far more useful than no price when the API is down.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  hideoutQuery, ammoQuery, provisionQuery, normalizeTarkovDev,
} from '../src/pages/eftShopping/eftNormalize.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'hideoutSnapshot.json');

const API = 'https://api.tarkov.dev/graphql';
const SPT = 'https://raw.githubusercontent.com/sp-tarkov/server/master/project/assets/database';

// Fields the SPT fallback cannot fill, surfaced in the snapshot so the app can
// say why something is blank rather than looking broken.
const FALLBACK_GAPS = ['prices', 'crafts', 'bonusNames', 'itemSize', 'backgroundColor'];
const FALLBACK_FIELDS_LABEL = FALLBACK_GAPS.join(', ');

// SPT areas.json keys stations by a numeric enum. tarkov.dev keys them by name.
// src/models/enums/HideoutAreas.ts
const AREA_NAMES = {
  0: 'Vents', 1: 'Security', 2: 'Lavatory', 3: 'Stash', 4: 'Generator',
  5: 'Heating', 6: 'Water Collector', 7: 'Medstation', 8: 'Nutrition Unit',
  9: 'Rest Space', 10: 'Workbench', 11: 'Intelligence Center', 12: 'Shooting Range',
  13: 'Library', 14: 'Scav Case', 15: 'Illumination', 16: 'Hall of Fame',
  17: 'Air Filtering Unit', 18: 'Solar Power', 19: 'Booze Generator',
  20: 'Bitcoin Farm', 21: 'Christmas Tree', 22: 'Emergency Wall', 23: 'Gym',
  24: 'Weapon Rack', 25: 'Weapon Rack', 26: 'Equipment Presets Stand',
  27: 'Cultist Circle',
};

const TRADER_NAMES = {
  '54cb50c76803fa8b248b4571': 'Prapor',
  '54cb57776803fa99248b456e': 'Therapist',
  '579dc571d53a0658a154fbec': 'Fence',
  '58330581ace78e27b8b10cee': 'Skier',
  '5935c25fb3acc3127c3d8cd9': 'Peacekeeper',
  '5a7c2eca46aef81a7ca2145d': 'Mechanic',
  '5ac3b934156ae10c4430e83c': 'Ragman',
  '5c0647fdd443bc2504c2d371': 'Jaeger',
  '638f541a29ffd1183d187f57': 'Lightkeeper',
  '656f0f98d80a697f855d34b1': 'BTR Driver',
  '6617beeaa9cfa777ca915b7c': 'Ref',
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'astral-project-eftsh' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function gql(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'astral-project-eftsh' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`tarkov.dev HTTP ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`tarkov.dev GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);
  return json.data;
}

// ---------------------------------------------------------------------------
// Source 1 — tarkov.dev
// ---------------------------------------------------------------------------

async function fromTarkovDev() {
  const hideout = await gql(hideoutQuery('regular'));
  const ammoData = await gql(ammoQuery('regular'));
  const provData = await gql(provisionQuery('regular'));
  return normalizeTarkovDev(hideout, ammoData, provData);
}

// ---------------------------------------------------------------------------
// Source 2 — SPT game-file mirror (used only when tarkov.dev is down)
// ---------------------------------------------------------------------------

async function fromSpt() {
  const [areas, locale, handbook] = await Promise.all([
    getJson(`${SPT}/hideout/areas.json`),
    getJson(`${SPT}/locales/global/en.json`),
    getJson(`${SPT}/templates/handbook.json`),
  ]);

  const hbPrice = new Map((handbook.Items || []).map((i) => [i.Id, i.Price]));
  const items = {};
  const keepItem = (templateId) => {
    if (!items[templateId]) {
      const name = locale[`${templateId} Name`] || locale[`${templateId} ShortName`] || templateId;
      items[templateId] = {
        id: templateId,
        name,
        shortName: locale[`${templateId} ShortName`] || name,
        basePrice: hbPrice.get(templateId) ?? 0,
        width: 1, height: 1, slots: 1,
        backgroundColor: 'default',
        wikiLink: null,
        category: null,
        types: [],
        fleaAvailable: true,
        avg24hPrice: null,
        lastLowPrice: null,
        bestTraderSell: null,
        bestTraderBuy: null,
        fleaBuy: null,
      };
    }
    return templateId;
  };

  const stations = areas
    .filter((a) => AREA_NAMES[a.type])
    .map((a) => {
      const name = AREA_NAMES[a.type];
      const levels = Object.keys(a.stages || {})
        .map(Number)
        .filter((n) => n > 0)
        .sort((x, y) => x - y)
        .map((n) => {
          const st = a.stages[String(n)];
          const reqs = st.requirements || [];
          return {
            level: n,
            constructionTime: Math.round(st.constructionTime || 0),
            description: locale[`hideout_area_${a.type}_stage_${n}_description`] || '',
            itemRequirements: reqs
              .filter((r) => r.type === 'Item')
              .map((r) => ({
                itemId: keepItem(r.templateId),
                count: r.count || 1,
                foundInRaid: !!r.isSpawnedInSession,
              })),
            stationLevelRequirements: reqs
              .filter((r) => r.type === 'Area')
              .map((r) => ({
                stationId: null,
                stationName: AREA_NAMES[r.areaType] || `Area ${r.areaType}`,
                stationKey: slug(AREA_NAMES[r.areaType] || `Area ${r.areaType}`),
                level: r.requiredLevel,
              })),
            skillRequirements: reqs
              .filter((r) => r.type === 'Skill')
              .map((r) => ({ name: r.skillName || '', level: r.skillLevel ?? r.requiredLevel ?? 0 })),
            traderRequirements: reqs
              .filter((r) => r.type === 'TraderLoyalty')
              .map((r) => ({
                traderId: r.traderId,
                traderName: TRADER_NAMES[r.traderId] || 'Trader',
                level: r.loyaltyLevel,
              })),
            bonuses: (st.bonuses || []).map((b) => ({
              type: b.type, name: b.type, value: b.value,
              passive: b.passive, production: b.production, skillName: b.skillName || null,
            })),
          };
        });
      return {
        id: a._id, name, normalizedName: slug(name),
        imageLink: null, levels, crafts: [],
      };
    });

  // Two areas share the "Weapon Rack" name (primary + secondary). Merging them
  // would lose a real, separately-levelled station, so they are disambiguated
  // instead.
  const seen = new Map();
  for (const st of stations) {
    const n = (seen.get(st.name) || 0) + 1;
    seen.set(st.name, n);
    if (n > 1) { st.name = `${st.name} ${n}`; st.normalizedName = slug(st.name); }
  }

  return {
    source: 'game-files',
    gaps: FALLBACK_GAPS,
    stations,
    items,
    traders: Object.entries(TRADER_NAMES).map(([id, name]) => ({
      id, name, normalizedName: slug(name), imageLink: null,
    })),
    ammo: [],
    provisions: [],
  };
}

// ---------------------------------------------------------------------------
// Enrichment — tarkov.dev layered on top of the game files
// ---------------------------------------------------------------------------

// Fields BSG's files genuinely don't carry. Copied from tarkov.dev when it is
// reachable; left alone when it isn't. Requirement structure is never taken
// from tarkov.dev — the game files are authoritative for that.
const ENRICH_FIELDS = [
  'width', 'height', 'slots', 'backgroundColor', 'wikiLink', 'category', 'types',
  'fleaAvailable', 'avg24hPrice', 'lastLowPrice', 'bestTraderSell', 'bestTraderBuy', 'fleaBuy',
];

function enrich(base, live) {
  let itemsTouched = 0;
  for (const [id, liveItem] of Object.entries(live.items)) {
    const target = base.items[id];
    if (!target) {
      // Referenced only by a craft/ammo/provision list, not by any hideout
      // requirement — still worth carrying so those views resolve names.
      base.items[id] = liveItem;
      continue;
    }
    for (const field of ENRICH_FIELDS) {
      if (liveItem[field] !== undefined && liveItem[field] !== null) target[field] = liveItem[field];
    }
    itemsTouched += 1;
  }

  const liveByKey = new Map(live.stations.map((s) => [s.normalizedName, s]));
  let craftsAdded = 0;
  for (const station of base.stations) {
    const match = liveByKey.get(station.normalizedName);
    if (!match) continue;
    if (match.imageLink) station.imageLink = match.imageLink;
    if (match.crafts?.length) {
      station.crafts = match.crafts;
      craftsAdded += match.crafts.length;
    }
    // Bonus rows in the game files carry a type but no display name.
    for (const lv of station.levels) {
      const liveLv = match.levels.find((l) => l.level === lv.level);
      if (!liveLv) continue;
      if (liveLv.description) lv.description = liveLv.description;
      if (liveLv.bonuses?.length === lv.bonuses.length) {
        lv.bonuses = lv.bonuses.map((b, i) => ({ ...b, name: liveLv.bonuses[i].name || b.name }));
      }
    }
  }

  if (live.traders?.length) base.traders = live.traders;
  base.ammo = live.ammo || [];
  base.provisions = live.provisions || [];
  base.gaps = [];
  base.enrichedAt = new Date().toISOString();

  return { itemsTouched, craftsAdded };
}

// ---------------------------------------------------------------------------

async function main() {
  // The game files are the source of truth. They are a plain static mirror of
  // BSG's own data, they do not go down, and a wipe just means re-running this
  // script. tarkov.dev is strictly an optional layer on top for the handful of
  // things the game files don't contain (prices, icons metadata, crafts).
  console.log('→ BSG game files (primary) …');
  const data = await fromSpt();
  console.log(`  ok — ${data.stations.length} stations, ${Object.keys(data.items).length} items`);

  console.log('→ tarkov.dev enrichment (optional) …');
  try {
    const live = await fromTarkovDev();
    const { itemsTouched, craftsAdded } = enrich(data, live);
    console.log(`  ok — enriched ${itemsTouched} items, ${craftsAdded} crafts, ${data.ammo.length} ammo`);
  } catch (err) {
    console.warn(`  skipped: ${err.message}`);
    console.warn(`  snapshot will have no ${FALLBACK_FIELDS_LABEL}. Everything else is complete.`);
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    ...data,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snapshot));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(
    `\nwrote ${path.relative(path.join(HERE, '..'), OUT)}  (${kb} KB)\n` +
    `  source     ${snapshot.source}\n` +
    `  stations   ${snapshot.stations.length}\n` +
    `  levels     ${snapshot.stations.reduce((n, s) => n + s.levels.length, 0)}\n` +
    `  items      ${Object.keys(snapshot.items).length}\n` +
    `  ammo       ${snapshot.ammo.length}\n` +
    `  provisions ${snapshot.provisions.length}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
