// Reads existing <conditionalFormatting> rules (styles.xml's <dxfs> for the
// differential-formatting half, each worksheet's own <conditionalFormatting>
// blocks for the rule half) and evaluates them against the live HyperFormula
// state so the grid renders the same highlighting real Excel would show.
//
// Deliberately scoped to the rule types that cover the vast majority of
// real-world usage: cellIs, expression, colorScale, dataBar, duplicateValues/
// uniqueValues, top10, containsText/notContainsText/beginsWith/endsWith,
// containsBlanks/notContainsBlanks/containsErrors/notContainsErrors.
// iconSet is NOT rendered (icons are a materially bigger UI surface for
// comparatively rare real-world usage) — a cell governed only by an iconSet
// rule just shows no extra decoration, same as an unstyled cell.
import { mapSheetNamesToPaths } from './xlsxPatcher';
import { parseTheme, resolveColorSpec, readColorSpec } from './xlsxStyles';
import { shiftFormulaReferences } from './xlsxFill';

function colLettersToIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref) {
  const m = ref.match(/^\$?([A-Z]+)\$?(\d+)$/);
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

// dxf fills use bgColor for the effective solid color (not fgColor like a
// normal cellXfs fill) — a real, documented OOXML quirk, confirmed against
// a real-Excel-authored dxf while building this.
function parseDxfs(stylesDoc, themeColors) {
  return Array.from(stylesDoc.getElementsByTagName('dxfs')[0]?.children || []).map((dxfEl) => {
    const fontEl = dxfEl.getElementsByTagName('font')[0];
    const fillEl = dxfEl.getElementsByTagName('fill')[0];
    const bgColorEl = fillEl?.getElementsByTagName('bgColor')[0];
    const fontColorEl = fontEl?.getElementsByTagName('color')[0];
    const bEl = fontEl?.getElementsByTagName('b')[0];
    const iEl = fontEl?.getElementsByTagName('i')[0];
    return {
      bold: !!bEl,
      italic: !!iEl,
      fg: resolveColorSpec(readColorSpec(fontColorEl), themeColors),
      bg: resolveColorSpec(readColorSpec(bgColorEl), themeColors),
    };
  });
}

function parseColorStop(cfvoEls, colorEls, themeColors) {
  return cfvoEls.map((cfvoEl, i) => ({
    type: cfvoEl.getAttribute('type'),
    val: cfvoEl.getAttribute('val'),
    color: resolveColorSpec(readColorSpec(colorEls[i]), themeColors) || '#ffffff',
  }));
}

function parseCfRule(cfRuleEl, dxfs, themeColors) {
  const type = cfRuleEl.getAttribute('type');
  const priority = parseInt(cfRuleEl.getAttribute('priority') || '0', 10);
  const stopIfTrue = cfRuleEl.getAttribute('stopIfTrue') === '1';
  const dxfId = cfRuleEl.getAttribute('dxfId');
  const dxf = dxfId !== null ? dxfs[parseInt(dxfId, 10)] : null;
  const formulas = Array.from(cfRuleEl.getElementsByTagName('formula')).map((f) => f.textContent);
  const base = { type, priority, stopIfTrue, dxf, formulas };

  if (type === 'cellIs') {
    return { ...base, operator: cfRuleEl.getAttribute('operator') };
  }
  if (type === 'top10') {
    return {
      ...base,
      rank: parseInt(cfRuleEl.getAttribute('rank') || '10', 10),
      percent: cfRuleEl.getAttribute('percent') === '1',
      bottom: cfRuleEl.getAttribute('bottom') === '1',
    };
  }
  if (['containsText', 'notContainsText', 'beginsWith', 'endsWith'].includes(type)) {
    return { ...base, text: cfRuleEl.getAttribute('text') || '' };
  }
  if (type === 'colorScale') {
    const csEl = cfRuleEl.getElementsByTagName('colorScale')[0];
    const cfvoEls = Array.from(csEl.getElementsByTagName('cfvo'));
    const colorEls = Array.from(csEl.getElementsByTagName('color'));
    return { ...base, stops: parseColorStop(cfvoEls, colorEls, themeColors) };
  }
  if (type === 'dataBar') {
    const dbEl = cfRuleEl.getElementsByTagName('dataBar')[0];
    const cfvoEls = Array.from(dbEl.getElementsByTagName('cfvo'));
    const colorEl = dbEl.getElementsByTagName('color')[0];
    return {
      ...base,
      stops: cfvoEls.map((el) => ({ type: el.getAttribute('type'), val: el.getAttribute('val') })),
      color: resolveColorSpec(readColorSpec(colorEl), themeColors) || '#638ec6',
    };
  }
  // duplicateValues, uniqueValues, containsBlanks, notContainsBlanks,
  // containsErrors, notContainsErrors, expression — no extra fields beyond base.
  return base;
}

function parseSheetConditionalFormatting(sheetXmlText, parser, dxfs, themeColors) {
  const doc = parser.parseFromString(sheetXmlText, 'application/xml');
  const rules = [];
  for (const cfEl of Array.from(doc.getElementsByTagName('conditionalFormatting'))) {
    const sqref = cfEl.getAttribute('sqref');
    if (!sqref) continue;
    const ranges = parseSqref(sqref);
    for (const cfRuleEl of Array.from(cfEl.getElementsByTagName('cfRule'))) {
      const rule = parseCfRule(cfRuleEl, dxfs, themeColors);
      if (rule.type === 'iconSet') continue; // not rendered — see module header
      rules.push({ ...rule, ranges, anchor: { row: ranges[0].r0, col: ranges[0].c0 } });
    }
  }
  return rules;
}

// Returns { [sheetName]: Array<rule> }
export async function loadConditionalFormatting(zip, sheetNames) {
  const parser = new DOMParser();
  const nameToPath = await mapSheetNamesToPaths(zip, parser);
  const stylesXmlText = await zip.file('xl/styles.xml')?.async('string');
  if (!stylesXmlText) return {};
  const stylesDoc = parser.parseFromString(stylesXmlText, 'application/xml');

  const themeFile = zip.file('xl/theme/theme1.xml');
  const themeColors = themeFile ? parseTheme(await themeFile.async('string'), parser) : null;
  const dxfs = parseDxfs(stylesDoc, themeColors);

  const result = {};
  for (const sheetName of sheetNames) {
    const path = nameToPath[sheetName];
    if (!path) continue;
    const xmlText = await zip.file(path)?.async('string');
    if (!xmlText || !xmlText.includes('conditionalFormatting')) continue;
    const rules = parseSheetConditionalFormatting(xmlText, parser, dxfs, themeColors);
    if (rules.length > 0) result[sheetName] = rules;
  }
  return result;
}

function cellInRanges(row, col, ranges) {
  return ranges.some((r) => row >= r.r0 && row <= r.r1 && col >= r.c0 && col <= r.c1);
}

function numericCellValue(hf, sheetId, row, col) {
  const v = hf.getCellValue({ sheet: sheetId, row, col });
  return typeof v === 'number' ? v : null;
}

function displayText(hf, sheetId, row, col) {
  const v = hf.getCellValue({ sheet: sheetId, row, col });
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'type' in v) return v.value;
  return String(v);
}

