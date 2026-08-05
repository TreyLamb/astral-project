// Fill-handle logic: dragging the little square at the bottom-right of a
// selection extends it, either continuing a detected numeric arithmetic
// sequence or repeating the source pattern with formula references shifted
// relatively (like real Excel/Sheets fill-down/fill-right).

function colLettersToIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function indexToColLetters(index) {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// Shifts every relative cell reference in a formula by (dRow, dCol),
// leaving $-absolute rows/columns untouched (matches Excel's own fill
// behavior) and leaving named ranges/sheet names alone (they never match —
// this only matches an optional $, 1-3 letters, optional $, then digits).
export function shiftFormulaReferences(formula, dRow, dCol) {
  return formula.replace(
    /(?<![A-Za-z0-9_])(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?![A-Za-z0-9_(])/g,
    (match, colAbs, colLetters, rowAbs, rowDigits) => {
      const newCol = colAbs ? colLetters : indexToColLetters(Math.max(0, colLettersToIndex(colLetters) + dCol));
      const newRow = rowAbs ? rowDigits : String(Math.max(1, parseInt(rowDigits, 10) + dRow));
      return `${colAbs}${newCol}${rowAbs}${newRow}`;
    }
  );
}

// If every value in `series` is numeric and forms a constant-difference
// arithmetic sequence (or there's only one number, which just repeats),
// returns the common difference; otherwise null (meaning: don't auto-
// continue a series, just repeat the source pattern instead).
function detectArithmeticStep(series) {
  if (series.length === 0) return null;
  const nums = series.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;
  if (nums.length === 1) return 0;
  const step = nums[1] - nums[0];
  for (let i = 2; i < nums.length; i++) {
    if (Math.abs(nums[i] - nums[i - 1] - step) > 1e-9) return null;
  }
  return step;
}

// sourceCells: [{ row, col, raw }] in fill-axis order (the existing
// selection, before the drag). targetCells: [{ row, col }] the new cells
// being filled in, in the same axis order, each carrying `distanceFromSource`
// (1-based index into how far past the source block this target cell is).
// Returns [{ row, col, value }] raw inputs to write.
export function computeFillValues(sourceCells, targetCells) {
  const n = sourceCells.length;
  const allFormulas = sourceCells.every((c) => typeof c.raw === 'string' && c.raw.startsWith('='));
  const allPlainNumbers = sourceCells.every((c) => c.raw !== null && c.raw !== '' && !Number.isNaN(Number(c.raw)) && !(typeof c.raw === 'string' && c.raw.startsWith('=')));

  let step = null;
  if (allPlainNumbers) step = detectArithmeticStep(sourceCells.map((c) => c.raw));

  return targetCells.map((target, i) => {
    const sourceIdx = i % n;
    const source = sourceCells[sourceIdx];

    if (step !== null && allPlainNumbers) {
      // Target at position i (0-indexed, right after the n source cells)
      // sits at absolute position (n + i) counting from the source's own
      // start — e.g. source [1,2] (step 1, n=2): target i=0 is absolute
      // position 2, value 1 + 1*2 = 3; i=1 -> position 3, value 4. Etc.
      const value = Number(sourceCells[0].raw) + step * (n + i);
      return { row: target.row, col: target.col, value: String(value) };
    }

    if (allFormulas) {
      const dRow = target.row - source.row;
      const dCol = target.col - source.col;
      const shifted = '=' + shiftFormulaReferences(source.raw.slice(1), dRow, dCol);
      return { row: target.row, col: target.col, value: shifted };
    }

    // Plain repeat (text, mixed content, or a single non-numeric value).
    return { row: target.row, col: target.col, value: source.raw === null || source.raw === undefined ? '' : String(source.raw) };
  });
}
