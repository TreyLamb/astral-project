// Builds src/pages/eftShopping/map/data/mapConfig.json — the per-map geometry
// the map tab needs to render anything at all: which image backs the map, how
// game coordinates project onto it, and what floors exist.
//
//   node scripts/buildEftMapConfig.mjs
//
// Sources (both open, both fetched fresh so a wipe/patch is one re-run):
//   - the-hideout/tarkov-dev src/data/maps.json (MIT) — projection, transform,
//     bounds, rotation, floor layers, labels, and the asset URL for each map.
//   - mapgenie's public /tarkov index — only to learn each map's numeric id, so
//     the marker generator knows which /api/v1/maps/{id}/data to ask for.
//
// No imagery is copied here. The SVG/tile URLs point at tarkov.dev's CDN, which
// serves them openly; attribution per map is carried through to the UI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'map', 'data', 'mapConfig.json');

const TD_MAPS = 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/src/data/maps.json';
// Any single map's data response carries the full id->slug table for the game,
// so one request enumerates every map rather than scraping the index page.
const MG_ANY_MAP = 'https://mapgenie.io/api/v1/maps/69/data';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

// tarkov.dev's slug -> mapgenie's slug, where they disagree.
const MG_SLUG = {
  'streets-of-tarkov': 'streets',
  'the-lab': 'lab',
  'the-labyrinth': 'labyrinth',
};

// Maps we deliberately skip: not real locations, just composite overviews.
const SKIP = new Set(['transits', 'openworld']);

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Failing to get these is not fatal — the map still renders, it just has no
// marker source until an id is filled in.
async function mapgenieIds() {
  const res = await fetch(MG_ANY_MAP, {
    headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://mapgenie.io/tarkov' },
  });
  if (!res.ok) throw new Error(`${res.status} ${MG_ANY_MAP}`);
  const json = await res.json();
  return Object.fromEntries((json.maps || []).map((m) => [m.slug, m.id]));
}

function pickPrimary(entry) {
  // Prefer the interactive layer (real projection + floors) over the flat 2D/3D
  // reference pictures, which have no transform and can't carry markers.
  return (entry.maps || []).find((m) => m.projection === 'interactive')
    || (entry.maps || []).find((m) => m.svgPath || m.tilePath)
    || null;
}

async function main() {
  console.log('→ tarkov.dev maps.json …');
  const tdMaps = JSON.parse(await getText(TD_MAPS));
  console.log(`  ok — ${Object.keys(tdMaps).length} entries`);

  let mgIds = {};
  try {
    console.log('→ mapgenie map ids …');
    mgIds = await mapgenieIds();
    console.log(`  ok — ${Object.keys(mgIds).length} ids`);
  } catch (err) {
    console.warn(`  skipped: ${err.message} (marker generator will need ids filled in by hand)`);
  }

  const maps = [];
  for (const entry of Object.values(tdMaps)) {
    if (SKIP.has(entry.normalizedName)) continue;
    const primary = pickPrimary(entry);
    if (!primary) {
      console.warn(`  ! ${entry.normalizedName}: no interactive layer, skipped`);
      continue;
    }

    const mgKey = MG_SLUG[entry.normalizedName] || entry.normalizedName;
    maps.push({
      key: entry.normalizedName,
      name: entry.normalizedName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      // 'svg' renders as a single vector overlay; 'tiles' as a zoom pyramid.
      kind: primary.svgPath ? 'svg' : 'tiles',
      svgPath: primary.svgPath || null,
      svgLayer: primary.svgLayer || null,
      tilePath: primary.tilePath || null,
      minZoom: primary.minZoom ?? 1,
      maxZoom: primary.maxZoom ?? 6,
      bounds: primary.bounds || null,
      // [scaleX, offsetX, scaleY, offsetY] — game coords -> map coords.
      transform: primary.transform || null,
      coordinateRotation: primary.coordinateRotation ?? 0,
      heightRange: primary.heightRange || null,
      author: primary.author || null,
      authorLink: primary.authorLink || null,
      floors: (primary.layers || []).map((l) => ({
        name: l.name,
        svgLayer: l.svgLayer || null,
        tilePath: l.tilePath || null,
        show: !!l.show,
        heightRange: l.extents?.[0]?.height || null,
      })),
      mapgenie: { slug: mgKey, id: mgIds[mgKey] ?? null },
    });
  }

  maps.sort((a, b) => a.name.localeCompare(b.name));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), maps }, null, 1));

  console.log(`\nwrote ${path.relative(path.join(HERE, '..'), OUT)}  (${maps.length} maps)`);
  for (const m of maps) {
    console.log(
      `  ${m.key.padEnd(20)} ${m.kind.padEnd(6)} floors=${String(m.floors.length).padEnd(3)}`
      + ` transform=${m.transform ? 'yes' : 'NO '} mg_id=${m.mapgenie.id ?? '—'}`,
    );
  }
  const noTransform = maps.filter((m) => !m.transform);
  if (noTransform.length) {
    console.warn(`\n! no transform (markers cannot be placed): ${noTransform.map((m) => m.key).join(', ')}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
