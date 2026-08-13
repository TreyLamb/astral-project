// Text-rendered map labels.
//
// Not every category is a pin. The source's category carries a `display_type`
// and drives three different MapLibre layers off it:
//
//   'marker'       icon only          — loot, enemies, most things
//   'text'         TEXT ONLY, no pin  — Location (place names: "Sawmill")
//   'text|marker'  both               — Extraction, Transit
//
// Drawing Location as a pin was wrong; it is a place name and the source has
// always rendered it as one.
//
// The colour and size rules below are a direct port of their game-20 (Tarkov)
// branch in map.js, including the tag stripping — an extract titled
// "Eastern Rocks [SCAV]" draws as orange "EASTERN ROCKS", not with the tag
// still in it.

// Past this zoom every point feature swaps its pin for a small precise dot
// plus its name. A pin is a ~40px teardrop whose tip is the real position —
// readable when zoomed out, useless when you are trying to find the exact
// spot. The dot is 3px and sits exactly on the coordinate.
export const DEFAULT_DETAIL_ZOOM = 14;

// Deliberately not a category colour: this has to stand out against Tarkov map
// palettes, which are mostly green, tan and grey. Red with a white ring reads
// on all of them.
export const DOT_FILL = '#ff2d3a';
export const DOT_RING = '#ffffff';
export const DOT_FOUND = '#7a9a5c';

export const DISPLAY = {
  marker: 'marker',
  text: 'text',
  textMarker: 'text|marker',
  circle: 'circle',
};

/** Their category ids for the two tagged, uppercased categories. */
const TRANSIT = 4744;
const EXTRACTION = 954;

const TAG_COLOURS = [
  ['[PMC]', '#00E99B'],
  ['[SCAV]', '#FFAA00'],
  ['[CO-OP]', '#62CEFE'],
];

export const hasText = (displayType) => displayType === DISPLAY.text
  || displayType === DISPLAY.textMarker
  || displayType === 'features|text';

export const hasPin = (displayType) => !displayType
  || displayType === DISPLAY.marker
  || displayType === DISPLAY.textMarker
  || displayType === 'features|marker';

/**
 * Label text, colour and zoom-keyed sizes for a marker.
 *
 * Returns null when the category is not a text one, so the caller can skip it
 * without knowing the rules.
 */
export function labelStyle(marker, category) {
  if (!category || !hasText(category.displayType)) return null;

  const raw = marker.title || category.title || '';
  const catId = category.id;

  if (catId === EXTRACTION || catId === TRANSIT) {
    let text = raw.toUpperCase();
    let color = '#62CEFE';

    if (catId === TRANSIT) {
      color = '#FEF467';
    } else {
      const tag = TAG_COLOURS.find(([t]) => raw.includes(t));
      if (tag) {
        color = tag[1];
        text = text.replace(tag[0], '');
      } else {
        text = text.replace('[ALL]', '');
      }
    }

    return {
      text: text.trim(),
      color,
      haloWidth: 1.5,
      haloColor: '#000000',
      sizes: [16, 18, 24],
    };
  }

  return {
    text: raw,
    color: '#ffffff',
    haloWidth: 1,
    haloColor: '#000000',
    sizes: [12, 14, 18],
  };
}

/**
 * Label for a category that normally draws as a pin, used only at detail zoom.
 * Plainer than the source's own text styles so it never competes with them.
 */
export function autoLabel(marker, category) {
  const raw = marker.title || category?.title || '';
  if (!raw) return null;
  // Quest markers carry the whole objective as a title ("Eliminate 15 PMC's
  // without using any armor or helmets on Woods"), which would stripe the map.
  // The full text is still in the hover tooltip.
  const text = raw.length > 34 ? `${raw.slice(0, 33).trimEnd()}…` : raw;
  return {
    text,
    color: '#ffffff',
    haloWidth: 1,
    haloColor: '#000000',
    sizes: [10, 11, 13],
    auto: true,
  };
}

/**
 * Their text-size ramp: linear interpolation keyed on zoom 10, 11 and 16,
 * flat outside that range.
 */
export function textSizeForZoom(zoom, [s10, s11, s16]) {
  if (!Number.isFinite(zoom)) return s11;
  if (zoom <= 10) return s10;
  if (zoom >= 16) return s16;
  if (zoom <= 11) return s10 + (s11 - s10) * (zoom - 10);
  return s11 + (s16 - s11) * ((zoom - 11) / 5);
}
