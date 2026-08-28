// The tarkov.dev queries and the raw-response -> app-shape normalizer.
//
// Imported by BOTH the browser data layer (eftApi.js) and the snapshot
// generator (scripts/fetchEftHideout.mjs). Keeping them on one copy is the
// point: a live fetch and the committed snapshot must be indistinguishable to
// every component downstream, or every view needs two code paths.
//
// No browser or node APIs in here — plain data in, plain data out.

export const GAME_MODES = [
  { id: 'regular', label: 'PVP', blurb: 'Live PVP economy' },
  { id: 'pve', label: 'PVE', blurb: 'PVE co-op economy' },
];

export const ITEM_FIELDS = `
  id name shortName basePrice width height backgroundColor wikiLink
  avg24hPrice lastLowPrice low24hPrice high24hPrice
  types
  category { name normalizedName }
  sellFor { priceRUB vendor { normalizedName name } }
  buyFor  { priceRUB vendor { normalizedName name } }
`;

export const hideoutQuery = (mode) => `{
  hideoutStations(gameMode: ${mode}) {
    id name normalizedName imageLink
    levels {
      id level constructionTime description
      itemRequirements { count quantity attributes { type name value } item { ${ITEM_FIELDS} } }
      stationLevelRequirements { level station { id name normalizedName } }
      skillRequirements { level skill { name } name }
      traderRequirements { value requirementType compareMethod trader { id name normalizedName } }
      bonuses { type name value passive production skillName }
    }
    crafts {
      id level duration
      requiredItems { count item { id name shortName } }
      rewardItems { count item { id name shortName } }
    }
  }
  traders(gameMode: ${mode}) { id name normalizedName imageLink }
}`;

export const ammoQuery = (mode) => `{
  items(gameMode: ${mode}, type: ammo) {
    ${ITEM_FIELDS}
    properties {
      ... on ItemPropertiesAmmo {
        caliber ammoType damage armorDamage penetrationPower projectileCount
        tracer tracerColor fragmentationChance initialSpeed stackMaxSize
      }
    }
  }
}`;

export const provisionQuery = (mode) => `{
  items(gameMode: ${mode}, categoryNames: [Food, Drink]) {
    ${ITEM_FIELDS}
    properties {
      ... on ItemPropertiesFoodDrink { energy hydration units }
    }
  }
}`;

// The 7 wearable/protective ItemTypes — the "is this gear" universe for the
// Item Uses tab's Armor tag. Not the full item catalog; see
// scripts/fetchEftGearCatalog.mjs for why the wiki, not this query, seeds the
// committed snapshot while tarkov.dev is down.
export const GEAR_TYPES = ['armor', 'armorPlate', 'backpack', 'glasses', 'headphones', 'helmet', 'rig'];

export const gearQuery = (mode) => `{
  items(gameMode: ${mode}, types: [${GEAR_TYPES.join(', ')}]) {
    ${ITEM_FIELDS}
    properties {
      ... on ItemPropertiesArmor { class }
      ... on ItemPropertiesHelmet { class }
    }
  }
}`;

export const slugName = (s) => String(s || '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Price-only refresh. Scoped to the ids already in the snapshot rather than
// the whole item table — a few hundred ids instead of a few thousand items,
// and nothing outside the snapshot could be displayed anyway.
export const pricesQuery = (mode, ids) => `{
  items(gameMode: ${mode}, ids: [${ids.map((id) => `"${id}"`).join(',')}]) {
    id avg24hPrice lastLowPrice
    sellFor { priceRUB vendor { normalizedName name } }
    buyFor  { priceRUB vendor { normalizedName name } }
  }
}`;

const isFlea = (v) => v === 'flea-market';

function pick(list, { exclude, lowest }) {
  let out = null;
  for (const p of list || []) {
    const vendor = p.vendor?.normalizedName || '';
    if (exclude && exclude(vendor)) continue;
    if (p.priceRUB == null) continue;
    const better = !out || (lowest ? p.priceRUB < out.price : p.priceRUB > out.price);
    if (better) out = { price: p.priceRUB, vendor: p.vendor?.name || vendor };
  }
  return out;
}

/** Just the price fields, for the opt-in live-price overlay. */
export function normalizePrices(raw) {
  return {
    fleaAvailable: (raw.buyFor || []).some((p) => isFlea(p.vendor?.normalizedName)),
    avg24hPrice: raw.avg24hPrice ?? null,
    lastLowPrice: raw.lastLowPrice ?? null,
    bestTraderSell: pick(raw.sellFor, { exclude: isFlea, lowest: false }),
    bestTraderBuy: pick(raw.buyFor, { exclude: isFlea, lowest: true }),
    fleaBuy: pick(raw.buyFor, { exclude: (v) => !isFlea(v), lowest: true }),
  };
}

export function normalizeItem(raw) {
  const w = raw.width ?? 1;
  const h = raw.height ?? 1;
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.shortName || raw.name,
    basePrice: raw.basePrice ?? 0,
    width: w,
    height: h,
    slots: w * h,
    backgroundColor: raw.backgroundColor || 'default',
    wikiLink: raw.wikiLink || null,
    category: raw.category?.name || null,
    types: raw.types || [],
    // No flea buy offer = banned from the flea (or quest/craft-only).
    fleaAvailable: (raw.buyFor || []).some((p) => isFlea(p.vendor?.normalizedName)),
    avg24hPrice: raw.avg24hPrice ?? null,
    lastLowPrice: raw.lastLowPrice ?? null,
    bestTraderSell: pick(raw.sellFor, { exclude: isFlea, lowest: false }),
    bestTraderBuy: pick(raw.buyFor, { exclude: isFlea, lowest: true }),
    fleaBuy: pick(raw.buyFor, { exclude: (v) => !isFlea(v), lowest: true }),
  };
}

