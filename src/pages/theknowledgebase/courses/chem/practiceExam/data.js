// Shared chemistry data for the study-guide practice exam (practiceExam/). Every answer in the
// style generators is COMPUTED from these tables, never typed, so a sibling question can never
// carry a hand-arithmetic error. Masses are the 4-significant-figure values on the OpenStax /
// AcademiQ periodic table his course uses.

// [Z, symbol, name, molar mass]
const RAW = [
  [1, 'H', 'hydrogen', 1.008], [2, 'He', 'helium', 4.003], [3, 'Li', 'lithium', 6.94], [4, 'Be', 'beryllium', 9.012],
  [5, 'B', 'boron', 10.81], [6, 'C', 'carbon', 12.01], [7, 'N', 'nitrogen', 14.01], [8, 'O', 'oxygen', 16.00],
  [9, 'F', 'fluorine', 19.00], [10, 'Ne', 'neon', 20.18], [11, 'Na', 'sodium', 22.99], [12, 'Mg', 'magnesium', 24.31],
  [13, 'Al', 'aluminum', 26.98], [14, 'Si', 'silicon', 28.09], [15, 'P', 'phosphorus', 30.97], [16, 'S', 'sulfur', 32.06],
  [17, 'Cl', 'chlorine', 35.45], [18, 'Ar', 'argon', 39.95], [19, 'K', 'potassium', 39.10], [20, 'Ca', 'calcium', 40.08],
  [21, 'Sc', 'scandium', 44.96], [22, 'Ti', 'titanium', 47.87], [23, 'V', 'vanadium', 50.94], [24, 'Cr', 'chromium', 52.00],
  [25, 'Mn', 'manganese', 54.94], [26, 'Fe', 'iron', 55.85], [27, 'Co', 'cobalt', 58.93], [28, 'Ni', 'nickel', 58.69],
  [29, 'Cu', 'copper', 63.55], [30, 'Zn', 'zinc', 65.38], [31, 'Ga', 'gallium', 69.72], [32, 'Ge', 'germanium', 72.63],
  [33, 'As', 'arsenic', 74.92], [34, 'Se', 'selenium', 78.97], [35, 'Br', 'bromine', 79.90], [36, 'Kr', 'krypton', 83.80],
  [37, 'Rb', 'rubidium', 85.47], [38, 'Sr', 'strontium', 87.62], [39, 'Y', 'yttrium', 88.91], [40, 'Zr', 'zirconium', 91.22],
  [41, 'Nb', 'niobium', 92.91], [42, 'Mo', 'molybdenum', 95.95], [43, 'Tc', 'technetium', 97.91], [44, 'Ru', 'ruthenium', 101.1],
  [45, 'Rh', 'rhodium', 102.9], [46, 'Pd', 'palladium', 106.4], [47, 'Ag', 'silver', 107.9], [48, 'Cd', 'cadmium', 112.4],
  [49, 'In', 'indium', 114.8], [50, 'Sn', 'tin', 118.7], [51, 'Sb', 'antimony', 121.8], [52, 'Te', 'tellurium', 127.6],
  [53, 'I', 'iodine', 126.9], [54, 'Xe', 'xenon', 131.3], [55, 'Cs', 'cesium', 132.9], [56, 'Ba', 'barium', 137.3],
  [58, 'Ce', 'cerium', 140.1], [60, 'Nd', 'neodymium', 144.2], [62, 'Sm', 'samarium', 150.4], [63, 'Eu', 'europium', 152.0],
  [64, 'Gd', 'gadolinium', 157.3], [72, 'Hf', 'hafnium', 178.5], [73, 'Ta', 'tantalum', 180.9], [74, 'W', 'tungsten', 183.8],
  [75, 'Re', 'rhenium', 186.2], [76, 'Os', 'osmium', 190.2], [77, 'Ir', 'iridium', 192.2], [78, 'Pt', 'platinum', 195.1],
  [79, 'Au', 'gold', 197.0], [80, 'Hg', 'mercury', 200.6], [81, 'Tl', 'thallium', 204.4], [82, 'Pb', 'lead', 207.2],
  [83, 'Bi', 'bismuth', 209.0], [86, 'Rn', 'radon', 222], [88, 'Ra', 'radium', 226], [90, 'Th', 'thorium', 232.0],
  [92, 'U', 'uranium', 238.0],
];

