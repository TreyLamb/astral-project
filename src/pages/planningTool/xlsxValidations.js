import { mapSheetNamesToPaths } from './xlsxPatcher';

function colLettersToIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  return { col: colLettersToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
}

// sqref is space-separated ranges like "C77" or "A1:A10 C3:C5"
function parseSqref(sqref) {
  return sqref.trim().split(/\s+/).map((part) => {
    const [a, b] = part.split(':');
    const start = parseCellRef(a);
    const end = b ? parseCellRef(b) : start;
    return {
      r0: Math.min(start.row, end.row), r1: Math.max(start.row, end.row),
      c0: Math.min(start.col, end.col), c1: Math.max(start.col, end.col),
    };
  });
}

// Only "list" validations are surfaced (the only kind this app's tool can
// create, and the only kind meaningfully renderable as a <select>). A
// literal list looks like formula1 = `"A,B,C"`; a range reference looks
// like `Sheet1!$A$1:$A$10` and is resolved live via HyperFormula so it
// stays current if the source range changes.
export function parseSheetValidations(sheetXmlText, parser, hf, sheetId) {
  const doc = parser.parseFromString(sheetXmlText, 'application/xml');
  const results = [];
  for (const dvEl of Array.from(doc.getElementsByTagName('dataValidation'))) {
    if (dvEl.getAttribute('type') !== 'list') continue;
    const sqref = dvEl.getAttribute('sqref');
    const formula1El = dvEl.getElementsByTagName('formula1')[0];
    const formula1 = formula1El?.textContent;
    if (!sqref || !formula1) continue;

    let options = [];
    if (formula1.startsWith('"') && formula1.endsWith('"')) {
      options = formula1.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      // range reference — resolve current values via the live engine
      try {
        options = resolveRangeValues(hf, sheetId, formula1.replace(/\$/g, ''));
      } catch {
        options = [];
      }
    }
    if (options.length === 0) continue;

    for (const range of parseSqref(sqref)) {
      results.push({ ...range, options, fromFile: true });
    }
  }
  return results;
}

function resolveRangeValues(hf, defaultSheetId, rangeAddr) {
  let sheetId = defaultSheetId;
  let cellsPart = rangeAddr;
  if (rangeAddr.includes('!')) {
    const [sheetPart, rest] = rangeAddr.split('!');
    const referencedId = hf.getSheetId(sheetPart.replace(/^'|'$/g, ''));
    if (referencedId !== undefined) sheetId = referencedId;
    cellsPart = rest;
  }
  const [a, b] = cellsPart.split(':');
  if (!a) return [];
  const start = parseCellRef(a);
  const end = b ? parseCellRef(b) : start;
  const out = [];
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      const v = hf.getCellValue({ sheet: sheetId, row: r, col: c });
      if (v !== null && v !== undefined && typeof v !== 'object') out.push(String(v));
    }
  }
  return out;
}

// Returns { [sheetName]: Array<{r0,r1,c0,c1,options,fromFile:true}> }
export async function loadDataValidations(zip, sheetNames, hf) {
  const parser = new DOMParser();
  const nameToPath = await mapSheetNamesToPaths(zip, parser);
  const result = {};
  for (const sheetName of sheetNames) {
    const path = nameToPath[sheetName];
    if (!path) continue;
    const xmlText = await zip.file(path)?.async('string');
    if (!xmlText || !xmlText.includes('dataValidation')) continue;
    const sheetId = hf.getSheetId(sheetName);
    result[sheetName] = parseSheetValidations(xmlText, parser, hf, sheetId);
  }
  return result;
}

export function findValidationForCell(validations, row, col) {
  if (!validations) return null;
  for (const v of validations) {
    if (row >= v.r0 && row <= v.r1 && col >= v.c0 && col <= v.c1) return v;
  }
  return null;
}
