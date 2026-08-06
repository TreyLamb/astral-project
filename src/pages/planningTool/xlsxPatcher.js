import JSZip from 'jszip';
import { columnLetter } from './xlsxEngine';

const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG_RELS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CT = 'http://schemas.openxmlformats.org/package/2006/content-types';
const WORKSHEET_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';
const WORKSHEET_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
const MINIMAL_WORKSHEET_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS_MAIN}"><sheetData/></worksheet>`;

function contentsEqual(a, b) {
  const an = a === undefined ? null : a;
  const bn = b === undefined ? null : b;
  if (an === null) return bn === null;
  if (bn === null) return false;
  const na = Number(an), nb = Number(bn);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return Math.abs(na - nb) < 1e-9;
  return String(an) === String(bn);
}

// Compares the live HyperFormula state against the pristine snapshot
// captured right after load and returns only the cells that actually
// differ — regardless of whether the change came from typing, pasting,
// deleting, or undo/redo, since this just diffs final state vs. original
// state rather than trying to track edit history. Both sides are read
// through HyperFormula's own getCellFormula/getCellValue, so cells nobody
// touched compare exactly equal even where HyperFormula's serialization
// isn't byte-identical to the original file's formula text (e.g. it
// rewrites -0.0000001 as -1e-7) — diffing against the raw pre-parse text
// instead would false-positive on those.
export function computeEditsForDownload(hf, sheetNames, pristineGrids) {
  const edits = new Map(); // key `${sheetName}::${addr}` -> raw content string|number|null
  for (const sheetName of sheetNames) {
    const sheetId = hf.getSheetId(sheetName);
    const dims = hf.getSheetDimensions(sheetId);
    const pristineSheet = pristineGrids[sheetName] || [];
    for (let r = 0; r < dims.height; r++) {
      for (let c = 0; c < dims.width; c++) {
        const addr = { sheet: sheetId, row: r, col: c };
        let current;
        if (hf.doesCellHaveFormula(addr)) {
          current = hf.getCellFormula(addr);
        } else {
          const v = hf.getCellValue(addr);
          current = v !== null && typeof v === 'object' ? null : v ?? null;
        }
        const pristine = pristineSheet[r]?.[c] ?? null;
        if (!contentsEqual(current, pristine)) {
          edits.set(`${sheetName}::${columnLetter(c)}${r + 1}`, current);
        }
      }
    }
  }
  return edits;
}

// rowNumber is 1-indexed (matches the XML <row r="N"> attribute directly);
// col is 0-indexed (matches HyperFormula's addressing). Callers must convert
// explicitly rather than guessing — mixing the two up silently shifted every
// patched cell into the wrong row in an earlier version of this file.
function parseAddr(addr) {
  const m = addr.match(/^([A-Z]+)(\d+)$/);
  return { col: colLettersToIndex(m[1]), rowNumber: parseInt(m[2], 10) };
}

function colLettersToIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function mapSheetNamesToPaths(zip, parser) {
  const wbXml = await zip.file('xl/workbook.xml').async('string');
  const relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  const wbDoc = parser.parseFromString(wbXml, 'application/xml');
  const relsDoc = parser.parseFromString(relsXml, 'application/xml');

  const relIdToTarget = {};
  Array.from(relsDoc.getElementsByTagName('Relationship')).forEach((rel) => {
    relIdToTarget[rel.getAttribute('Id')] = rel.getAttribute('Target');
  });

  const nameToPath = {};
  Array.from(wbDoc.getElementsByTagName('sheet')).forEach((sheetEl) => {
    const name = sheetEl.getAttribute('name');
    const rId = sheetEl.getAttributeNS(NS_R, 'id') || sheetEl.getAttribute('r:id');
    const target = relIdToTarget[rId];
    if (!target) return;
    nameToPath[name] = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  });
  return nameToPath;
}

function findOrCreateRow(sheetDataEl, doc, rowNum) {
  const rows = Array.from(sheetDataEl.getElementsByTagName('row'));
  let found = rows.find((r) => parseInt(r.getAttribute('r'), 10) === rowNum);
  if (found) return found;
  found = doc.createElementNS(NS_MAIN, 'row');
  found.setAttribute('r', String(rowNum));
  const after = rows.find((r) => parseInt(r.getAttribute('r'), 10) > rowNum);
  if (after) sheetDataEl.insertBefore(found, after);
  else sheetDataEl.appendChild(found);
  return found;
}

function findOrCreateCell(rowEl, doc, addr, colIndex) {
  const cells = Array.from(rowEl.childNodes).filter((n) => n.nodeType === 1 && n.tagName === 'c');
  let found = cells.find((c) => c.getAttribute('r') === addr);
  if (found) return found;
  found = doc.createElementNS(NS_MAIN, 'c');
  found.setAttribute('r', addr);
  const after = cells.find((c) => parseAddr(c.getAttribute('r')).col > colIndex);
  if (after) rowEl.insertBefore(found, after);
  else rowEl.appendChild(found);
  return found;
}

function applyCellEdit(doc, cellEl, rawContent, computedValue) {
  while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);

  if (rawContent === null || rawContent === undefined) {
    cellEl.removeAttribute('t');
    return;
  }

  // A formula that currently evaluates to an error (#REF!, #DIV/0!, etc. —
  // several genuinely exist in this kind of organically-grown workbook)
  // must still get a proper t="e" + <v>#ERROR!</v> pair. Leaving both off
  // (which happens if you naively treat "computedValue is an object, not a
  // string/number" as "no value to write") produces a bare <f> with no
  // type/value at all — schema-legal on paper, but confirmed via direct
  // Excel-COM testing to make real Excel refuse to open the file outright
  // (generic "Unable to get the Open property of the Workbooks class"),
  // while more lenient readers like LibreOffice tolerate it silently.
  const isErrorValue = computedValue !== null && typeof computedValue === 'object' && 'type' in computedValue;

  if (typeof rawContent === 'string' && rawContent.startsWith('=')) {
    const fEl = doc.createElementNS(NS_MAIN, 'f');
    fEl.textContent = rawContent.slice(1);
    cellEl.appendChild(fEl);
    if (isErrorValue) {
      cellEl.setAttribute('t', 'e');
      const vEl = doc.createElementNS(NS_MAIN, 'v');
      vEl.textContent = computedValue.value;
      cellEl.appendChild(vEl);
    } else if (typeof computedValue === 'string') {
      cellEl.setAttribute('t', 'str');
      const vEl = doc.createElementNS(NS_MAIN, 'v');
      vEl.textContent = computedValue;
      cellEl.appendChild(vEl);
    } else if (typeof computedValue === 'number') {
      cellEl.removeAttribute('t');
      const vEl = doc.createElementNS(NS_MAIN, 'v');
      vEl.textContent = String(computedValue);
      cellEl.appendChild(vEl);
    } else {
      cellEl.removeAttribute('t');
    }
    return;
  }

  if (typeof rawContent === 'number') {
    cellEl.removeAttribute('t');
    const vEl = doc.createElementNS(NS_MAIN, 'v');
    vEl.textContent = String(rawContent);
    cellEl.appendChild(vEl);
    return;
  }

  // plain text — inline string, so we never have to touch sharedStrings.xml
  cellEl.setAttribute('t', 'inlineStr');
  const isEl = doc.createElementNS(NS_MAIN, 'is');
  const tEl = doc.createElementNS(NS_MAIN, 't');
  tEl.textContent = String(rawContent);
  isEl.appendChild(tEl);
  cellEl.appendChild(isEl);
}

