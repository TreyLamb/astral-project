import { memo } from 'react';

// The Reading Comprehension passage. Second renderer to carry the "one figure serves several
// questions" pattern (see engine/passage.js's sheet-selection comment) - unlike a Table Reading
// grid or a Block Counting pile, nothing here is drawn from a seed. The whole figure IS the
// `text` prop, so there is nothing to memo against except React re-rendering the same string on
// every question in a run, which this still avoids doing any real work for.
//
// Passages are authored with '\n' between each printed line (see PART 15/16 in HANDOFF.md) so
// a vocabulary-in-context stem can say "As used in line 12..." and mean something concrete.
// Every array entry still IS line N for that purpose - the doctrine in engine/passage.js and
// RC-AUTHORING-SPEC.md §3 depends on that count never drifting. What changed 2026-09-22: only
// every 5th line prints its number (5, 10, 15, ...), matching the actual AFOQT/SAT convention -
// a candidate counts up from the nearest printed multiple of 5 to find e.g. line 12, exactly like
// on paper. Printing 35+ numbers in a column next to 35+ short rows is what made this "not what
// any test in the universe looks like": real ones are sparse on purpose.
const Passage = memo(function Passage({ text, lineNumbered }) {
  if (!lineNumbered) {
    return <div className="afq-rc-text">{text}</div>;
  }
  const lines = text.split('\n');
  return (
    <div className="afq-rc-text afq-rc-numbered">
      {lines.map((line, i) => {
        const n = i + 1;
        const blank = line.trim() === '';
        return (
          <div className={'afq-rc-line' + (blank ? ' afq-rc-line-blank' : '')} key={i}>
            <span className="afq-rc-lineno" aria-hidden="true">{n % 5 === 0 ? n : ''}</span>
            <span className="afq-rc-linetext">{line}</span>
          </div>
        );
      })}
    </div>
  );
});

/**
 * @param {string} text
 * @param {boolean} lineNumbered
 * @param {string} passageId  not rendered - kept in the render object only so engine/drill.js's
 *   groupByFigure can key on it (see render.sheetSeed in engine/passage.js)
 */
export default function PassageView({ text, lineNumbered, passageId }) {
  return (
    <figure className="afq-rc-fig" aria-label={`Reading passage ${passageId ?? ''}`.trim()}>
      <Passage text={text} lineNumbered={lineNumbered} />
    </figure>
  );
}
