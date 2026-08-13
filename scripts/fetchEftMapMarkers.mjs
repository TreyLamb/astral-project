// Bakes per-map marker data into src/pages/eftShopping/map/data/markers/<key>.json
//
//   node scripts/fetchEftMapMarkers.mjs              # every calibrated map
//   node scripts/fetchEftMapMarkers.mjs woods customs
//
// Same reliability model as the hideout snapshot: fetch once, commit the JSON,
// runtime never calls anything. A wipe or a marker update means re-running this.
//
// Two requests per map, both public and unauthenticated:
//   - the map page, for the category taxonomy (group/category names, icons,
//     colours) which is inlined as `mapData` and is NOT in the API response.
//   - /api/v1/maps/{id}/data, for the locations themselves.
//
// Coordinates are stored EXACTLY as the source gives them, and no conversion
// is needed: the tile pyramid is standard EPSG:3857 Web Mercator, so the
// lat/lngs drop straight onto it under Leaflet's default CRS. Calibration only
// enters the picture for the alternate tarkov.dev SVG basemap, which lives in
// an unrelated coordinate space.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_DIR = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'map', 'data');
const CONFIG = path.join(MAP_DIR, 'mapConfig.json');
const OUT_DIR = path.join(MAP_DIR, 'markers');
const ASSET_DIR = path.join(MAP_DIR, 'assets');
const SPRITE_JSON = path.join(MAP_DIR, 'markerSprites.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const MG_TILE_BASE = 'https://tiles.mapgenie.io';
const ICON_CSS = 'https://mapgenie.io/game-icons/tarkov/icons.css?v=3.4';
const ICON_WOFF = 'https://mapgenie.io/game-icons/tarkov/icons.woff?v=3';

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function getBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// Pulls a top-level `<name> = {...}` / `[...]` literal out of inline page JS by
// bracket matching, since the payload is not wrapped in a parseable script tag.
function inlineLiteral(html, name) {
  const at = html.indexOf(`${name} =`);
  if (at < 0) return null;
  const eq = html.indexOf('=', at);
  let start = -1;
  for (let i = eq + 1; i < html.length; i++) {
    if (html[i] === '{' || html[i] === '[') { start = i; break; }
    if (!/\s/.test(html[i])) return null;
  }
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (!depth) return JSON.parse(html.slice(start, i + 1));
    }
  }
  return null;
}

