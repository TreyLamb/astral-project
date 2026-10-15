// Builds src/pages/eftShopping/data/spaceSnapshot.json — the data behind the
// Stash Space tab (mod-on-mod packing + container net gain).
//
//   node scripts/fetchEftSpace.mjs          (or: npm run eft:space)
//
// SOURCE: BSG's own item templates, via the SP-Tushonka fork of SPT
// ------------------------------------------------------------------
// Packing needs four fields nothing else publishes together: each item's
// Width/Height, its ExtraSizeLeft/Right/Up/Down, ExtraSizeForceAdd, and every
// mod slot's allowed-item filter. They all live in templates/items.json.
//
// sp-tarkov/server's copy of that file is a Git-LFS object and this repo's LFS
// bandwidth quota there is exhausted (see CLAUDE.md). tarkov.dev's own data
// pipeline (the-hideout/tarkov-data-manager, modules/tarkov-data-spt.mjs) reads
// it from SP-Tushonka/server-csharp instead, which serves LFS from its OWN
// server — lfs.sp-tushonka.com — so no GitHub quota applies. Found 2026-10-14;
// that fork was pushed 2026-10-12, i.e. current for this season.
//
// tarkov.dev's GraphQL (the other obvious source) was "GraphQL server
// unavailable" the same day, and does not expose ExtraSize at all.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'spaceSnapshot.json');

const RAW = 'https://raw.githubusercontent.com/SP-Tushonka/server-csharp/main/Libraries/SPTushonka.Server.Assets/SPT_Data/database';
const LFS = 'https://lfs.sp-tushonka.com/sp-tushonka/server-csharp/objects';
const UA = { 'User-Agent': 'astral-project-eftsh (personal stash planner)' };

const MOD = '5448fe124bdc2da5018b4567';
// Containers you can actually own and put in a stash. Loot/stationary/hideout
// containers have grids too but are world furniture, and secure containers
// (MobContainer) can't be moved into a stash container.
const OWNABLE_CONTAINERS = new Set(['Backpack', 'SimpleContainer', 'Vest']);

async function fetchMaybeLfs(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  const ptr = text.match(/^version https:\/\/git-lfs[^\n]*\noid sha256:([a-f0-9]+)\nsize (\d+)/);
  if (!ptr) return JSON.parse(text);
  const blob = await fetch(`${LFS}/${ptr[1]}`, { headers: UA });
  if (!blob.ok) throw new Error(`LFS ${blob.status} for ${url}`);
  return JSON.parse(await blob.text());
}

async function main() {
  console.log('→ item templates (SP-Tushonka LFS) …');
  const items = await fetchMaybeLfs(`${RAW}/templates/items.json`);
  console.log(`  ok — ${Object.keys(items).length} templates`);
  console.log('→ English locale …');
  const locale = await fetchMaybeLfs(`${RAW}/locales/global/en.json`);
  // The handbook is the in-game item list. Templates outside it are dev or
  // retired entries — a "Lucky DEVELOPER junkbox" and an old 6x50 Terraplane
  // topped the container chart before this filter, neither one obtainable.
  const handbook = await fetchMaybeLfs(`${RAW}/templates/handbook.json`);
  const inHandbook = new Set(handbook.Items.map((x) => x.Id));

  const ancestors = (id) => {
    const out = [];
    let cur = items[id]?._parent;
    while (cur) { out.push(cur); cur = items[cur]?._parent; }
    return out;
  };
  const nameOf = (id) => locale[`${id} Name`];
  // An item you can actually hold: has an English name and short name, is not
  // a quest-only template, and is not one of SPT's "(off)" removed entries.
  const real = (t) => t?._type === 'Item'
    && inHandbook.has(t._id)
    && nameOf(t._id) && locale[`${t._id} ShortName`]
    && !/^\(off\)/i.test(nameOf(t._id))
    && !t._props?.QuestItem;

  const mods = Object.values(items).filter((t) => real(t) && ancestors(t._id).includes(MOD));
  const modIndex = new Map(mods.map((t, i) => [t._id, i]));

  // Slot filters name items AND categories ("any Foregrip"), so each is
  // expanded to concrete mods here, once, rather than on every lookup.
  const expand = (filter = [], excluded = []) => {
    const want = new Set(filter);
    const block = new Set(excluded);
    const out = [];
    for (const t of mods) {
      const chain = [t._id, ...ancestors(t._id)];
      if (chain.some((x) => block.has(x))) continue;
      if (chain.some((x) => want.has(x))) out.push(modIndex.get(t._id));
    }
    return out;
  };

  const modRows = mods.map((t) => {
    const p = t._props;
    const slots = (p.Slots || [])
      .map((s) => {
        const f = s._props?.filters?.[0] || {};
        const allow = expand(f.Filter, f.ExcludedFilter);
        return allow.length ? [s._name, allow] : null;
      })
      .filter(Boolean);
    const conflicts = (p.ConflictingItems || []).map((id) => modIndex.get(id)).filter((i) => i != null);
    const row = {
      id: t._id,
      n: nameOf(t._id),
      s: locale[`${t._id} ShortName`],
      c: items[t._parent]?._name || '',
      w: p.Width,
      h: p.Height,
    };
    const ex = [p.ExtraSizeLeft || 0, p.ExtraSizeRight || 0, p.ExtraSizeUp || 0, p.ExtraSizeDown || 0];
    if (ex.some(Boolean)) row.x = ex;
    if (p.ExtraSizeForceAdd) row.f = 1;
    if (slots.length) row.sl = slots;
    if (conflicts.length) row.cf = conflicts;
    return row;
  });

  const catName = (id) => locale[`${id} Name`] || items[id]?._name || id;
  const containers = Object.values(items)
    .filter((t) => real(t) && OWNABLE_CONTAINERS.has(items[t._parent]?._name) && (t._props.Grids || []).length)
    .map((t) => {
      const p = t._props;
      const grids = p.Grids.map((g) => [g._props.cellsH, g._props.cellsV]);
      const f = p.Grids[0]._props.filters?.[0] || {};
      const accepts = [...new Set((f.Filter || []).filter((id) => id !== '54009119af1c881c07000029').map(catName))];
      const excludes = [...new Set((f.ExcludedFilter || []).map(catName))];
      return {
        id: t._id,
        n: nameOf(t._id),
        s: locale[`${t._id} ShortName`],
        c: items[t._parent]._name,
        w: p.Width,
        h: p.Height,
        grids,
        accepts: accepts.length ? accepts : null,
        excludes: excludes.length ? excludes : null,
      };
    });

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: 'SP-Tushonka/server-csharp templates/items.json (BSG item templates)',
    sizeRule: 'SPT InventoryHelper.GetSizeByInventoryItemHash: root Width/Height plus, per direction, '
      + 'the MAX ExtraSize over every attached mod (any depth) plus the SUM of ExtraSizeForceAdd mods.',
    mods: modRows,
    containers,
  };

  fs.writeFileSync(OUT, JSON.stringify(snapshot));
  const withSlots = modRows.filter((m) => m.sl).length;
  console.log(
    `\nwrote ${path.relative(path.join(HERE, '..'), OUT)}  (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)\n`
    + `  mods          ${modRows.length} (${withSlots} with slots)\n`
    + `  containers    ${containers.length}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
