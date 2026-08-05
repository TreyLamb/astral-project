import { mapSheetNamesToPaths } from './xlsxPatcher';
import { parseNumFmts } from './xlsxNumberFormat';

// Reads the ORIGINAL file's xl/styles.xml + xl/theme/theme1.xml directly
// (SheetJS's free tier only decodes fill patternType, not actual colors —
// verified experimentally) and resolves per-cell {bold, italic, bg, fg} so
// the live grid can show the workbook's real color-coding (the whole point
// of a "decluttered but not colorless" grid), not just structural values.

// Standard legacy indexed-color palette (indices 0-63); Excel still emits
// these for anything not using the modern theme-color system. 64/65 are
// "system" text/background and mean "use default", not an explicit color.
const INDEXED_COLORS = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333',
];

// Excel's theme-color index used in styles.xml is NOT document order — the
// first two pairs are swapped relative to <a:clrScheme>'s dk1/lt1/dk2/lt2.
// Well documented across independent implementations (SheetJS, openpyxl).
const THEME_INDEX_ORDER = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];

function rgbToHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return toHex(r) + toHex(g) + toHex(b);
}

// OOXML's documented tint algorithm (HSL lightness adjustment).
function applyTint(hex, tint) {
  if (!tint) return hex;
  const { h, s, l } = rgbToHsl(hex);
  const newL = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint;
  return hslToRgb(h, s, Math.max(0, Math.min(1, newL)));
}

export function parseTheme(themeXmlText, parser) {
  if (!themeXmlText) return null;
  const doc = parser.parseFromString(themeXmlText, 'application/xml');
  const scheme = doc.getElementsByTagName('a:clrScheme')[0] || doc.getElementsByTagName('clrScheme')[0];
  if (!scheme) return null;
  const named = {};
  for (const child of Array.from(scheme.children)) {
    const name = child.tagName.replace(/^a:/, '');
    const colorEl = child.firstElementChild;
    if (!colorEl) continue;
    const val = colorEl.getAttribute('lastClr') || colorEl.getAttribute('val');
    if (val) named[name] = val;
  }
  return THEME_INDEX_ORDER.map((name) => named[name] || '000000');
}

// spec: { rgb, theme, tint, indexed, auto } -> "#rrggbb" or null ("automatic"/unset)
export function resolveColorSpec(spec, themeColors) {
  if (!spec) return null;
  if (spec.auto) return null;
  if (spec.rgb) return '#' + spec.rgb.slice(-6);
  if (spec.theme !== undefined && themeColors) {
    const base = themeColors[spec.theme] || '000000';
    return '#' + applyTint(base, spec.tint || 0);
  }
  if (spec.indexed !== undefined) {
    if (spec.indexed === 64 || spec.indexed === 65 || spec.indexed >= INDEXED_COLORS.length) return null;
    return '#' + INDEXED_COLORS[spec.indexed];
  }
  return null;
}

