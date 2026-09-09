// Exact decimal arithmetic on measured values, for the significant-figure templates.
//
// WHY THIS EXISTS (2026-09-09)
// The sig-fig templates were written with hand-declared case tables — six add/subtract pairs,
// six multiply/divide pairs, four products, twelve counting items. Measuring the bank found
// they were the THINNEST templates covering the single heaviest topic on Trey's Exam 1: 16
// distinct questions between them, so a 40-question run repeated them immediately. He noticed:
// "Is it just questions I gave or do you actually have unique questions."
//
// They were declared rather than generated for a real reason, recorded in toolbox.js: a JS
// number silently destroys trailing zeros (12.0 -> "12", 7.50 -> "7.5"), and a trailing zero IS
// the content of a sig-fig question. Float arithmetic makes it worse — 1.02 - 0.010 is
// 1.0099999999999998, so even the RAW value cannot be printed from a double.
//
// The fix is not to go back to floats, it is to never leave the decimal domain: every value is
// carried as an integer of digits plus a decimal-place count, all arithmetic is BigInt, and the
// string is built from the digits rather than recovered from a number. Trailing zeros survive
// because they are never stored in a format that can lose them.

/** Random digit string of length n, first digit non-zero. */
export function digitString(h, n) {
  let s = String(h.int(1, 9));
  for (let i = 1; i < n; i++) s += h.int(0, 9);
  return s;
}

/**
 * A measured value carried exactly: `scaled` is every digit as one integer, `dp` says where the
 * decimal point sits, and `str` is the literal text to show. value = scaled / 10^dp.
 *
 * @returns {{str: string, dp: number, scaled: bigint, sf: number}}
 */
export function measured(h, intDigits, dp) {
  const ip = digitString(h, intDigits);
  let fp = '';
  for (let i = 0; i < dp; i++) fp += h.int(0, 9);
  const str = dp > 0 ? `${ip}.${fp}` : ip;
  return { str, dp, scaled: BigInt(ip + fp), sf: sigFigsOf(str) };
}

/** A value below 1, e.g. 0.0140 — leading zeros are placeholders and never significant. */
export function measuredSmall(h, leadingZeros, sigDigits) {
  const digits = digitString(h, sigDigits);
  const str = `0.${'0'.repeat(leadingZeros)}${digits}`;
  return { str, dp: leadingZeros + sigDigits, scaled: BigInt(digits), sf: sigDigits };
}

/**
 * Significant figures in a decimal STRING (not a number).
 * Leading zeros never count; a decimal point makes every trailing zero count; without one,
 * trailing zeros are ambiguous and are not counted.
 */
export function sigFigsOf(str) {
  const s = String(str).replace(/^-/, '');
  if (!s.includes('.')) return s.replace(/^0+/, '').replace(/0+$/, '').length || 1;
  return s.replace('.', '').replace(/^0+/, '').length;
}

/** Render a scaled integer back to text, keeping every trailing zero. */
export function render(scaled, dp) {
  let s = scaled.toString();
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  if (dp === 0) return (neg ? '-' : '') + s;
  s = s.padStart(dp + 1, '0');
  return (neg ? '-' : '') + s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp);
}

/** Round a scaled integer to `toDp` decimal places. Half away from zero, as chemistry teaches. */
export function roundToDp(scaled, fromDp, toDp) {
  if (toDp >= fromDp) return { scaled: scaled * 10n ** BigInt(toDp - fromDp), dp: toDp };
  const div = 10n ** BigInt(fromDp - toDp);
  const neg = scaled < 0n;
  const abs = neg ? -scaled : scaled;
  const q = abs / div;
  const r = abs % div;
  const up = r * 2n >= div ? q + 1n : q;
  return { scaled: neg ? -up : up, dp: toDp };
}

/** Round a scaled integer to `sf` significant figures, returned as display text. */
export function roundToSigFigs(scaled, dp, sf) {
  const neg = scaled < 0n;
  const abs = neg ? -scaled : scaled;
  const digits = abs.toString();
  if (digits === '0') return '0';
  // Place value of the leading digit: how many powers of ten above the decimal point it sits.
  const magnitude = digits.length - 1 - dp;
  const targetDp = sf - 1 - magnitude;
  if (targetDp >= 0) {
    const r = roundToDp(abs, dp, targetDp);
    return (neg ? '-' : '') + render(r.scaled, r.dp);
  }
  // Rounding lands LEFT of the decimal point (155.384 to 2 sf). Round to whole, then to the
  // right power of ten, and pad with zeros — printing "160.00" would claim precision the answer
  // does not have. Kept in BigInt so a large value cannot drift.
  const z = BigInt(-targetDp);
  const whole = roundToDp(abs, dp, 0).scaled;
  const div = 10n ** z;
  const q = whole / div;
  const bumped = (whole % div) * 2n >= div ? q + 1n : q;
  return (neg ? '-' : '') + bumped.toString() + '0'.repeat(Number(z));
}

/** a op b, exactly. Both operands must carry `scaled` and `dp`. */
export function addSub(a, b, op) {
  const dp = Math.max(a.dp, b.dp);
  const av = a.scaled * 10n ** BigInt(dp - a.dp);
  const bv = b.scaled * 10n ** BigInt(dp - b.dp);
  return { scaled: op === '+' ? av + bv : av - bv, dp };
}
