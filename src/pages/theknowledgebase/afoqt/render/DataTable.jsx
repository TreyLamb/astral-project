import { memo, useMemo } from 'react';
import { X_VALUES, sheetRows, errorCells, ERROR_LABELS, signed } from '../engine/table.js';

// The Table Reading grid. The project's first renderer, and the simplest one it will have.
//
// Two decisions that look like omissions and are not:
//
// 1. NO HOVER HIGHLIGHT while the question is live. Highlighting the row under the cursor would
//    make this trivially easy and would train a crutch the real subtest does not hand you - the
//    directions specifically forbid a straight edge, which is the paper version of the same
//    assist. The whole skill being drilled is tracking a row without help.
// 2. THE GRID IS SIZED TO FIT, not to scroll. The real subtest prints one block and gives you
//    10.5 seconds; a grid you had to scroll would be measuring scrolling. It only scrolls
//    horizontally inside its own box on a narrow window, and the axis labels stick to the edges
//    there so a value is never separated from its label - which is what paper gives you free.
//
// After the answer is in, all of that reverses: `reveal` marks the correct cell AND every cell
// a named error mode would have landed on, so a miss becomes "you read Y as ascending" rather
// than a red X.

const EMPTY = new Map();
const key = (x, y) => `${x},${y}`;

// X values along the top AND the bottom, Y values down the left AND the right, with the axis
// named on all four sides. That is exactly how the official OATTS block is printed - see
// docs/afoqt/OATTS-TABLE-READING.md - and it is the reason a row stays trackable when the
// directions forbid a straight edge. Labelling only the top-left corner (what this used to do)
// is harder than the real subtest in a way that trains nothing: by column 30 you are counting
// header cells backwards instead of reading a value.
const AxisRow = ({ marks }) => (
  <tr>
    <th className="afq-tg-corner" />
    {X_VALUES.map((x) => (
      <th key={x} scope="col" className={marks.has(`col:${x}`) ? 'afq-tg-axis-lit' : undefined}>
        {signed(x)}
      </th>
    ))}
    <th className="afq-tg-corner" />
  </tr>
);

const Grid = memo(function Grid({ sheetSeed, marks }) {
  const rows = useMemo(() => sheetRows(sheetSeed), [sheetSeed]);
  return (
    <table className="afq-tg">
      <thead><AxisRow marks={marks} /></thead>
      <tbody>
        {rows.map((row) => {
          const lit = marks.has(`row:${row.y}`) ? 'afq-tg-axis-lit' : undefined;
          return (
            <tr key={row.y}>
              <th scope="row" className={lit}>{signed(row.y)}</th>
              {row.cells.map((c) => {
                const mark = marks.get(key(c.x, row.y));
                return (
                  <td key={c.x} className={mark ? `afq-tg-mark afq-tg-${mark.tone}` : undefined} title={mark?.label}>
                    {c.text}
                  </td>
                );
              })}
              <th scope="row" className={lit}>{signed(row.y)}</th>
            </tr>
          );
        })}
      </tbody>
      <tfoot><AxisRow marks={marks} /></tfoot>
    </table>
  );
});

/**
 * @param {number} sheetSeed  the figure; identical for every question in one drill
 * @param {number} x,y        the cell the question is about
 * @param {{x:number,y:number}} [from]  for the orientation item, the cell it starts from
 * @param {boolean} [reveal]  show the answer and the error-mode cells
 */
export default function DataTable({ sheetSeed, x, y, from = null, reveal = false }) {
  const marks = useMemo(() => {
    if (!reveal) return EMPTY;
    const m = new Map();
    for (const c of errorCells(x, y)) {
      if (!m.has(key(c.x, c.y))) m.set(key(c.x, c.y), { tone: 'err', label: ERROR_LABELS[c.error] ?? c.error });
    }
    if (from) m.set(key(from.x, from.y), { tone: 'from', label: 'the cell the question named' });
    m.set(key(x, y), { tone: 'ok', label: 'the answer' });
    m.set(`row:${y}`, true);
    m.set(`col:${x}`, true);
    return m;
  }, [reveal, sheetSeed, x, y, from]);

  return (
    <figure className="afq-table-fig">
      {/* The axis NAMES sit outside the scroll box so they cannot scroll away from the values
          they label - X centred above and below, Y centred either side, as OATTS prints it. */}
      <div className="afq-tg-axis-name afq-tg-x">X</div>
      <div className="afq-tg-frame">
        <div className="afq-tg-axis-name afq-tg-y">Y</div>
        <div className="afq-table-wrap">
          <Grid sheetSeed={sheetSeed} marks={marks} />
        </div>
        <div className="afq-tg-axis-name afq-tg-y">Y</div>
      </div>
      <div className="afq-tg-axis-name afq-tg-x">X</div>
      {reveal && (
        <figcaption className="afq-table-legend">
          <span className="afq-tg-key afq-tg-ok" /> the answer
          <span className="afq-tg-key afq-tg-err" /> where a named mistake would have put you
          {from && <><span className="afq-tg-key afq-tg-from" /> the cell the question named</>}
        </figcaption>
      )}
    </figure>
  );
}