async function fetchMap(map) {
  const { slug, id } = map.mapgenie;
  const html = await getText(`https://mapgenie.io/tarkov/maps/${slug}`);
  const mapData = inlineLiteral(html, 'mapData');
  if (!mapData) throw new Error('could not read the inline mapData payload');

  const api = JSON.parse(await getText(`https://mapgenie.io/api/v1/maps/${id}/data`));
  const locations = api.locations || [];

  // The marker artwork itself, rather than a stand-in. `MARKER_SPRITE_POSITIONS_V3`
  // is inlined on every map page and keys a sprite-sheet rectangle by category id;
  // the sheet is one open PNG. Drawing a coloured circle instead was the one place
  // this tool was re-inventing something the source already publishes.
  const spritePositions = inlineLiteral(html, 'MARKER_SPRITE_POSITIONS_V3') || {};
  const spriteUrl = (html.match(/https?:\/\/[^"'\s)]*markers@2x\.png[^"'\s)]*/) || [])[0] || null;

  // The tile pyramid is plain, open, unauthenticated Web Mercator — verified by
  // refetching a real tile with no headers at all. Because it is standard
  // EPSG:3857, the marker lat/lngs land on it with no calibration whatsoever;
  // Leaflet's default CRS is already the right projection.
  //
  // The live URL inserts a `/games/` segment that the stored pattern omits, so
  // it is composed here rather than at render time — getting that wrong is what
  // made the tiles look locked in the first place.
  const tileSet = (mapData.mapConfig?.tile_sets || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] || null;

  const tiles = tileSet ? {
    url: `${MG_TILE_BASE}/games/${tileSet.pattern}`,
    minZoom: tileSet.min_zoom ?? 8,
    maxZoom: tileSet.max_zoom ?? 16,
    name: tileSet.name || null,
  } : null;

  const view = {
    lat: mapData.mapConfig?.start_lat ?? null,
    lng: mapData.mapConfig?.start_lng ?? null,
    zoom: mapData.mapConfig?.initial_zoom ?? null,
  };

  const categories = [];
  for (const group of mapData.groups || []) {
    for (const cat of group.categories || []) {
      categories.push({
        id: cat.id,
        title: cat.title,
        group: group.title,
        groupId: group.id,
        icon: cat.icon || null,
        color: cat.color || group.color || null,
        // How the source draws this category, and the reason Location renders
        // as a place name rather than a pin. Seen values: 'marker', 'text',
        // 'text|marker', 'circle', 'features|marker', 'features|text'.
        displayType: cat.display_type || 'marker',
        circle: cat.display_type === 'circle' ? {
          color: cat.circle_color || null,
          strokeColor: cat.circle_stroke_color || null,
          opacity: cat.circle_opacity ?? null,
          radius: cat.circle_radius ?? null,
        } : null,
        premium: !!cat.premium,
        count: cat.locations_count ?? 0,
      });
    }
  }

  const known = new Set(categories.map((c) => c.id));
  const markers = locations
    .filter((l) => Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude)))
    .map((l) => ({
      id: l.id,
      cat: l.category_id,
      title: l.title || '',
      // Descriptions are the genuinely useful part ("Behind the sand bags") and
      // are what a bare coordinate dump would lose.
      desc: l.description || '',
      lat: Number(l.latitude),
      lng: Number(l.longitude),
    }));

  // A marker whose category is missing from the taxonomy would silently vanish
  // behind every filter, so surface it rather than dropping it.
  const orphans = [...new Set(markers.filter((m) => !known.has(m.cat)).map((m) => m.cat))];

  return {
    key: map.key,
    source: 'mapgenie',
    sourceMapId: id,
    fetchedAt: new Date().toISOString(),
    // The source's own coordinate extent. Mapping this rectangle onto the
    // SVG's bounds gives a usable first-guess projection, which the in-app
    // calibration tool then refines against real landmarks.
    sourceBounds: api.styles?.mapStyle?.bounds || null,
    tiles,
    view,
    // Movement speeds let the route manifest report time, not just distance.
    speeds: api.distanceToolConfig?.speeds || [],
    // Projected metres per in-game metre, from the source's own distance tool.
    distanceScale: api.distanceToolConfig?.scale ?? null,
    useHaversine: api.distanceToolConfig?.useHaversine ?? false,
    presets: (api.presets || []).map((p) => ({ id: p.id, title: p.title, categories: p.categories })),
    categories,
    markers,
    orphanCategories: orphans,
    spritePositions,
    spriteUrl,
  };
}

/**
 * Sprite sheet + icon font, both shared across every map because mapgenie's
 * category ids are game-wide. Written once per run rather than per map.
 *
 * The font is what their own sidebar uses, so the filter list ends up showing
 * the same glyph next to "Ammo Box" that their site does.
 */
async function writeSharedAssets(positions, spriteUrl) {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const written = [];

  let sheetWidth = null;
  let sheetHeight = null;
  if (spriteUrl) {
    const png = await getBinary(spriteUrl);
    fs.writeFileSync(path.join(ASSET_DIR, 'markers.png'), png);
    // IHDR is always the first chunk, so the dimensions sit at a fixed offset.
    sheetWidth = png.readUInt32BE(16);
    sheetHeight = png.readUInt32BE(20);
    written.push(`markers.png ${sheetWidth}x${sheetHeight}, ${(png.length / 1024).toFixed(0)} KB`);
  }

  let glyphs = {};
  try {
    const css = await getText(ICON_CSS);
    // .icon-ammo_box:before { content: "\e900"; ... }
    for (const m of css.matchAll(/\.icon-([a-z0-9_]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"/gi)) {
      glyphs[m[1]] = m[2];
    }
    const woff = await getBinary(ICON_WOFF);
    fs.writeFileSync(path.join(ASSET_DIR, 'icons.woff'), woff);
    written.push(`icons.woff ${(woff.length / 1024).toFixed(0)} KB, ${Object.keys(glyphs).length} glyphs`);
  } catch (err) {
    console.warn(`  icon font skipped — ${err.message}`);
    glyphs = {};
  }

  const sizes = new Set(Object.values(positions).map((p) => `${p.width}x${p.height}@${p.pixelRatio}`));
  fs.writeFileSync(SPRITE_JSON, JSON.stringify({
    source: 'mapgenie',
    fetchedAt: new Date().toISOString(),
    sheet: 'assets/markers.png',
    sheetWidth,
    sheetHeight,
    // Every cell is the same size in practice, but the sheet is addressed
    // per-entry so a future re-fetch with mixed sizes still renders.
    cellSizes: [...sizes],
    positions,
    glyphs,
  }));
  written.push(`markerSprites.json ${Object.keys(positions).length} positions`);
  console.log(`  assets: ${written.join(' · ')}`);
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const wanted = process.argv.slice(2);
  const targets = config.maps.filter((m) => (
    m.mapgenie.id && (wanted.length ? wanted.includes(m.key) : true)
  ));

  if (!targets.length) {
    console.error('No matching maps with a mapgenie id. Known keys:');
    console.error('  ' + config.maps.map((m) => m.key).join(', '));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let failures = 0;

  // Merged across maps: any one page only inlines the categories it uses, so a
  // partial run would otherwise shrink the shared sheet.
  const existing = fs.existsSync(SPRITE_JSON)
    ? JSON.parse(fs.readFileSync(SPRITE_JSON, 'utf8')).positions || {}
    : {};
  const allPositions = { ...existing };
  let spriteUrl = null;

  for (const map of targets) {
    process.stdout.write(`→ ${map.key} … `);
    try {
      const { spritePositions, spriteUrl: url, ...data } = await fetchMap(map);
      Object.assign(allPositions, spritePositions);
      spriteUrl = spriteUrl || url;
      const file = path.join(OUT_DIR, `${map.key}.json`);
      fs.writeFileSync(file, JSON.stringify(data));
      const kb = (fs.statSync(file).size / 1024).toFixed(0);
      console.log(
        `${data.markers.length} markers, ${data.categories.length} categories (${kb} KB)`
        + (data.orphanCategories.length ? `  ! orphan categories: ${data.orphanCategories.join(', ')}` : ''),
      );
    } catch (err) {
      failures += 1;
      console.log(`FAILED — ${err.message}`);
    }
  }

  if (Object.keys(allPositions).length) {
    try {
      await writeSharedAssets(allPositions, spriteUrl);
    } catch (err) {
      console.warn(`  shared assets FAILED — ${err.message}`);
      failures += 1;
    }
  }

  console.log(failures ? `\n${failures} map(s) failed.` : '\nAll requested maps written.');
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => { console.error(err); process.exit(1); });