const NONMETALS = new Set(['H', 'He', 'C', 'N', 'O', 'F', 'Ne', 'P', 'S', 'Cl', 'Ar', 'Se', 'Br', 'Kr', 'I', 'Xe', 'Rn']);
const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);

function groupOf(z) {
  if (z === 1) return 1;
  if (z === 2) return 18;
  const starts = [[3, 10], [11, 18], [19, 36], [37, 54], [55, 86], [87, 118]];
  for (const [a, b] of starts) {
    if (z < a || z > b) continue;
    const off = z - a;
    if (b - a === 7) return off < 2 ? off + 1 : off + 11;
    if (b - a === 17) return off + 1;
    if (off < 2) return off + 1;
    if (z >= a + 2 && z <= a + 16) return null; // lanthanide / actinide row
    return z - (a + 17) + 4;
  }
  return null;
}

export const ELEMENTS = RAW.map(([z, sym, name, mass]) => {
  const group = groupOf(z);
  const kind = group == null ? 'inner transition metal' : group >= 3 && group <= 12 ? 'transition metal' : 'main-group element';
  const metal = NONMETALS.has(sym) ? 'nonmetal' : METALLOIDS.has(sym) ? 'metalloid' : 'metal';
  return { z, sym, name, mass, group, kind, metal };
});
export const BY_SYM = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));
export const BY_Z = Object.fromEntries(ELEMENTS.map((e) => [e.z, e]));
export const el = (sym) => {
  const e = BY_SYM[sym];
  if (!e) throw new Error(`practiceExam/data: unknown element ${sym}`);
  return e;
};

// ---------- formulas ----------

/** Parse "Ca3(PO4)2", "CuSO4·5H2O", "NH4C2H3O2" into { element: count }. */
export function parseFormula(f) {
  const parts = String(f).replace(/\s/g, '').split(/[·*.]/);
  const total = {};
  for (const part of parts) {
    const m = part.match(/^(\d*)(.*)$/);
    const mult = m[1] ? Number(m[1]) : 1;
    const counts = parseGroup(m[2]);
    for (const [k, v] of Object.entries(counts)) total[k] = (total[k] ?? 0) + v * mult;
  }
  return total;
}
function parseGroup(s) {
  const stack = [{}];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(') { stack.push({}); i++; continue; }
    if (ch === ')') {
      i++;
      let n = '';
      while (i < s.length && /\d/.test(s[i])) n += s[i++];
      const inner = stack.pop();
      const top = stack[stack.length - 1];
      for (const [k, v] of Object.entries(inner)) top[k] = (top[k] ?? 0) + v * (n ? Number(n) : 1);
      continue;
    }
    const m = s.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
    if (!m) throw new Error(`practiceExam/data: cannot parse formula "${s}" at ${i}`);
    el(m[1]);
    const top = stack[stack.length - 1];
    top[m[1]] = (top[m[1]] ?? 0) + (m[2] ? Number(m[2]) : 1);
    i += m[0].length;
  }
  if (stack.length !== 1) throw new Error(`practiceExam/data: unbalanced parentheses in "${s}"`);
  return stack[0];
}

export const molarMass = (f) => Object.entries(parseFormula(f)).reduce((s, [k, n]) => s + el(k).mass * n, 0);

const SUBS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const SUPS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };
/** "Ca3(PO4)2" -> "Ca₃(PO₄)₂"; a leading coefficient ("5H2O" after a dot) stays full size. */
export const sub = (f) => String(f).replace(/([A-Za-z)])(\d+)/g, (_, a, d) => a + d.split('').map((c) => SUBS[c]).join(''));
export const sup = (s) => String(s).split('').map((c) => SUPS[c] ?? c).join('');
/** Charge as a superscript: 2 -> "²⁺", -1 -> "⁻", 1 -> "⁺". */
export const chargeSup = (q) => sup(`${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}`);