export function normalizeTarkovDev(hideout, ammoData, provData) {
  const items = {};
  const keepItem = (raw) => {
    if (!raw) return null;
    if (!items[raw.id]) items[raw.id] = normalizeItem(raw);
    return raw.id;
  };

  const stations = (hideout.hideoutStations || []).map((st) => ({
    id: st.id,
    name: st.name,
    normalizedName: st.normalizedName,
    imageLink: st.imageLink || null,
    levels: [...(st.levels || [])].sort((a, b) => a.level - b.level).map((lv) => ({
      level: lv.level,
      constructionTime: lv.constructionTime || 0,
      description: lv.description || '',
      itemRequirements: (lv.itemRequirements || []).map((r) => ({
        itemId: keepItem(r.item),
        count: r.count ?? r.quantity ?? 0,
        // BSG flags FIR-only hideout requirements with an attribute rather than
        // a field of its own; normalizing here keeps that detail out of the UI.
        foundInRaid: (r.attributes || []).some(
          (a) => /raid/i.test(a.name || '') && String(a.value).toLowerCase() !== 'false',
        ),
      })),
      stationLevelRequirements: (lv.stationLevelRequirements || []).map((r) => ({
        stationId: r.station?.id || null,
        stationName: r.station?.name || '',
        // The join key the app actually uses — station ids are not guaranteed
        // to match between the live API and the snapshot's BSG area ids.
        stationKey: r.station?.normalizedName || slugName(r.station?.name),
        level: r.level,
      })),
      skillRequirements: (lv.skillRequirements || []).map((r) => ({
        name: r.skill?.name || r.name || '',
        level: r.level,
      })),
      traderRequirements: (lv.traderRequirements || []).map((r) => ({
        traderId: r.trader?.id || null,
        traderName: r.trader?.name || '',
        level: r.value,
      })),
      bonuses: (lv.bonuses || []).map((b) => ({
        type: b.type,
        name: b.name,
        value: b.value,
        passive: b.passive,
        production: b.production,
        skillName: b.skillName || null,
      })),
    })),
    crafts: (st.crafts || []).map((c) => ({
      id: c.id,
      level: c.level,
      duration: c.duration,
      requiredItems: (c.requiredItems || []).map((r) => ({
        itemId: r.item.id, name: r.item.name, count: r.count,
      })),
      rewardItems: (c.rewardItems || []).map((r) => ({
        itemId: r.item.id, name: r.item.name, count: r.count,
      })),
    })),
  }));

  const ammo = (ammoData?.items || []).map((raw) => {
    keepItem(raw);
    const p = raw.properties || {};
    return {
      itemId: raw.id,
      caliber: (p.caliber || '').replace(/^Caliber/, ''),
      ammoType: p.ammoType || null,
      damage: p.damage ?? null,
      armorDamage: p.armorDamage ?? null,
      penetrationPower: p.penetrationPower ?? null,
      projectileCount: p.projectileCount ?? 1,
      tracer: !!p.tracer,
      fragmentationChance: p.fragmentationChance ?? null,
      initialSpeed: p.initialSpeed ?? null,
    };
  });

  const provisions = (provData?.items || []).map((raw) => {
    keepItem(raw);
    const p = raw.properties || {};
    return {
      itemId: raw.id,
      energy: p.energy ?? null,
      hydration: p.hydration ?? null,
      units: p.units ?? null,
    };
  });

  return {
    source: 'tarkov.dev',
    gaps: [],
    stations,
    items,
    traders: (hideout.traders || []).map((t) => ({
      id: t.id, name: t.name, normalizedName: t.normalizedName, imageLink: t.imageLink || null,
    })),
    ammo,
    provisions,
  };
}
