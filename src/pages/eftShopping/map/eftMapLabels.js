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
// spot. The dot is 14px across and sits exactly on the coordinate.
export const DEFAULT_DETAIL_ZOOM = 15;

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

// BTR STOPS ARE NAMES, NOT PINS.
//
// The source ships them as `displayType: 'marker'` with a dark purple pin (#453A49) and no
// label, which on Woods and Streets means six to eight identical anonymous teardrops — you
// can see that a taxi stops somewhere and not which stop it is, which is the only thing you
// actually need from them. Trey, 2026-09-11: "the BTR STOPS icon text is super messed up.
// fix it and just name the stops the names - instead of an icon make the icons be replaced
// with bold red text - so it stands out from all the other text."
//
// Matched on the category's ICON, not its id. The id happens to be 4743 on both maps that
// have them today, but ids are mapgenie's and have been reshuffled before; `btr_stop` is the
// source's own semantic tag for the thing.
//
// Red because nothing else on these maps uses it: extracts are cyan/orange/green by faction
// tag, transits are yellow, place names are white, and the terrain is green, tan and grey.
const BTR_ICON = 'btr_stop';
export const BTR_COLOR = '#ff2d3a';

export const isBtrStop = (category) => category?.icon === BTR_ICON;

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
 * Whether a CATEGORY draws pin artwork — `hasPin` plus the overrides.
 *
 * Separate from `hasPin(displayType)` rather than replacing it: that one answers "what does
 * the source say about this display type", which is still the right question in isolation
 * and is tested as such. This answers "what do we draw", which is no longer always the same.
 */
export const drawsPin = (category) => hasPin(category?.displayType) && !isBtrStop(category);

/**
 * Label text, colour and zoom-keyed sizes for a marker.
 *
 * Returns null when the category is not a text one, so the caller can skip it
 * without knowing the rules.
 */
export function labelStyle(marker, category) {
  if (!category) return null;

  const raw = marker.title || category.title || '';

  // Checked BEFORE hasText, because the source calls these pins and we are overriding that.
  if (isBtrStop(category)) {
    return {
      // Titles already read "BTR Old Sawmill" — the prefix stays, so a red "BTR OLD SAWMILL"
      // can never be mistaken for the white place name "Old Sawmill" sitting on top of it,
      // which is exactly where several of them are.
      text: raw.toUpperCase(),
      color: BTR_COLOR,
      weight: 800,
      haloWidth: 2,
      haloColor: '#000000',
      sizes: [14, 16, 20],
      // A BTR stop is a place you are navigating TO, so it has to survive the zoom where
      // every other label is deliberately dropped — that is the zoom at which you are looking
      // for the door.
      persist: true,
    };
  }

  if (!hasText(category.displayType)) return null;

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
 * How a place name sizes with zoom.
 *
 * The source's own ramp grew the text from 12px to 18px between zoom 10 and 16
 * — but the map doubles every level, so over that span the terrain grew by
 * 3200% while the label grew by 50%. The net effect is a name that withers to
 * nothing against the thing it is naming.
 *
 * So: HOLD it at full size through the first couple of steps in, where you are
 * still orienting and the names are the whole point; then shrink it as the
 * detail takes over; then drop it entirely once you are close enough that a
 * name written across a building is just in the way.
 *
 *   zoom <= 13   full size
 *   13 -> 15     shrinks to the floor
 *   zoom >= 15   nothing, and the caller skips drawing
 *
 * `sizes` stays [small, base, large] as the source publishes it: base is the
 * held size and small sets the floor. The large value is what the old ramp
 * climbed to and is deliberately unused.
 *
 * FLOOR_SCALE is where the shrink bottoms out — the size names are at on the
 * last zoom they are visible. It was 0.7 and read too small there, so it is up
 * 15%. Raising the floor rather than scaling the whole curve keeps the size
 * continuous at the hold: multiplying everything past zoom 13 would make the
 * text jump larger the instant it started shrinking.
 */
export const LABEL_HOLD_TO = 13;
export const LABEL_HIDE_AT = 15;
export const FLOOR_SCALE = 0.7 * 1.15;

export function textSizeForZoom(zoom, sizes, { persist = false } = {}) {
  const base = sizes?.[1] ?? 14;
  const floor = (sizes?.[0] ?? 12) * FLOOR_SCALE;
  if (!Number.isFinite(zoom)) return base;
  // `persist` holds the label at full size at EVERY zoom, and is only for labels that ARE
  // the marker. The shrink-then-drop ramp below exists because a place name written across a
  // building is in the way once you are close — but a BTR stop has no pin behind its name,
  // so shrinking it makes the marker harder to see and dropping it deletes the stop from the
  // map at precisely the zoom you went looking for its door. Constant, not merely floored:
  // holding at the floor instead would shrink it through the ramp and then jump back up.
  if (persist) return base;
  if (zoom <= LABEL_HOLD_TO) return base;
  if (zoom >= LABEL_HIDE_AT) return 0;
  const t = (zoom - LABEL_HOLD_TO) / (LABEL_HIDE_AT - LABEL_HOLD_TO);
  return base + (floor - base) * t;
}
