import * as XLSX from 'xlsx';
import { HyperFormula } from 'hyperformula';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// HyperFormula's formula grammar differs from Excel's in two ways that this
// kind of organically-grown workbook hits constantly:
//  1. Sheet names containing non-word characters (e.g. "Meals.bmr") must be
//     single-quoted, even in formulas where Excel itself doesn't require it.
//  2. TRUE/FALSE must be written as function calls TRUE()/FALSE() — bare
//     literals (which Excel allows) are parsed as unresolved named expressions.
export function fixFormulaForHyperFormula(formula, sheetNames) {
  let out = formula;
  for (const name of sheetNames) {
    if (/^\w+$/.test(name)) continue; // plain names never need quoting
    const pattern = new RegExp(escapeRegExp(name) + '!', 'g');
    out = out.replace(pattern, (match, offset) => (out[offset - 1] === "'" ? match : `'${name}'!`));
  }
  out = out.replace(/"[^"]*"|\b(TRUE|FALSE)\b(?!\()/g, (m, bool) => (bool ? `${bool}()` : m));
  return out;
}

function sheetToGrid(ws, sheetNames) {
  const ref = ws['!ref'];
  if (!ref) return [[null]];
  const range = XLSX.utils.decode_range(ref);
  const grid = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) { row.push(null); continue; }
      row.push(cell.f ? '=' + fixFormulaForHyperFormula(cell.f, sheetNames) : (cell.v ?? null));
    }
    grid.push(row);
  }
  return grid;
}

// Reads whatever HyperFormula currently holds for one cell, in the same
// shape used for later diffing: a formula string (its own canonical
// serialization), a plain value, or null.
function readCanonicalCellContent(hf, sheetId, row, col) {
  const addr = { sheet: sheetId, row, col };
  if (hf.doesCellHaveFormula(addr)) return hf.getCellFormula(addr);
  const v = hf.getCellValue(addr);
  return v !== null && typeof v === 'object' ? null : v ?? null;
}

// HyperFormula's formula serialization is deterministic but not always a
// byte-identical round-trip of the original text — e.g. it renders small
// literals like -0.0000001 back out as -1e-7. Comparing a live cell against
// the RAW pre-parse text would then false-positive as "edited" on a cell
// nobody touched. So instead of diffing against rawGrids, snapshot every
// cell's canonical HyperFormula form once right after load (before any
// edits) and diff later state against THIS — both sides go through the same
// serialization, so untouched cells compare exactly equal.
function snapshotPristineGrids(hf, sheetNames) {
  const pristineGrids = {};
  for (const sheetName of sheetNames) {
    const sheetId = hf.getSheetId(sheetName);
    const dims = hf.getSheetDimensions(sheetId);
    const grid = [];
    for (let r = 0; r < dims.height; r++) {
      const row = [];
      for (let c = 0; c < dims.width; c++) row.push(readCanonicalCellContent(hf, sheetId, r, c));
      grid.push(row);
    }
    pristineGrids[sheetName] = grid;
  }
  return pristineGrids;
}

// Parses raw bytes into { hf (live HyperFormula engine), sheetNames,
// namedRangeErrors, mergesBySheet, pristineGrids }.
// pristineGrids is a snapshot of hf's own canonical read of every cell,
// taken immediately after load — the baseline a later "what actually
// changed" diff (see xlsxPatcher.js) compares the live engine state against.
export function loadWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true });
  const rawGrids = {};
  const mergesBySheet = {};
  for (const name of workbook.SheetNames) {
    rawGrids[name] = sheetToGrid(workbook.Sheets[name], workbook.SheetNames);
    mergesBySheet[name] = workbook.Sheets[name]['!merges'] || [];
  }

  const hf = HyperFormula.buildFromSheets(rawGrids, { licenseKey: 'gpl-v3' });

  const namedRangeErrors = [];
  for (const n of workbook.Workbook?.Names || []) {
    try {
      hf.addNamedExpression(n.Name, '=' + fixFormulaForHyperFormula(n.Ref, workbook.SheetNames));
    } catch (e) {
      namedRangeErrors.push({ name: n.Name, ref: n.Ref, error: e.message });
    }
  }

  const pristineGrids = snapshotPristineGrids(hf, workbook.SheetNames);

  return { hf, sheetNames: workbook.SheetNames, namedRangeErrors, mergesBySheet, pristineGrids };
}

export function columnLetter(index) {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function displayValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'type' in v) return v.value; // DetailedCellError -> "#REF!" etc
  if (typeof v === 'number') {
    // avoid float noise like 2271.9948223000003
    return Math.round(v * 1e6) / 1e6;
  }
  return v;
}

// A genuinely empty sheet (freshly added via the "+" tab) reports {width:0,
// height:0} from HyperFormula — with nothing padded in, the grid renders
// zero rows/cols, leaving no cell to even click into to start typing.
// Flooring to a minimum only ever affects sheets smaller than this (every
// real sheet in a normal workbook already exceeds it, so Ctrl+End/
// select-column-or-row behavior for actual content is unchanged) — matches
// Excel/Sheets always showing a substantial blank grid regardless of the
// "used range".
const MIN_DISPLAY_ROWS = 20;
const MIN_DISPLAY_COLS = 10;

// Live snapshot of one sheet's currently computed values, for rendering.
export function getSheetDisplayGrid(hf, sheetName) {
  const sheetId = hf.getSheetId(sheetName);
  const rawDims = hf.getSheetDimensions(sheetId);
  const dims = { height: Math.max(rawDims.height, MIN_DISPLAY_ROWS), width: Math.max(rawDims.width, MIN_DISPLAY_COLS) };
  const grid = [];
  for (let r = 0; r < dims.height; r++) {
    const row = [];
    for (let c = 0; c < dims.width; c++) {
      const addr = { sheet: sheetId, row: r, col: c };
      const raw = hf.getCellValue(addr);
      row.push({
        display: displayValue(raw),
        isFormula: hf.doesCellHaveFormula(addr),
        isError: !!(raw && typeof raw === 'object' && 'type' in raw),
        isNumber: typeof raw === 'number',
      });
    }
    grid.push(row);
  }
  return { sheetId, dims, grid };
}

// What to show in the edit box when a cell is opened: the formula text if
// it has one, otherwise the raw underlying value.
export function getCellEditValue(hf, sheetId, row, col) {
  const addr = { sheet: sheetId, row, col };
  if (hf.doesCellHaveFormula(addr)) return hf.getCellFormula(addr) ?? '';
  const v = hf.getCellValue(addr);
  if (v && typeof v === 'object') return '';
  return v ?? '';
}

// Parses whatever the user typed/pasted into HyperFormula CRUD input:
// null (clear), a formula string, a number, or plain text. sheetNames is
// needed to apply the same Excel->HyperFormula formula fixups used at load
// time, so freshly-typed formulas referencing dotted sheet names or bare
// TRUE/FALSE work the same as ones that came from the file.
export function setCellRawInput(hf, sheetId, row, col, rawInput, sheetNames) {
  const trimmed = rawInput.trim();
  let contents;
  if (trimmed === '') {
    contents = null;
  } else if (trimmed.startsWith('=')) {
    contents = '=' + fixFormulaForHyperFormula(trimmed.slice(1), sheetNames);
  } else if (trimmed !== '' && !isNaN(Number(trimmed))) {
    contents = Number(trimmed);
  } else {
    contents = trimmed;
  }
  return hf.setCellContents({ sheet: sheetId, row, col }, [[contents]]);
}