function luminance(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isNearBlack(hexColor) {
  return luminance(hexColor) < 40;
}

// For a cell whose original font color was just "default black" (meaningless
// here — see isNearBlack usage below) but which DOES have an explicit
// background fill: picking black-or-white by the background's luminance
// reproduces what Excel's own black-on-light-highlight look actually reads
// as, instead of falling through to this page's default (light) text color,
// which would be unreadable on a light fill like the yellow highlights in
// this workbook.
function contrastingTextColor(bgHex) {
  return luminance(bgHex) > 140 ? '#000000' : '#ffffff';
}

export function readColorSpec(el) {
  if (!el) return null;
  const rgb = el.getAttribute('rgb');
  const theme = el.getAttribute('theme');
  const tint = el.getAttribute('tint');
  const indexed = el.getAttribute('indexed');
  const auto = el.getAttribute('auto');
  if (rgb) return { rgb };
  if (theme !== null) return { theme: parseInt(theme, 10), tint: tint !== null ? parseFloat(tint) : 0 };
  if (indexed !== null) return { indexed: parseInt(indexed, 10) };
  if (auto === '1') return { auto: true };
  return null;
}

function parseStylesXml(stylesXmlText, parser) {
  const doc = parser.parseFromString(stylesXmlText, 'application/xml');

  const fills = Array.from(doc.getElementsByTagName('fills')[0]?.children || []).map((fillEl) => {
    const pf = fillEl.getElementsByTagName('patternFill')[0];
    const patternType = pf?.getAttribute('patternType') || 'none';
    const fgColorEl = pf?.getElementsByTagName('fgColor')[0];
    return { patternType, fgColorSpec: readColorSpec(fgColorEl) };
  });

  const fonts = Array.from(doc.getElementsByTagName('fonts')[0]?.children || []).map((fontEl) => {
    const bEl = fontEl.getElementsByTagName('b')[0];
    const iEl = fontEl.getElementsByTagName('i')[0];
    const colorEl = fontEl.getElementsByTagName('color')[0];
    const szEl = fontEl.getElementsByTagName('sz')[0];
    const nameEl = fontEl.getElementsByTagName('name')[0];
    const bold = !!bEl && bEl.getAttribute('val') !== '0' && bEl.getAttribute('val') !== 'false';
    const italic = !!iEl && iEl.getAttribute('val') !== '0' && iEl.getAttribute('val') !== 'false';
    const size = szEl ? parseFloat(szEl.getAttribute('val')) : null;
    const family = nameEl?.getAttribute('val') || null;
    return { bold, italic, colorSpec: readColorSpec(colorEl), size, family };
  });

  const borders = Array.from(doc.getElementsByTagName('borders')[0]?.children || []).map((borderEl) => {
    const side = (tag) => {
      const el = borderEl.getElementsByTagName(tag)[0];
      const style = el?.getAttribute('style');
      if (!style) return null;
      return { style, colorSpec: readColorSpec(el.getElementsByTagName('color')[0]) };
    };
    return { top: side('top'), right: side('right'), bottom: side('bottom'), left: side('left') };
  });

  const cellXfs = Array.from(doc.getElementsByTagName('cellXfs')[0]?.children || []).map((xfEl) => {
    const alignEl = xfEl.getElementsByTagName('alignment')[0];
    const horizontal = alignEl?.getAttribute('horizontal');
    return {
      fontId: parseInt(xfEl.getAttribute('fontId') || '0', 10),
      fillId: parseInt(xfEl.getAttribute('fillId') || '0', 10),
      borderId: parseInt(xfEl.getAttribute('borderId') || '0', 10),
      numFmtId: parseInt(xfEl.getAttribute('numFmtId') || '0', 10),
      align: horizontal === 'left' || horizontal === 'center' || horizontal === 'right' ? horizontal : null,
      wrap: alignEl?.getAttribute('wrapText') === '1',
    };
  });

  const numFmts = parseNumFmts(doc);

  return { fills, fonts, borders, cellXfs, numFmts };
}

// Excel border "style" -> a CSS border-width/line-style, approximating the
// several weight/dash variants (hair/thin/medium/thick, dashed/dotted/
// double) down to what's visually distinguishable at cell scale. Used only
// at render time — the canonical stored shape is { style, color } (Excel's
// own vocabulary), so the writer (xlsxPatcher.js) never has to convert back.
const BORDER_WIDTH = {
  hair: '1px', thin: '1px', medium: '2px', thick: '3px',
  dashed: '1px', dotted: '1px', double: '3px', dashDot: '1px', dashDotDot: '1px',
  slantDashDot: '1px', mediumDashed: '2px', mediumDashDot: '2px', mediumDashDotDot: '2px',
};
const BORDER_LINESTYLE = {
  dashed: 'dashed', mediumDashed: 'dashed', dotted: 'dotted', dashDot: 'dashed',
  dashDotDot: 'dashed', mediumDashDot: 'dashed', mediumDashDotDot: 'dashed',
  slantDashDot: 'dashed', double: 'double',
};

export function borderSideToCss(side) {
  if (!side) return null;
  return {
    width: BORDER_WIDTH[side.style] || '1px',
    lineStyle: BORDER_LINESTYLE[side.style] || 'solid',
    color: side.color,
  };
}

function resolveBorderSide(side, themeColors) {
  if (!side) return null;
  return { style: side.style, color: resolveColorSpec(side.colorSpec, themeColors) || '#000000' };
}

function parseSheetStyleIndices(sheetXmlText, parser) {
  const doc = parser.parseFromString(sheetXmlText, 'application/xml');
  const indices = {}; // addr -> style index number
  for (const cellEl of Array.from(doc.getElementsByTagName('c'))) {
    const s = cellEl.getAttribute('s');
    if (s) indices[cellEl.getAttribute('r')] = parseInt(s, 10);
  }
  return indices;
}

function parseAddr(addr) {
  const m = addr.match(/^([A-Z]+)(\d+)$/);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: parseInt(m[2], 10) - 1 };
}

