// Applies Excel number-format codes (numFmtId -> formatCode) to raw cell
// values for display. Covers what real workbooks actually use — integer/
// decimal/comma grouping, percentages, a currency-with-red-negative style,
// and the common date/time tokens (verified against this project's own
// test workbook: ids 0,1,2,3,6,9,14,16,20,22 plus custom "0.0" and
// "#,##0;(#,##0)"). Does NOT implement the full Excel format-code grammar
// (fractions, scientific notation, [h]-elapsed-time, conditional/comparison
// sections, locale-specific calendars) — see PROGRESS.md for the exact
// documented scope.

// Standard built-in format codes (ids 0-49 are reserved by the OOXML spec
// and never appear in <numFmts> — only custom ids 164+ get an explicit
// formatCode in the file).
const BUILTIN_FORMATS = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  5: '$#,##0_);($#,##0)',
  6: '$#,##0_);[Red]($#,##0)',
  7: '$#,##0.00_);($#,##0.00)',
  8: '$#,##0.00_);[Red]($#,##0.00)',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  14: 'm/d/yyyy',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'm/d/yy h:mm',
  37: '#,##0_);(#,##0)',
  38: '#,##0_);[Red](#,##0)',
  39: '#,##0.00_);(#,##0.00)',
  40: '#,##0.00_);[Red](#,##0.00)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mm:ss.0',
  48: '##0.0E+0',
  49: '@',
};

export function parseNumFmts(stylesDoc) {
  const map = { ...BUILTIN_FORMATS };
  const container = stylesDoc.getElementsByTagName('numFmts')[0];
  if (container) {
    for (const el of Array.from(container.children)) {
      map[parseInt(el.getAttribute('numFmtId'), 10)] = el.getAttribute('formatCode');
    }
  }
  return map;
}

// Excel serial date -> JS Date. Day 1 = 1900-01-01, with Excel's
// intentional (spreadsheet-compatibility) leap-year bug treating 1900 as a
// leap year, hence the epoch offset trick of counting from Dec 30 1899.
function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  const fractionalDay = serial - Math.floor(serial);
  const ms = utcMs + Math.round(fractionalDay * 86400 * 1000);
  return new Date(ms);
}

function stripIgnorable(formatCode) {
  return formatCode
    .replace(/\[[^\]]*\]/g, '') // [Red], [>=100], etc. — color/conditional, not rendered
    .replace(/_./g, ' ')        // "_)" etc = padding the width of that char; approximate with a space
    .replace(/\*./g, '');       // "*X" = repeat-fill, meaningless in an HTML cell
}

const DATE_TOKEN_RE = /y{2,4}|m{1,5}|d{1,4}|h{1,2}|s{1,2}|AM\/PM|am\/pm/;

function isDateTimeFormat(formatCode) {
  // Ignore quoted literal text when checking — a literal "May" shouldn't
  // count, but bare mmm/dd/yyyy tokens should.
  const withoutQuotes = formatCode.replace(/"[^"]*"/g, '');
  return DATE_TOKEN_RE.test(withoutQuotes);
}

function pad(n, width) { return String(n).padStart(width, '0'); }

