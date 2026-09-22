// Turns generator caret-notation exponents ("x^2", "^(-3)") into real Unicode superscript for
// on-screen display ONLY.
//
// The generators keep writing caret notation exactly as before, and so does the voice engine's
// exponent pass (engine/speech.js - `\^\s*(-?\d+)` - see its own "SUBSTITUTION ORDER IS THE
// CORRECTNESS" note). This function never runs on anything voice, storage, replay
// (`templateId`+`seed`) or the audit scripts see - only on the string right before it lands in
// JSX, at the handful of places a stem/choice/explanation is actually shown.
const SUP = {
  '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
};

const toSup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');

export function mathText(s) {
  if (typeof s !== 'string' || !s.includes('^')) return s;
  return s
    .replace(/\^\(\s*(-?\d+)\s*\)/g, (_, n) => toSup(n))
    .replace(/\^(-?\d+)/g, (_, n) => toSup(n));
}