// --- style writing (bold/italic/underline/font color/fill/borders) ---
//
// Real element order inside <font> and <border>, verified against this
// workbook's own Excel-authored styles.xml (b,i,u,sz,color,name,family,
// scheme for fonts; left,right,top,bottom,diagonal — always all 5 —  for
// borders) rather than assumed from the abstract schema, since getting
// this wrong is exactly the kind of thing that makes Excel silently
// "repair" (and mangle) a file.
const FONT_CHILD_ORDER = ['b', 'i', 'strike', 'u', 'sz', 'color', 'name', 'family', 'scheme'];
const BORDER_SIDE_ORDER = ['left', 'right', 'top', 'bottom', 'diagonal'];
const WORKSHEET_CHILD_ORDER = [
  'sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData',
  'sheetCalcPr', 'sheetProtection', 'protectedRanges', 'scenarios', 'autoFilter',
  'sortState', 'dataConsolidate', 'customSheetViews', 'mergeCells', 'phoneticPr',
  'conditionalFormatting', 'dataValidations', 'hyperlinks', 'printOptions',
  'pageMargins', 'pageSetup', 'headerFooter', 'rowBreaks', 'colBreaks',
  'customProperties', 'cellWatches', 'ignoredErrors', 'smartTags', 'drawing',
  'legacyDrawing', 'legacyDrawingHF', 'picture', 'oleObjects', 'controls',
  'webPublishItems', 'tableParts', 'extLst',
];
const STYLESHEET_CHILD_ORDER = [
  'numFmts', 'fonts', 'fills', 'borders', 'cellStyleXfs', 'cellXfs',
  'cellStyles', 'dxfs', 'tableStyles', 'colors', 'extLst',
];