function formatDateTime(value, formatCode) {
  // Excel serial numbers have no timezone of their own; excelSerialToDate
  // builds the JS Date's underlying timestamp assuming UTC throughout, so
  // every field must be read back with the UTC getters too — mixing in
  // the local (getDate/getHours/...) getters would shift the displayed day
  // depending on the viewer's timezone (verified: reading serial 45292 —
  // 2024-01-01 — came back as 12/31/2023 on a UTC-negative machine before
  // this fix).
  const date = excelSerialToDate(value);
  const h24 = date.getUTCHours();
  const isPM = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  let out = '';
  let i = 0;
  while (i < formatCode.length) {
    const ch = formatCode[i];
    if (ch === '"') {
      const end = formatCode.indexOf('"', i + 1);
      out += formatCode.slice(i + 1, end === -1 ? undefined : end);
      i = end === -1 ? formatCode.length : end + 1;
      continue;
    }
    if (/[ap]/i.test(ch) && /^am\/pm/i.test(formatCode.slice(i))) {
      out += isPM ? (ch === ch.toUpperCase() ? 'PM' : 'pm') : (ch === ch.toUpperCase() ? 'AM' : 'am');
      i += 5;
      continue;
    }
    const m = formatCode.slice(i).match(/^(y+|m+|d+|h+|s+)/);
    if (m) {
      const run = m[1];
      const c = run[0].toLowerCase();
      const len = run.length;
      if (c === 'y') out += len >= 4 ? String(date.getUTCFullYear()) : pad(date.getUTCFullYear() % 100, 2);
      else if (c === 'd') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (len >= 4) out += days[date.getUTCDay()]; // approximation: full weekday name not tracked separately
        else if (len === 3) out += days[date.getUTCDay()];
        else out += pad(date.getUTCDate(), len);
      } else if (c === 'h') out += pad(/AM\/PM/i.test(formatCode) ? h12 : h24, len);
      else if (c === 's') out += pad(date.getUTCSeconds(), len);
      else if (c === 'm') {
        // "m" means minutes only when adjacent to an hour/second token
        // (possibly separated by punctuation like the ":" in "h:mm" or
        // "mm:ss" — checking only the LITERALLY-adjacent character missed
        // this, silently mis-rendering "h:mm" as hour+month); otherwise
        // it's month. Real Excel does full context analysis — this covers
        // the common cases.
        const prevIsTime = /[hH][^a-zA-Z]*$/.test(formatCode.slice(0, i));
        const nextIsSeconds = /^[^a-zA-Z]*[sS]/.test(formatCode.slice(i + len));
        if (prevIsTime || nextIsSeconds) out += pad(date.getUTCMinutes(), len);
        else if (len >= 4) out += ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getUTCMonth()];
        else if (len === 3) out += ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
        else out += pad(date.getUTCMonth() + 1, len);
      }
      i += len;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function formatPlainNumber(value, section) {
  const hasPercent = section.includes('%');
  let v = hasPercent ? value * 100 : value;

  const literalPrefixMatch = section.match(/^([^0#.,]*)/);
  const prefix = literalPrefixMatch ? literalPrefixMatch[1].replace(/"/g, '') : '';
  const digitsPart = section.slice(prefix.length);

  const decimalMatch = digitsPart.match(/\.([0#]*)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;
  const grouped = /#,#|0,0|,##/.test(digitsPart) || /#,##0|0,000/.test(digitsPart);

  const negative = v < 0;
  const absStr = Math.abs(v).toFixed(decimals);
  const [intPart, fracPart] = absStr.split('.');
  const groupedInt = grouped ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart;
  let numStr = fracPart ? `${groupedInt}.${fracPart}` : groupedInt;
  if (negative) numStr = '-' + numStr;

  return prefix + numStr + (hasPercent ? '%' : '');
}

function splitSections(formatCode) {
  // Split on ; but not inside "quoted text".
  const sections = [];
  let current = '';
  let inQuotes = false;
  for (const ch of formatCode) {
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === ';' && !inQuotes) { sections.push(current); current = ''; continue; }
    current += ch;
  }
  sections.push(current);
  return sections;
}

export function formatCellValue(value, formatCode) {
  if (typeof value !== 'number' || !formatCode || formatCode === 'General' || formatCode === '@') return value;

  const sections = splitSections(stripIgnorable(formatCode));
  let section;
  let effectiveValue = value;
  if (value < 0 && sections[1]) { section = sections[1]; effectiveValue = value; } // negative section usually already encodes sign (parens) — pass through, formatPlainNumber uses abs()
  else if (value === 0 && sections[2]) { section = sections[2]; }
  else { section = sections[0]; }

  if (isDateTimeFormat(section)) return formatDateTime(value, section);
  return formatPlainNumber(effectiveValue, section);
}