// ---------- numbers ----------

/** n significant figures, trailing zeros kept; JS exponent form is turned into × 10ⁿ by the engine. */
export function sig(x, n = 3) {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= 5 || e <= -4) return x.toExponential(n - 1);
  return Number(x).toPrecision(n).replace(/e\+?/, 'e');
}
export const round = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp;
export const fixed = (x, dp) => Number(x).toFixed(dp);
export const AVOGADRO = 6.022e23;

// ---------- ions ----------

// Fixed-charge cations (named without a Roman numeral) and variable ones (Stock names).
export const CATIONS = [
  { f: 'Li', q: 1, name: 'lithium' }, { f: 'Na', q: 1, name: 'sodium' }, { f: 'K', q: 1, name: 'potassium' },
  { f: 'Rb', q: 1, name: 'rubidium' }, { f: 'Cs', q: 1, name: 'cesium' }, { f: 'Ag', q: 1, name: 'silver' },
  { f: 'NH4', q: 1, name: 'ammonium', poly: true },
  { f: 'Mg', q: 2, name: 'magnesium' }, { f: 'Ca', q: 2, name: 'calcium' }, { f: 'Sr', q: 2, name: 'strontium' },
  { f: 'Ba', q: 2, name: 'barium' }, { f: 'Zn', q: 2, name: 'zinc' }, { f: 'Cd', q: 2, name: 'cadmium' },
  { f: 'Al', q: 3, name: 'aluminum' }, { f: 'Ga', q: 3, name: 'gallium' },
  { f: 'Fe', q: 2, name: 'iron', v: true }, { f: 'Fe', q: 3, name: 'iron', v: true },
  { f: 'Cu', q: 1, name: 'copper', v: true }, { f: 'Cu', q: 2, name: 'copper', v: true },
  { f: 'Co', q: 2, name: 'cobalt', v: true }, { f: 'Co', q: 3, name: 'cobalt', v: true },
  { f: 'Cr', q: 2, name: 'chromium', v: true }, { f: 'Cr', q: 3, name: 'chromium', v: true },
  { f: 'Mn', q: 2, name: 'manganese', v: true }, { f: 'Mn', q: 4, name: 'manganese', v: true },
  { f: 'Ni', q: 2, name: 'nickel', v: true }, { f: 'Sn', q: 2, name: 'tin', v: true }, { f: 'Sn', q: 4, name: 'tin', v: true },
  { f: 'Pb', q: 2, name: 'lead', v: true }, { f: 'Pb', q: 4, name: 'lead', v: true },
  { f: 'Ti', q: 3, name: 'titanium', v: true }, { f: 'Ti', q: 4, name: 'titanium', v: true },
  { f: 'Os', q: 2, name: 'osmium', v: true }, { f: 'Os', q: 4, name: 'osmium', v: true },
  { f: 'Mo', q: 2, name: 'molybdenum', v: true }, { f: 'Mo', q: 3, name: 'molybdenum', v: true },
  { f: 'Au', q: 1, name: 'gold', v: true }, { f: 'Au', q: 3, name: 'gold', v: true },
  { f: 'V', q: 3, name: 'vanadium', v: true }, { f: 'V', q: 5, name: 'vanadium', v: true },
];
export const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII' };