function hexToArgb(hex) {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

function insertInOrder(parent, newEl, orderList) {
  const myIdx = orderList.indexOf(newEl.tagName);
  const insertBefore = Array.from(parent.children).find((c) => {
    const idx = orderList.indexOf(c.tagName);
    return idx !== -1 && idx > myIdx;
  });
  if (insertBefore) parent.insertBefore(newEl, insertBefore);
  else parent.appendChild(newEl);
}

function setFontFlagChild(doc, fontEl, tag, shouldHave) {
  const existing = Array.from(fontEl.children).find((c) => c.tagName === tag);
  if (shouldHave) {
    if (!existing) insertInOrder(fontEl, doc.createElementNS(NS_MAIN, tag), FONT_CHILD_ORDER);
  } else if (existing) {
    fontEl.removeChild(existing);
  }
}

function setFontColorChild(doc, fontEl, hexOrNull) {
  const existing = Array.from(fontEl.children).find((c) => c.tagName === 'color');
  if (existing) fontEl.removeChild(existing);
  if (hexOrNull) {
    const el = doc.createElementNS(NS_MAIN, 'color');
    el.setAttribute('rgb', hexToArgb(hexOrNull));
    insertInOrder(fontEl, el, FONT_CHILD_ORDER);
  }
}

function setFontSzChild(doc, fontEl, size) {
  const existing = Array.from(fontEl.children).find((c) => c.tagName === 'sz');
  if (existing) fontEl.removeChild(existing);
  const el = doc.createElementNS(NS_MAIN, 'sz');
  el.setAttribute('val', String(size));
  insertInOrder(fontEl, el, FONT_CHILD_ORDER);
}

function setFontNameChild(doc, fontEl, name) {
  const existing = Array.from(fontEl.children).find((c) => c.tagName === 'name');
  if (existing) fontEl.removeChild(existing);
  const el = doc.createElementNS(NS_MAIN, 'name');
  el.setAttribute('val', name);
  insertInOrder(fontEl, el, FONT_CHILD_ORDER);
  // <scheme val="minor"/> (present on virtually every font in a workbook
  // that never had its font manually changed in Excel) tells Excel this
  // font follows the theme's font choice — confirmed via real Excel COM
  // testing that it wins over a literal <name> we set here, silently
  // showing the theme's font (Calibri) instead of the one just picked.
  // An explicitly user-chosen font isn't "the theme's font" anymore.
  const schemeEl = Array.from(fontEl.children).find((c) => c.tagName === 'scheme');
  if (schemeEl) fontEl.removeChild(schemeEl);
}

// Builds font/fill/border/xf entries on demand, reusing an identical
// already-created one from earlier in this same download so formatting a
// whole range doesn't create a pile of near-duplicate style table entries.
// Doesn't attempt to find/reuse a match among the *original* file's
// (potentially hundreds of) pre-existing entries — always-append is simpler
// and just as valid OOXML (real-world workbooks routinely carry redundant
// style entries), just slightly less tidy.
function makeStyleWriter(doc, fontsEl, fillsEl, bordersEl, cellXfsEl) {
  const fontCache = new Map(), fillCache = new Map(), borderCache = new Map(), xfCache = new Map();

  function getOrAppendFont(baseFontId, overrides) {
    const key = JSON.stringify([baseFontId, overrides]);
    if (fontCache.has(key)) return fontCache.get(key);
    const baseEl = Array.from(fontsEl.children)[baseFontId];
    const el = baseEl ? baseEl.cloneNode(true) : doc.createElementNS(NS_MAIN, 'font');
    if (overrides.bold !== undefined) setFontFlagChild(doc, el, 'b', overrides.bold);
    if (overrides.italic !== undefined) setFontFlagChild(doc, el, 'i', overrides.italic);
    if (overrides.underline !== undefined) setFontFlagChild(doc, el, 'u', overrides.underline);
    if (overrides.fg !== undefined) setFontColorChild(doc, el, overrides.fg);
    // Truthy (not `!== undefined`) — null/0 here means "no explicit
    // size/family, use the base font's own", not "write a literal null"
    // (which `setFontSzChild`/`setFontNameChild` would otherwise stamp in
    // as the string "null", an invalid `val` — real Excel-rejecting
    // corruption, same class of bug as `getOrAppendFill`/`getOrAppendBorder`
    // below not handling null).
    if (overrides.fontSize) setFontSzChild(doc, el, overrides.fontSize);
    if (overrides.fontFamily) setFontNameChild(doc, el, overrides.fontFamily);
    const idx = fontsEl.children.length;
    fontsEl.appendChild(el);
    fontCache.set(key, idx);
    return idx;
  }

  function getOrAppendFill(hexBg) {
    // null means "clear the fill" (the toolbar's Clear button, or format
    // painter copying a source cell that had no fill) — fillId 0 is always
    // the built-in "none" pattern present in every styles.xml, so just point
    // there instead of building a fgColor from a null hex (which used to
    // throw inside hexToArgb's `.replace('#', ...)` on a null value).
    if (!hexBg) return 0;
    const key = 'fill:' + hexBg;
    if (fillCache.has(key)) return fillCache.get(key);
    const fillEl = doc.createElementNS(NS_MAIN, 'fill');
    const pf = doc.createElementNS(NS_MAIN, 'patternFill');
    pf.setAttribute('patternType', 'solid');
    const fg = doc.createElementNS(NS_MAIN, 'fgColor');
    fg.setAttribute('rgb', hexToArgb(hexBg));
    pf.appendChild(fg);
    const bg = doc.createElementNS(NS_MAIN, 'bgColor');
    bg.setAttribute('indexed', '64');
    pf.appendChild(bg);
    fillEl.appendChild(pf);
    const idx = fillsEl.children.length;
    fillsEl.appendChild(fillEl);
    fillCache.set(key, idx);
    return idx;
  }

  // borderSpec: null (no border at all) | { top, right, bottom, left } each
  // null | { style, color }
  function getOrAppendBorder(borderSpecOrNull) {
    const borderSpec = borderSpecOrNull || {};
    const key = 'border:' + JSON.stringify(borderSpec);
    if (borderCache.has(key)) return borderCache.get(key);
    const borderEl = doc.createElementNS(NS_MAIN, 'border');
    for (const side of BORDER_SIDE_ORDER) {
      const sideEl = doc.createElementNS(NS_MAIN, side);
      const spec = side !== 'diagonal' ? borderSpec[side] : null;
      if (spec) {
        sideEl.setAttribute('style', spec.style);
        const colorEl = doc.createElementNS(NS_MAIN, 'color');
        colorEl.setAttribute('rgb', hexToArgb(spec.color));
        sideEl.appendChild(colorEl);
      }
      borderEl.appendChild(sideEl);
    }
    const idx = bordersEl.children.length;
    bordersEl.appendChild(borderEl);
    borderCache.set(key, idx);
    return idx;
  }

  // alignment: null | { horizontal?: 'left'|'center'|'right', wrapText?: bool }
  function getOrAppendXf(numFmtId, fontId, fillId, borderId, alignment) {
    const key = JSON.stringify([fontId, fillId, borderId, numFmtId, alignment]);
    if (xfCache.has(key)) return xfCache.get(key);
    const xfEl = doc.createElementNS(NS_MAIN, 'xf');
    xfEl.setAttribute('numFmtId', numFmtId || '0');
    xfEl.setAttribute('fontId', String(fontId));
    xfEl.setAttribute('fillId', String(fillId));
    xfEl.setAttribute('borderId', String(borderId));
    xfEl.setAttribute('xfId', '0');
    xfEl.setAttribute('applyFont', '1');
    xfEl.setAttribute('applyFill', '1');
    xfEl.setAttribute('applyBorder', '1');
    if (alignment && (alignment.horizontal || alignment.wrapText)) {
      xfEl.setAttribute('applyAlignment', '1');
      const alignEl = doc.createElementNS(NS_MAIN, 'alignment');
      if (alignment.horizontal) alignEl.setAttribute('horizontal', alignment.horizontal);
      if (alignment.wrapText) alignEl.setAttribute('wrapText', '1');
      xfEl.appendChild(alignEl);
    }
    const idx = cellXfsEl.children.length;
    cellXfsEl.appendChild(xfEl);
    xfCache.set(key, idx);
    return idx;
  }

  return { getOrAppendFont, getOrAppendFill, getOrAppendBorder, getOrAppendXf };
}

function applyStyleOverrideToCell(cellEl, override, cellXfsEl, styleWriter) {
  const currentXfIndex = parseInt(cellEl.getAttribute('s') || '0', 10);
  const currentXf = Array.from(cellXfsEl.children)[currentXfIndex];
  const baseFontId = currentXf ? parseInt(currentXf.getAttribute('fontId') || '0', 10) : 0;
  const baseFillId = currentXf ? parseInt(currentXf.getAttribute('fillId') || '0', 10) : 0;
  const baseBorderId = currentXf ? parseInt(currentXf.getAttribute('borderId') || '0', 10) : 0;
  const numFmtId = currentXf ? currentXf.getAttribute('numFmtId') : '0';
  const baseAlignEl = currentXf?.getElementsByTagName('alignment')[0];

  const fontOverrides = {};
  for (const k of ['bold', 'italic', 'underline', 'fg', 'fontSize', 'fontFamily']) {
    if (override[k] !== undefined) fontOverrides[k] = override[k];
  }
  const fontId = Object.keys(fontOverrides).length > 0
    ? styleWriter.getOrAppendFont(baseFontId, fontOverrides)
    : baseFontId;
  const fillId = override.bg !== undefined ? styleWriter.getOrAppendFill(override.bg) : baseFillId;
  const borderId = override.border !== undefined ? styleWriter.getOrAppendBorder(override.border) : baseBorderId;

  const alignment = {
    horizontal: override.align !== undefined ? override.align : baseAlignEl?.getAttribute('horizontal') || null,
    wrapText: override.wrap !== undefined ? override.wrap : baseAlignEl?.getAttribute('wrapText') === '1',
  };

  cellEl.setAttribute('s', String(styleWriter.getOrAppendXf(numFmtId, fontId, fillId, borderId, alignment)));
}

// Inverse of xlsxStyles.js's colWidthToPx/rowHeightPtToPx approximations.
function pxToColWidth(px) { return Math.max(0, (px - 5) / 7); }
function pxToRowHeightPt(px) { return Math.max(0, px * 72 / 96); }

// Doesn't attempt to split/merge existing <col> min-max ranges — just
// appends a specific min=max=(col+1) entry after them for each resized
// column. Excel applies later entries over earlier overlapping ones in
// practice, so this reliably wins for the resized column without the
// complexity of rewriting the original ranges. Row heights are simpler:
// each row already gets its own <row> element via findOrCreateRow.
function applyColumnRowSizes(doc, worksheetEl, sheetData, sizeOverride) {
  if (!sizeOverride) return;
  const colWidths = sizeOverride.colWidths || {};
  if (Object.keys(colWidths).length > 0) {
    let colsEl = doc.getElementsByTagName('cols')[0];
    if (!colsEl) {
      colsEl = doc.createElementNS(NS_MAIN, 'cols');
      insertInOrder(worksheetEl, colsEl, WORKSHEET_CHILD_ORDER);
    }
    for (const [colStr, px] of Object.entries(colWidths)) {
      const colNum = parseInt(colStr, 10) + 1;
      const colEl = doc.createElementNS(NS_MAIN, 'col');
      colEl.setAttribute('min', String(colNum));
      colEl.setAttribute('max', String(colNum));
      colEl.setAttribute('width', pxToColWidth(px).toFixed(2));
      colEl.setAttribute('customWidth', '1');
      colsEl.appendChild(colEl);
    }
  }

  const rowHeights = sizeOverride.rowHeights || {};
  for (const [rowStr, px] of Object.entries(rowHeights)) {
    const rowNumber = parseInt(rowStr, 10) + 1;
    const rowEl = findOrCreateRow(sheetData, doc, rowNumber);
    rowEl.setAttribute('ht', pxToRowHeightPt(px).toFixed(2));
    rowEl.setAttribute('customHeight', '1');
  }
}

// Filter is purely a display concern — sets `hidden="1"` on the affected
// `<row>` elements (creating them via findOrCreateRow if a genuinely blank
// row has no element yet) and nothing else. There's no `<autoFilter>`/
// `<filterColumn>` metadata written back (that's what drives Excel's own
// filter-dropdown UI/criteria) — reopening in Excel shows the same hidden
// rows, just without an adjustable AutoFilter dropdown on the header. Same
// "cover the common case, document the rest" scope judgment as elsewhere.
function applyHiddenRows(doc, sheetData, hiddenRows) {
  if (!hiddenRows || hiddenRows.length === 0) return;
  for (const r of hiddenRows) {
    const rowEl = findOrCreateRow(sheetData, doc, r + 1);
    rowEl.setAttribute('hidden', '1');
  }
}

function rangeToSqref({ r0, r1, c0, c1 }) {
  const a = columnLetter(c0) + (r0 + 1);
  const b = columnLetter(c1) + (r1 + 1);
  return a === b ? a : `${a}:${b}`;
}

function appendValidationsToSheet(doc, worksheetEl, validations) {
  if (!validations || validations.length === 0) return;
  let container = doc.getElementsByTagName('dataValidations')[0];
  if (!container) {
    container = doc.createElementNS(NS_MAIN, 'dataValidations');
    insertInOrder(worksheetEl, container, WORKSHEET_CHILD_ORDER);
  }
  for (const v of validations) {
    const dv = doc.createElementNS(NS_MAIN, 'dataValidation');
    dv.setAttribute('type', 'list');
    dv.setAttribute('allowBlank', '1');
    dv.setAttribute('showInputMessage', '1');
    dv.setAttribute('showErrorMessage', '1');
    dv.setAttribute('sqref', rangeToSqref(v));
    const f1 = doc.createElementNS(NS_MAIN, 'formula1');
    f1.textContent = `"${v.options.join(',')}"`;
    dv.appendChild(f1);
    container.appendChild(dv);
  }
  container.setAttribute('count', String(parseInt(container.getAttribute('count') || '0', 10) + validations.length));
}

// New conditional-formatting rules created in this session — scoped to the
// single most common real-world case (cellIs: highlight cells matching a
// comparison against a fixed value), same "cover the common case, not the
// whole spec" judgment as the dropdown/validation tool only supporting
// literal lists. Reading + rendering EXISTING rules of every supported type
// (colorScale, dataBar, top10, etc. — see xlsxConditionalFormatting.js)
// already works; this only ever ADDS new cellIs rules, and there's no UI to
// remove/edit an existing file-loaded rule yet (would mean splitting or
// shrinking its sqref, a bigger undertaking than the "add mine" case here).
function appendConditionalFormattingToSheet(doc, worksheetEl, stylesDoc, rules) {
  if (!rules || rules.length === 0) return;
  let dxfsEl = stylesDoc.getElementsByTagName('dxfs')[0];
  if (!dxfsEl) {
    dxfsEl = stylesDoc.createElementNS(NS_MAIN, 'dxfs');
    dxfsEl.setAttribute('count', '0');
    insertInOrder(stylesDoc.documentElement, dxfsEl, STYLESHEET_CHILD_ORDER);
  }

  // Shift every existing rule's priority down to make room at 1..N —
  // matches Excel's own behavior where a freshly added rule takes top
  // precedence (lowest priority number = evaluated first) over whatever
  // was already there.
  for (const el of Array.from(worksheetEl.getElementsByTagName('cfRule'))) {
    const p = parseInt(el.getAttribute('priority') || '0', 10);
    el.setAttribute('priority', String(p + rules.length));
  }

  rules.forEach((rule, i) => {
    const dxfEl = stylesDoc.createElementNS(NS_MAIN, 'dxf');
    if (rule.fg) {
      const fontEl = stylesDoc.createElementNS(NS_MAIN, 'font');
      const colorEl = stylesDoc.createElementNS(NS_MAIN, 'color');
      colorEl.setAttribute('rgb', hexToArgb(rule.fg));
      fontEl.appendChild(colorEl);
      dxfEl.appendChild(fontEl);
    }
    if (rule.bg) {
      // dxf fills use bgColor for the effective solid color, not fgColor
      // like a normal cellXfs fill — confirmed against a real-Excel-
      // authored dxf while building the read side of this feature.
      const fillEl = stylesDoc.createElementNS(NS_MAIN, 'fill');
      const pf = stylesDoc.createElementNS(NS_MAIN, 'patternFill');
      const bgColorEl = stylesDoc.createElementNS(NS_MAIN, 'bgColor');
      bgColorEl.setAttribute('rgb', hexToArgb(rule.bg));
      pf.appendChild(bgColorEl);
      fillEl.appendChild(pf);
      dxfEl.appendChild(fillEl);
    }
    const dxfId = dxfsEl.children.length;
    dxfsEl.appendChild(dxfEl);
    dxfsEl.setAttribute('count', String(dxfsEl.children.length));

    const cfEl = doc.createElementNS(NS_MAIN, 'conditionalFormatting');
    cfEl.setAttribute('sqref', rangeToSqref(rule));
    const cfRuleEl = doc.createElementNS(NS_MAIN, 'cfRule');
    cfRuleEl.setAttribute('type', 'cellIs');
    cfRuleEl.setAttribute('dxfId', String(dxfId));
    cfRuleEl.setAttribute('priority', String(i + 1));
    cfRuleEl.setAttribute('operator', rule.operator);
    const f1El = doc.createElementNS(NS_MAIN, 'formula');
    f1El.textContent = String(rule.formula1);
    cfRuleEl.appendChild(f1El);
    if (rule.formula2 !== undefined) {
      const f2El = doc.createElementNS(NS_MAIN, 'formula');
      f2El.textContent = String(rule.formula2);
      cfRuleEl.appendChild(f2El);
    }
    cfEl.appendChild(cfRuleEl);
    insertInOrder(worksheetEl, cfEl, WORKSHEET_CHILD_ORDER);
  });
}

// --- structural changes (row/column insert/delete) ---
//
// Inserting/deleting a row or column invalidates the surgical value-diff
// approach entirely for that sheet: HyperFormula shifts every affected
// formula's references internally (verified: a formula referencing row 6
// automatically becomes row 7 after inserting a row above it, even for
// cells that didn't themselves move), but computeEditsForDownload's
// pristine-snapshot comparison assumes stable row/col indices — after a
// shift, "row 7 now" doesn't correspond to "row 7 in the original snapshot"
// anymore. So a structurally-changed sheet gets two passes instead: first
// RELABEL the existing <row>/<c> elements' r/address attributes to their
// new positions (this is what preserves each cell's style — same element,
// same `s` attribute, just renumbered), then fully rewrite every cell's
// <v>/<f> content from hf's current state (which is now correct post-shift)
// on top of those relabeled elements.
function shiftSheetRowsInXml(sheetData, insertAt, delta) {
  const rows = Array.from(sheetData.getElementsByTagName('row'));
  const threshold = insertAt + 1; // 1-indexed row-number boundary
  for (const rowEl of rows) {
    const rowNum = parseInt(rowEl.getAttribute('r'), 10);
    if (delta < 0 && rowNum === threshold) { sheetData.removeChild(rowEl); continue; }
    const movingDown = delta > 0 ? rowNum >= threshold : rowNum > threshold;
    if (!movingDown) continue;
    const newRowNum = rowNum + delta;
    rowEl.setAttribute('r', String(newRowNum));
    for (const cellEl of Array.from(rowEl.getElementsByTagName('c'))) {
      const m = cellEl.getAttribute('r').match(/^([A-Z]+)(\d+)$/);
      cellEl.setAttribute('r', `${m[1]}${newRowNum}`);
    }
  }
}

function shiftSheetColumnsInXml(doc, sheetData, insertAt, delta) {
  for (const rowEl of Array.from(sheetData.getElementsByTagName('row'))) {
    for (const cellEl of Array.from(rowEl.getElementsByTagName('c'))) {
      const m = cellEl.getAttribute('r').match(/^([A-Z]+)(\d+)$/);
      const colIdx = colLettersToIndex(m[1]);
      if (delta < 0 && colIdx === insertAt) { rowEl.removeChild(cellEl); continue; }
      const moving = delta > 0 ? colIdx >= insertAt : colIdx > insertAt;
      if (!moving) continue;
      cellEl.setAttribute('r', `${columnLetter(colIdx + delta)}${m[2]}`);
    }
  }
  const colsEl = doc.getElementsByTagName('cols')[0];
  if (colsEl) {
    for (const colEl of Array.from(colsEl.children)) {
      let min = parseInt(colEl.getAttribute('min'), 10) - 1;
      let max = parseInt(colEl.getAttribute('max'), 10) - 1;
      const shift = (v) => (delta > 0 ? (v >= insertAt ? v + delta : v) : (v > insertAt ? v + delta : v));
      min = shift(min);
      max = shift(max);
      colEl.setAttribute('min', String(min + 1));
      colEl.setAttribute('max', String(max + 1));
    }
  }
}

// Rewrites every cell's <v>/<f> from hf's current (post-shift, correct)
// state onto whatever <row>/<c> elements already exist at that address
// (reused via findOrCreateRow/findOrCreateCell, so an existing cell's style
// `s` attribute — already relabeled to the right position by
// shiftSheetRowsInXml/shiftSheetColumnsInXml — is preserved; only brand-new
// cells created here start with no style, which is correct for genuinely
// new rows/columns).
function fullyRewriteSheetContent(doc, sheetData, hf, sheetId, dims) {
  for (let r = 0; r < dims.height; r++) {
    const rowNumber = r + 1;
    for (let c = 0; c < dims.width; c++) {
      const addr = { sheet: sheetId, row: r, col: c };
      let current;
      if (hf.doesCellHaveFormula(addr)) current = hf.getCellFormula(addr);
      else { const v = hf.getCellValue(addr); current = v !== null && typeof v === 'object' ? null : v ?? null; }
      if (current === null) continue;
      const cellAddr = columnLetter(c) + rowNumber;
      const rowEl = findOrCreateRow(sheetData, doc, rowNumber);
      const cellEl = findOrCreateCell(rowEl, doc, cellAddr, c);
      applyCellEdit(doc, cellEl, current, hf.getCellValue(addr));
    }
  }
}

// Sort is an arbitrary permutation, not a delta shift — unlike row/column
// insert-delete, there's no way to preserve each cell's style by just
// relabeling the SAME DOM element (a delta shift keeps every row's element
// identity; a permutation moves rows past each other, so "the 3rd row
// element" doesn't correspond to any single stable original position
// anymore). So this captures every affected cell's style attribute by its
// ORIGINAL position first, removes the existing row elements in the sorted
// range entirely, then rebuilds them at their NEW positions with content
// from hf's current (already-permuted, via hf.setRowOrder) state and style
// from the captured original-position lookup. `fullyRewriteSheetContent`
// is expected to run afterward for the whole sheet regardless (same as the
// row/col insert-delete flow) — it only ever touches cell content, never
// the `s` attribute, so it can't clobber what this function just set.
function permuteSortedRows(doc, sheetData, hf, sheetId, width, r0, r1, permutation) {
  const styleByOldPos = new Map(); // "row,col" -> style index string
  for (const rowEl of Array.from(sheetData.getElementsByTagName('row'))) {
    const rn = parseInt(rowEl.getAttribute('r'), 10);
    const r = rn - 1;
    if (r < r0 || r > r1) continue;
    for (const cellEl of Array.from(rowEl.getElementsByTagName('c'))) {
      if (!cellEl.hasAttribute('s')) continue;
      const { col } = parseAddr(cellEl.getAttribute('r'));
      styleByOldPos.set(`${r},${col}`, cellEl.getAttribute('s'));
    }
    sheetData.removeChild(rowEl);
  }

  for (let r = r0; r <= r1; r++) {
    const newRow = r0 + permutation[r - r0];
    const rowNumber = newRow + 1;
    for (let c = 0; c < width; c++) {
      const style = styleByOldPos.get(`${r},${c}`);
      const addr = { sheet: sheetId, row: newRow, col: c };
      let current;
      if (hf.doesCellHaveFormula(addr)) current = hf.getCellFormula(addr);
      else { const v = hf.getCellValue(addr); current = v !== null && typeof v === 'object' ? null : v ?? null; }
      if (current === null && style === undefined) continue;
      const cellAddr = columnLetter(c) + rowNumber;
      const rowEl = findOrCreateRow(sheetData, doc, rowNumber);
      const cellEl = findOrCreateCell(rowEl, doc, cellAddr, c);
      if (current !== null) applyCellEdit(doc, cellEl, current, hf.getCellValue(addr));
      if (style !== undefined) cellEl.setAttribute('s', style);
    }
  }
}

// Replays sheet-level add/delete/rename ops against workbook.xml/
// workbook.xml.rels/[Content_Types].xml (plus, for delete, removing the
// worksheet's own XML part; for add, creating a brand-new minimal one) —
// BEFORE mapSheetNamesToPaths runs, so it naturally picks up the result
// (a renamed sheet still resolves to its original, untouched XML part; a
// newly-added sheet resolves to the fresh minimal part just created; a
// deleted sheet simply no longer appears). Finally reorders <sheets> to
// match finalSheetOrder — tab order is absolute, not a delta, so there's no
// per-move history to replay, just "make it match this list".
async function applySheetStructureToZip(zip, parser, serializer, sheetOps, finalSheetOrder) {
  if (sheetOps.length === 0) return;
  const wbXmlText = await zip.file('xl/workbook.xml').async('string');
  const relsXmlText = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  const ctXmlText = await zip.file('[Content_Types].xml').async('string');
  const wbDoc = parser.parseFromString(wbXmlText, 'application/xml');
  const relsDoc = parser.parseFromString(relsXmlText, 'application/xml');
  const ctDoc = parser.parseFromString(ctXmlText, 'application/xml');

  const sheetsEl = wbDoc.getElementsByTagName('sheets')[0];
  const relsRoot = relsDoc.documentElement;
  const ctRoot = ctDoc.documentElement;

  const findSheetEl = (name) => Array.from(sheetsEl.children).find((s) => s.getAttribute('name') === name);
  const getRid = (sheetEl) => sheetEl.getAttributeNS(NS_R, 'id') || sheetEl.getAttribute('r:id');
  const relPathFor = (rId) => {
    const relEl = Array.from(relsRoot.getElementsByTagName('Relationship')).find((r) => r.getAttribute('Id') === rId);
    if (!relEl) return { relEl: null, path: null };
    const target = relEl.getAttribute('Target');
    return { relEl, path: target.startsWith('/') ? target.slice(1) : `xl/${target}` };
  };
  const nextRelId = () => {
    const ids = Array.from(relsRoot.getElementsByTagName('Relationship'))
      .map((r) => parseInt((r.getAttribute('Id') || '').replace('rId', ''), 10))
      .filter((n) => !Number.isNaN(n));
    return 'rId' + (Math.max(0, ...ids) + 1);
  };
  const nextSheetFileNum = () => {
    const nums = (zip.file(/xl\/worksheets\/sheet\d+\.xml$/) || [])
      .map((f) => parseInt(f.name.match(/sheet(\d+)\.xml$/)[1], 10));
    return Math.max(0, ...nums) + 1;
  };
  const nextSheetId = () => {
    const ids = Array.from(sheetsEl.children).map((s) => parseInt(s.getAttribute('sheetId') || '0', 10));
    return Math.max(0, ...ids) + 1;
  };

  for (const op of sheetOps) {
    if (op.type === 'rename') {
      const el = findSheetEl(op.from);
      if (el) el.setAttribute('name', op.to);
    } else if (op.type === 'delete') {
      const el = findSheetEl(op.name);
      if (!el) continue;
      const { relEl, path } = relPathFor(getRid(el));
      if (relEl) relsRoot.removeChild(relEl);
      if (path) {
        zip.remove(path);
        const ctEl = Array.from(ctRoot.getElementsByTagName('Override')).find((o) => o.getAttribute('PartName') === `/${path}`);
        if (ctEl) ctRoot.removeChild(ctEl);
      }
      sheetsEl.removeChild(el);
    } else if (op.type === 'add') {
      const fileNum = nextSheetFileNum();
      const newPath = `xl/worksheets/sheet${fileNum}.xml`;
      zip.file(newPath, MINIMAL_WORKSHEET_XML);
      const rId = nextRelId();
      const relEl = relsDoc.createElementNS(NS_PKG_RELS, 'Relationship');
      relEl.setAttribute('Id', rId);
      relEl.setAttribute('Type', WORKSHEET_REL_TYPE);
      relEl.setAttribute('Target', `worksheets/sheet${fileNum}.xml`);
      relsRoot.appendChild(relEl);
      const ctEl = ctDoc.createElementNS(NS_CT, 'Override');
      ctEl.setAttribute('PartName', `/${newPath}`);
      ctEl.setAttribute('ContentType', WORKSHEET_CONTENT_TYPE);
      ctRoot.appendChild(ctEl);
      const sheetEl = wbDoc.createElementNS(NS_MAIN, 'sheet');
      sheetEl.setAttribute('name', op.name);
      sheetEl.setAttribute('sheetId', String(nextSheetId()));
      sheetEl.setAttributeNS(NS_R, 'r:id', rId);
      sheetsEl.appendChild(sheetEl);
    }
  }

  for (const name of finalSheetOrder) {
    const el = findSheetEl(name);
    if (el) sheetsEl.appendChild(el); // appendChild on an existing child moves it — this reorders in one pass
  }

  zip.file('xl/workbook.xml', serializer.serializeToString(wbDoc));
  zip.file('xl/_rels/workbook.xml.rels', serializer.serializeToString(relsDoc));
  zip.file('[Content_Types].xml', serializer.serializeToString(ctDoc));
}

// Surgically patches only the cells that changed into the ORIGINAL file's
// XML (byte-identical otherwise) so styles, column widths, merges,
// conditional formatting, everything untouched stays untouched — then
// forces a full recalc on open so any downstream cell's stale cached value
// never matters. Returns a Blob — shared by the "Download" button and
// autosave-to-Firestore, which need the same bytes but different delivery
// (trigger a browser download vs. hand off to be persisted).
//
// styleOverrides: { [sheetName]: { [row]: { [col]: {bold?,italic?,
//   underline?,fg?,bg?,border?:{top,right,bottom,left}} } } } — user-applied
//   formatting deltas from the toolbar.
// newValidations: { [sheetName]: [{r0,r1,c0,c1,options}] } — dropdowns added
//   in this session (ones loaded from the file are already in the XML and
//   never need rewriting).
// structuralOps: { [sheetName]: Array<{axis:'row'|'col', index, delta}> } —
//   row/column insert/delete operations, in the order they happened.
// sheetOps: Array<{type:'rename',from,to} | {type:'delete',name} |
//   {type:'add',name}> — sheet-level add/delete/rename, in the order they
//   happened. sheetNames itself is the final tab order/existence (a plain
//   snapshot, not a history — see applySheetStructureToZip above).
// newConditionalRules: { [sheetName]: [{r0,r1,c0,c1,operator,formula1,
//   formula2?,bg?,fg?}] } — cellIs conditional-formatting rules added in
//   this session (rules loaded from the file are already in the XML and
//   never need rewriting).
// sortOps: { [sheetName]: Array<{r0, r1, permutation}> } — sort operations
//   (hf.setRowOrder already applied live; permutation maps each relative
//   row in [r0,r1] to its new relative position within the same range), in
//   the order they happened.
// hiddenRowsBySheet: { [sheetName]: number[] } — rows currently hidden by
//   an active column filter, recomputed fresh from live filter state each
//   save (not a history) — sets `hidden="1"`, nothing else; doesn't affect
//   the pristine-diff path at all since it never touches cell content.
export async function buildPatchedWorkbookBlob({
  originalArrayBuffer, hf, sheetNames, pristineGrids,
  styleOverrides = {}, newValidations = {}, sizeOverrides = {}, structuralOps = {}, sheetOps = [],
  newConditionalRules = {}, sortOps = {}, hiddenRowsBySheet = {},
}) {
  const structuralSheets = new Set(Object.keys(structuralOps).filter((s) => (structuralOps[s] || []).length > 0));
  const sortedSheets = new Set(Object.keys(sortOps).filter((s) => (sortOps[s] || []).length > 0));
  const needsFullRewrite = new Set([...structuralSheets, ...sortedSheets]);
  // Diffing a structurally-changed or sorted sheet against its pristine
  // snapshot is meaningless (indices have shifted/permuted) and would just
  // generate a pile of spurious edits that fullyRewriteSheetContent
  // supersedes anyway.
  const edits = computeEditsForDownload(hf, sheetNames.filter((s) => !needsFullRewrite.has(s)), pristineGrids);

  const zip = await JSZip.loadAsync(originalArrayBuffer);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  await applySheetStructureToZip(zip, parser, serializer, sheetOps, sheetNames);
  const nameToPath = await mapSheetNamesToPaths(zip, parser);

  const editsBySheet = new Map();
  for (const [key, rawContent] of edits.entries()) {
    const sepIdx = key.indexOf('::');
    const sheetName = key.slice(0, sepIdx);
    const addr = key.slice(sepIdx + 2);
    if (!editsBySheet.has(sheetName)) editsBySheet.set(sheetName, []);
    editsBySheet.get(sheetName).push({ addr, rawContent });
  }

  const hasAnyStyleOverrides = Object.values(styleOverrides).some(
    (rows) => Object.values(rows || {}).some((cols) => Object.keys(cols || {}).length > 0)
  );
  const hasAnyNewConditionalRules = Object.values(newConditionalRules).some((rules) => (rules || []).length > 0);

  let styleWriter = null;
  let stylesDoc = null;
  if (hasAnyStyleOverrides || hasAnyNewConditionalRules) {
    const stylesXmlText = await zip.file('xl/styles.xml').async('string');
    stylesDoc = parser.parseFromString(stylesXmlText, 'application/xml');
    const fontsEl = stylesDoc.getElementsByTagName('fonts')[0];
    const fillsEl = stylesDoc.getElementsByTagName('fills')[0];
    const bordersEl = stylesDoc.getElementsByTagName('borders')[0];
    const cellXfsEl = stylesDoc.getElementsByTagName('cellXfs')[0];
    styleWriter = makeStyleWriter(stylesDoc, fontsEl, fillsEl, bordersEl, cellXfsEl);
  }

  const sheetsNeedingWork = new Set([
    ...editsBySheet.keys(),
    ...Object.keys(styleOverrides).filter((s) => Object.values(styleOverrides[s] || {}).some((cols) => Object.keys(cols || {}).length > 0)),
    ...Object.keys(newValidations).filter((s) => (newValidations[s] || []).length > 0),
    ...Object.keys(sizeOverrides).filter((s) => Object.keys(sizeOverrides[s]?.colWidths || {}).length > 0 || Object.keys(sizeOverrides[s]?.rowHeights || {}).length > 0),
    ...Object.keys(newConditionalRules).filter((s) => (newConditionalRules[s] || []).length > 0),
    ...Object.keys(hiddenRowsBySheet).filter((s) => (hiddenRowsBySheet[s] || []).length > 0),
    ...needsFullRewrite,
  ]);

  for (const sheetName of sheetsNeedingWork) {
    const path = nameToPath[sheetName];
    if (!path) continue;
    const xmlText = await zip.file(path).async('string');
    const doc = parser.parseFromString(xmlText, 'application/xml');
    let sheetData = doc.getElementsByTagName('sheetData')[0];
    if (!sheetData) {
      sheetData = doc.createElementNS(NS_MAIN, 'sheetData');
      insertInOrder(doc.documentElement, sheetData, WORKSHEET_CHILD_ORDER);
    }
    const sheetId = hf.getSheetId(sheetName);

    if (structuralSheets.has(sheetName)) {
      for (const op of structuralOps[sheetName]) {
        if (op.axis === 'row') shiftSheetRowsInXml(sheetData, op.index, op.delta);
        else shiftSheetColumnsInXml(doc, sheetData, op.index, op.delta);
      }
    }
    if (sortedSheets.has(sheetName)) {
      const width = hf.getSheetDimensions(sheetId).width;
      for (const op of sortOps[sheetName]) {
        permuteSortedRows(doc, sheetData, hf, sheetId, width, op.r0, op.r1, op.permutation);
      }
    }
    if (needsFullRewrite.has(sheetName)) {
      fullyRewriteSheetContent(doc, sheetData, hf, sheetId, hf.getSheetDimensions(sheetId));
    }

    for (const { addr, rawContent } of editsBySheet.get(sheetName) || []) {
      const { rowNumber, col } = parseAddr(addr);
      const rowEl = findOrCreateRow(sheetData, doc, rowNumber);
      const cellEl = findOrCreateCell(rowEl, doc, addr, col);
      applyCellEdit(doc, cellEl, rawContent, hf.getCellValue({ sheet: sheetId, row: rowNumber - 1, col }));
    }

    const sheetOverrides = styleOverrides[sheetName];
    if (sheetOverrides && styleWriter) {
      const cellXfsEl = stylesDoc.getElementsByTagName('cellXfs')[0];
      for (const [rowStr, cols] of Object.entries(sheetOverrides)) {
        for (const [colStr, override] of Object.entries(cols)) {
          if (!override || Object.keys(override).length === 0) continue;
          const row = parseInt(rowStr, 10), col = parseInt(colStr, 10);
          const addr = columnLetter(col) + (row + 1);
          const rowEl = findOrCreateRow(sheetData, doc, row + 1);
          const cellEl = findOrCreateCell(rowEl, doc, addr, col);
          applyStyleOverrideToCell(cellEl, override, cellXfsEl, styleWriter);
        }
      }
    }

    appendValidationsToSheet(doc, doc.documentElement, newValidations[sheetName]);
    applyColumnRowSizes(doc, doc.documentElement, sheetData, sizeOverrides[sheetName]);
    if (stylesDoc) appendConditionalFormattingToSheet(doc, doc.documentElement, stylesDoc, newConditionalRules[sheetName]);
    applyHiddenRows(doc, sheetData, hiddenRowsBySheet[sheetName]);

    zip.file(path, serializer.serializeToString(doc));
  }

  if (stylesDoc) {
    zip.file('xl/styles.xml', serializer.serializeToString(stylesDoc));
  }

  // Force Excel to recompute everything fresh on open — so any formula cell
  // we didn't touch (but whose inputs changed) still shows correct values
  // even though its cached <v> in the XML is untouched/stale.
  const wbXmlText = await zip.file('xl/workbook.xml').async('string');
  const wbDoc = parser.parseFromString(wbXmlText, 'application/xml');
  let calcPr = wbDoc.getElementsByTagName('calcPr')[0];
  if (!calcPr) {
    calcPr = wbDoc.createElementNS(NS_MAIN, 'calcPr');
    wbDoc.documentElement.appendChild(calcPr);
  }
  calcPr.setAttribute('fullCalcOnLoad', '1');
  zip.file('xl/workbook.xml', serializer.serializeToString(wbDoc));

  // calcChain.xml caches formula-dependency order by cell address. Any edit
  // that moves a formula (row/column insert/delete shifts addresses, but
  // even plain edits can add/remove formulas) can leave it pointing at
  // addresses that no longer hold the formulas it claims — confirmed via
  // real Excel COM testing that this alone (nothing else wrong) makes Excel
  // refuse to open the file ("Unable to get the Open property of the
  // Workbooks class"), even though LibreOffice and openpyxl tolerate it
  // silently. It's an optional, fully-regeneratable cache, so just drop it;
  // Excel rebuilds it on save without complaint.
  if (zip.file('xl/calcChain.xml')) {
    zip.remove('xl/calcChain.xml');
    const ctPath = '[Content_Types].xml';
    let ctXml = await zip.file(ctPath).async('string');
    ctXml = ctXml.replace(/<Override PartName="\/xl\/calcChain\.xml"[^>]*\/>/, '');
    zip.file(ctPath, ctXml);
    const relsPath = 'xl/_rels/workbook.xml.rels';
    const relsFile = zip.file(relsPath);
    if (relsFile) {
      let relsXml = await relsFile.async('string');
      relsXml = relsXml.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/, '');
      zip.file(relsPath, relsXml);
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return { blob, editCount: edits.size };
}

// Triggers a browser download of the patched workbook (used by the
// "Download updated .xlsx" button).
export async function downloadPatchedWorkbook({ fileName, ...rest }) {
  const { blob, editCount } = await buildPatchedWorkbookBlob(rest);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return editCount;
}