function isBlankCell(hf, sheetId, row, col) {
  const v = hf.getCellValue({ sheet: sheetId, row, col });
  return v === null || v === undefined || v === '';
}

function isErrorCell(hf, sheetId, row, col) {
  const v = hf.getCellValue({ sheet: sheetId, row, col });
  return v !== null && typeof v === 'object' && 'type' in v;
}

function evalCellIs(rule, hf, sheetId, row, col) {
  const cellVal = numericCellValue(hf, sheetId, row, col);
  if (cellVal === null) return false;
  const f1 = Number(rule.formulas[0]);
  const f2 = rule.formulas[1] !== undefined ? Number(rule.formulas[1]) : undefined;
  switch (rule.operator) {
    case 'greaterThan': return cellVal > f1;
    case 'greaterThanOrEqual': return cellVal >= f1;
    case 'lessThan': return cellVal < f1;
    case 'lessThanOrEqual': return cellVal <= f1;
    case 'equal': return cellVal === f1;
    case 'notEqual': return cellVal !== f1;
    case 'between': return cellVal >= Math.min(f1, f2) && cellVal <= Math.max(f1, f2);
    case 'notBetween': return cellVal < Math.min(f1, f2) || cellVal > Math.max(f1, f2);
    default: return false;
  }
}

// Precomputes whatever a rule type needs across its own range once (rank
// thresholds, duplicate-count maps, min/max for scales/bars) rather than
// recomputing per-cell — most of these are meaningless to evaluate one cell
// at a time anyway (e.g. "is this a duplicate" needs the whole range).
function precomputeRuleContext(rule, hf, sheetId) {
  if (rule.type === 'duplicateValues' || rule.type === 'uniqueValues') {
    const counts = new Map();
    for (const range of rule.ranges) {
      for (let r = range.r0; r <= range.r1; r++) {
        for (let c = range.c0; c <= range.c1; c++) {
          const t = displayText(hf, sheetId, r, c);
          if (t === '') continue;
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      }
    }
    return { counts };
  }
  if (rule.type === 'top10') {
    const values = [];
    for (const range of rule.ranges) {
      for (let r = range.r0; r <= range.r1; r++) {
        for (let c = range.c0; c <= range.c1; c++) {
          const v = numericCellValue(hf, sheetId, r, c);
          if (v !== null) values.push(v);
        }
      }
    }
    values.sort((a, b) => a - b);
    if (values.length === 0) return { threshold: null };
    const n = rule.percent ? Math.max(1, Math.round((rule.rank / 100) * values.length)) : Math.min(rule.rank, values.length);
    const threshold = rule.bottom ? values[n - 1] : values[values.length - n];
    return { threshold };
  }
  if (rule.type === 'colorScale' || rule.type === 'dataBar') {
    const values = [];
    for (const range of rule.ranges) {
      for (let r = range.r0; r <= range.r1; r++) {
        for (let c = range.c0; c <= range.c1; c++) {
          const v = numericCellValue(hf, sheetId, r, c);
          if (v !== null) values.push(v);
        }
      }
    }
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    return { min, max };
  }
  return {};
}

function resolveStopValue(stop, ctx) {
  if (stop.type === 'min') return ctx.min;
  if (stop.type === 'max') return ctx.max;
  if (stop.type === 'num') return Number(stop.val);
  if (stop.type === 'percent') return ctx.min + (Number(stop.val) / 100) * (ctx.max - ctx.min);
  return ctx.min;
}

function lerpColor(hexA, hexB, t) {
  const a = [1, 3, 5].map((i) => parseInt(hexA.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(hexB.slice(i, i + 2), 16));
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function evalColorScale(rule, ctx, value) {
  if (value === null || ctx.max === ctx.min) return rule.stops[0]?.color || null;
  const points = rule.stops.map((s) => ({ v: resolveStopValue(s, ctx), color: s.color })).sort((a, b) => a.v - b.v);
  if (value <= points[0].v) return points[0].color;
  if (value >= points[points.length - 1].v) return points[points.length - 1].color;
  for (let i = 0; i < points.length - 1; i++) {
    if (value >= points[i].v && value <= points[i + 1].v) {
      const span = points[i + 1].v - points[i].v;
      const t = span === 0 ? 0 : (value - points[i].v) / span;
      return lerpColor(points[i].color, points[i + 1].color, t);
    }
  }
  return points[0].color;
}

// Evaluates every rule for every cell in the sheet once, returning a sparse
// { [row]: { [col]: { bg?, fg?, bold?, italic?, dataBar?: {pct, color} } } }
// map — same shape/consumption pattern as cellFormatting/styleOverrides, so
// the grid can merge it in with mergeCellFormat without new plumbing.
export function computeConditionalStyles(rules, hf, sheetId, dims) {
  if (!rules || rules.length === 0) return {};
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const contexts = sorted.map((rule) => precomputeRuleContext(rule, hf, sheetId));
  const result = {};

  for (let r = 0; r < dims.height; r++) {
    for (let c = 0; c < dims.width; c++) {
      let cellStyle = null;
      for (let i = 0; i < sorted.length; i++) {
        const rule = sorted[i];
        if (!cellInRanges(r, c, rule.ranges)) continue;
        const ctx = contexts[i];
        let matched = false;
        let style = null;

        if (rule.type === 'cellIs') {
          matched = evalCellIs(rule, hf, sheetId, r, c);
          style = rule.dxf;
        } else if (rule.type === 'expression') {
          const shifted = shiftFormulaReferences(rule.formulas[0] || '', r - rule.anchor.row, c - rule.anchor.col);
          try {
            const v = hf.calculateFormula('=' + shifted, sheetId);
            matched = v === true;
          } catch { matched = false; }
          style = rule.dxf;
        } else if (rule.type === 'duplicateValues' || rule.type === 'uniqueValues') {
          const t = displayText(hf, sheetId, r, c);
          const count = ctx.counts.get(t) || 0;
          matched = t !== '' && (rule.type === 'duplicateValues' ? count > 1 : count === 1);
          style = rule.dxf;
        } else if (rule.type === 'top10') {
          const v = numericCellValue(hf, sheetId, r, c);
          matched = v !== null && ctx.threshold !== null && (rule.bottom ? v <= ctx.threshold : v >= ctx.threshold);
          style = rule.dxf;
        } else if (['containsText', 'beginsWith', 'endsWith'].includes(rule.type)) {
          const t = displayText(hf, sheetId, r, c);
          matched = rule.type === 'containsText' ? t.includes(rule.text)
            : rule.type === 'beginsWith' ? t.startsWith(rule.text) : t.endsWith(rule.text);
          style = rule.dxf;
        } else if (rule.type === 'notContainsText') {
          matched = !displayText(hf, sheetId, r, c).includes(rule.text);
          style = rule.dxf;
        } else if (rule.type === 'containsBlanks') {
          matched = isBlankCell(hf, sheetId, r, c); style = rule.dxf;
        } else if (rule.type === 'notContainsBlanks') {
          matched = !isBlankCell(hf, sheetId, r, c); style = rule.dxf;
        } else if (rule.type === 'containsErrors') {
          matched = isErrorCell(hf, sheetId, r, c); style = rule.dxf;
        } else if (rule.type === 'notContainsErrors') {
          matched = !isErrorCell(hf, sheetId, r, c); style = rule.dxf;
        } else if (rule.type === 'colorScale') {
          const v = numericCellValue(hf, sheetId, r, c);
          const color = evalColorScale(rule, ctx, v);
          matched = !!color;
          style = color ? { bg: color } : null;
        } else if (rule.type === 'dataBar') {
          const v = numericCellValue(hf, sheetId, r, c);
          if (v !== null && ctx.max > ctx.min) {
            const pct = Math.max(0, Math.min(100, ((v - ctx.min) / (ctx.max - ctx.min)) * 100));
            matched = true;
            style = { dataBar: { pct, color: rule.color } };
          }
        }

        if (matched && style) {
          cellStyle = { ...style, ...cellStyle }; // earlier (higher-priority) properties win on conflict
          if (rule.stopIfTrue) break;
        }
      }
      if (cellStyle) {
        if (!result[r]) result[r] = {};
        result[r][c] = cellStyle;
      }
    }
  }
  return result;
}