// Returns { [sheetName]: { [addr]: { bold, italic, bg, fg } } } for every
// cell that has an explicit non-default style — sparse, so untouched cells
// (the vast majority) cost nothing to look up (undefined -> no override).
export async function loadCellFormatting(zip, sheetNames) {
  const parser = new DOMParser();
  const nameToPath = await mapSheetNamesToPaths(zip, parser);
  const stylesXmlText = await zip.file('xl/styles.xml')?.async('string');
  if (!stylesXmlText) return {};
  const { fills, fonts, borders, cellXfs, numFmts } = parseStylesXml(stylesXmlText, parser);

  const themeFile = zip.file('xl/theme/theme1.xml');
  const themeColors = themeFile ? parseTheme(await themeFile.async('string'), parser) : null;

  const resolvedByXf = new Map(); // xf index -> {bold, italic, bg, fg, border, numFmt}
  function resolveXf(xfIndex) {
    if (resolvedByXf.has(xfIndex)) return resolvedByXf.get(xfIndex);
    const xf = cellXfs[xfIndex];
    if (!xf) return null;
    const fill = fills[xf.fillId];
    const font = fonts[xf.fontId];
    const borderDef = borders[xf.borderId];
    const numFmt = numFmts[xf.numFmtId] && numFmts[xf.numFmtId] !== 'General' ? numFmts[xf.numFmtId] : null;
    const bg = fill && fill.patternType === 'solid' ? resolveColorSpec(fill.fgColorSpec, themeColors) : null;
    // The workbook's "default" font color is near-black (theme dk1 or plain
    // #000), authored for a white sheet. This app's page is dark-themed, so
    // taking that literally would render ordinary text invisible (black on
    // near-black) — treat near-black as "no deliberate color" instead. But
    // if the cell ALSO has a background fill, it still needs SOME explicit
    // color for contrast against that fill (can't rely on the page's
    // default light text color there either, e.g. white-on-yellow), so pick
    // black/white by the fill's own luminance in that case.
    let fg = font ? resolveColorSpec(font.colorSpec, themeColors) : null;
    if (fg && isNearBlack(fg)) fg = bg ? contrastingTextColor(bg) : null;
    const border = borderDef ? {
      top: resolveBorderSide(borderDef.top, themeColors),
      right: resolveBorderSide(borderDef.right, themeColors),
      bottom: resolveBorderSide(borderDef.bottom, themeColors),
      left: resolveBorderSide(borderDef.left, themeColors),
    } : null;
    const hasBorder = border && (border.top || border.right || border.bottom || border.left);
    // Only surface font family/size when they differ from the workbook's
    // default font (index 0) — otherwise every single styled cell would
    // carry its baseline size (near-universal, e.g. 11) as a "deliberate"
    // override, defeating the sparse-formatting design of this whole map.
    const defaultFont = fonts[0];
    const fontFamily = font?.family && font.family !== defaultFont?.family ? font.family : null;
    const fontSize = font?.size && font.size !== defaultFont?.size ? font.size : null;
    const result = {
      bold: !!font?.bold, italic: !!font?.italic, bg, fg, border: hasBorder ? border : null, numFmt,
      align: xf.align || null, wrap: !!xf.wrap, fontFamily, fontSize,
    };
    const hasAnything = result.bold || result.italic || result.bg || result.fg || result.border || result.numFmt || result.align || result.wrap || result.fontFamily || result.fontSize;
    const finalResult = hasAnything ? result : null;
    resolvedByXf.set(xfIndex, finalResult);
    return finalResult;
  }

  const formatting = {};
  for (const sheetName of sheetNames) {
    const path = nameToPath[sheetName];
    if (!path) continue;
    const sheetXmlText = await zip.file(path)?.async('string');
    if (!sheetXmlText) continue;
    const styleIndices = parseSheetStyleIndices(sheetXmlText, parser);
    const sheetFormatting = {};
    for (const [addr, xfIndex] of Object.entries(styleIndices)) {
      const resolved = resolveXf(xfIndex);
      if (resolved) {
        const { row, col } = parseAddr(addr);
        if (!sheetFormatting[row]) sheetFormatting[row] = {};
        sheetFormatting[row][col] = resolved;
      }
    }
    formatting[sheetName] = sheetFormatting;
  }
  return formatting;
}

// Excel column width is in "character units" of the workbook's default
// font (roughly how many "0" characters fit); row height is in points.
// These are the standard approximate conversions to CSS pixels for a
// default Calibri-11-ish font (MDW≈7) — not pixel-perfect for every font,
// but close enough to make columns/rows read as the right proportions
// instead of pure auto-sizing-by-content.
function colWidthToPx(width) { return Math.round(width * 7 + 5); }
function rowHeightPtToPx(pt) { return Math.round(pt * 96 / 72); }

// Returns { [sheetName]: { colWidths: {[col0idx]: px}, rowHeights: {[row0idx]: px} } }
export async function loadColumnRowSizes(zip, sheetNames) {
  const parser = new DOMParser();
  const nameToPath = await mapSheetNamesToPaths(zip, parser);
  const result = {};
  for (const sheetName of sheetNames) {
    const path = nameToPath[sheetName];
    if (!path) continue;
    const xmlText = await zip.file(path)?.async('string');
    if (!xmlText) continue;
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const colWidths = {};
    const colsEl = doc.getElementsByTagName('cols')[0];
    if (colsEl) {
      for (const colEl of Array.from(colsEl.children)) {
        const min = parseInt(colEl.getAttribute('min'), 10);
        const max = parseInt(colEl.getAttribute('max'), 10);
        const width = parseFloat(colEl.getAttribute('width'));
        if (!width || Number.isNaN(min) || Number.isNaN(max)) continue;
        const px = colWidthToPx(width);
        for (let c = min; c <= max; c++) colWidths[c - 1] = px;
      }
    }

    const rowHeights = {};
    for (const rowEl of Array.from(doc.getElementsByTagName('row'))) {
      const ht = rowEl.getAttribute('ht');
      if (!ht) continue;
      const r = parseInt(rowEl.getAttribute('r'), 10) - 1;
      rowHeights[r] = rowHeightPtToPx(parseFloat(ht));
    }

    result[sheetName] = { colWidths, rowHeights };
  }
  return result;
}