export const ANIONS = [
  { f: 'F', q: -1, name: 'fluoride' }, { f: 'Cl', q: -1, name: 'chloride' }, { f: 'Br', q: -1, name: 'bromide' },
  { f: 'I', q: -1, name: 'iodide' }, { f: 'O', q: -2, name: 'oxide' }, { f: 'S', q: -2, name: 'sulfide' },
  { f: 'Se', q: -2, name: 'selenide' }, { f: 'N', q: -3, name: 'nitride' }, { f: 'P', q: -3, name: 'phosphide' },
  { f: 'As', q: -3, name: 'arsenide' },
  { f: 'OH', q: -1, name: 'hydroxide', poly: true }, { f: 'NO3', q: -1, name: 'nitrate', poly: true },
  { f: 'NO2', q: -1, name: 'nitrite', poly: true }, { f: 'C2H3O2', q: -1, name: 'acetate', poly: true },
  { f: 'ClO4', q: -1, name: 'perchlorate', poly: true }, { f: 'ClO3', q: -1, name: 'chlorate', poly: true },
  { f: 'ClO2', q: -1, name: 'chlorite', poly: true }, { f: 'ClO', q: -1, name: 'hypochlorite', poly: true },
  { f: 'MnO4', q: -1, name: 'permanganate', poly: true }, { f: 'CN', q: -1, name: 'cyanide', poly: true },
  { f: 'HCO3', q: -1, name: 'hydrogen carbonate', poly: true }, { f: 'H2PO4', q: -1, name: 'dihydrogen phosphate', poly: true },
  { f: 'SO4', q: -2, name: 'sulfate', poly: true }, { f: 'SO3', q: -2, name: 'sulfite', poly: true },
  { f: 'CO3', q: -2, name: 'carbonate', poly: true }, { f: 'HPO4', q: -2, name: 'hydrogen phosphate', poly: true },
  { f: 'CrO4', q: -2, name: 'chromate', poly: true }, { f: 'Cr2O7', q: -2, name: 'dichromate', poly: true },
  { f: 'PO4', q: -3, name: 'phosphate', poly: true },
];
export const anion = (name) => ANIONS.find((a) => a.name === name);
export const cation = (f, q) => CATIONS.find((c) => c.f === f && (q == null || c.q === q));

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Subscripts that make a neutral formula unit. */
export function ionCounts(cat, an) {
  const a = cat.q, b = -an.q, g = gcd(a, b);
  return { nc: b / g, na: a / g };
}
const part = (ion, n) => (n === 1 ? ion.f : ion.poly ? `(${ion.f})${n}` : `${ion.f}${n}`);
export const ionicFormula = (cat, an) => {
  const { nc, na } = ionCounts(cat, an);
  return part(cat, nc) + part(an, na);
};
export const cationName = (c) => (c.v ? `${c.name}(${ROMAN[c.q]})` : c.name);
export const ionicName = (cat, an) => `${cationName(cat)} ${an.name}`;

// ---------- solubility (OpenStax Table 4.1, restricted to clear-cut cases) ----------

const ALWAYS = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'NH4']);
export function soluble(cat, an) {
  if (ALWAYS.has(cat.f)) return true;
  if (['NO3', 'C2H3O2', 'ClO4', 'ClO3'].includes(an.f)) return true;
  if (['Cl', 'Br', 'I'].includes(an.f)) return !['Ag', 'Pb', 'Hg'].includes(cat.f);
  if (an.f === 'SO4') return !['Ba', 'Sr', 'Pb', 'Ca', 'Ag', 'Hg'].includes(cat.f);
  if (['CO3', 'PO4', 'S', 'OH', 'CrO4'].includes(an.f)) return false;
  return null;
}

// ---------- molecular prefixes ----------

export const PREFIX = { 1: 'mono', 2: 'di', 3: 'tri', 4: 'tetra', 5: 'penta', 6: 'hexa', 7: 'hepta', 8: 'octa', 9: 'nona', 10: 'deca' };
const ROOT = { O: 'oxide', S: 'sulfide', Cl: 'chloride', F: 'fluoride', Br: 'bromide', I: 'iodide', N: 'nitride', P: 'phosphide', Se: 'selenide' };
/** Systematic name of a binary molecular compound, e.g. ('N', 2, 'O', 5) -> dinitrogen pentoxide. */
export function molecularName(a, na, b, nb) {
  const first = (na === 1 ? '' : PREFIX[na]) + el(a).name;
  let p = PREFIX[nb];
  const r = ROOT[b];
  if (/^[ao]/.test(r) && /[ao]$/.test(p)) p = p.slice(0, -1);
  return `${first} ${p}${r}`;
}

/** Shuffle-free distinct helper: drops values equal to the answer or to each other (h.choices also does this). */
export const uniq = (arr) => [...new Set(arr.map(String))];
