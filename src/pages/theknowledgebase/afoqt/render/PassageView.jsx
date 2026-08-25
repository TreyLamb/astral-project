import { memo } from 'react';

// The Reading Comprehension passage. Second renderer to carry the "one figure serves several
// questions" pattern (see engine/passage.js's sheet-selection comment) - unlike a Table Reading
// grid or a Block Counting pile, nothing here is drawn from a seed. The whole figure IS the
// `text` prop, so there is nothing to memo against except React re-rendering the same string on
// every question in a run, which this still avoids doing any real work for.
//
// Passages are authored with '\n' between each printed line (see PART 15/16 in HANDOFF.md) so
// a vocabulary-in-context stem can say "As used in line 12..." and mean something concrete.
// Every line gets a number - not just every 5th - because the numbering exists purely so an item
// can point at one, never as something a candidate is meant to count off distance for.
const Passage = memo(function Passage({ text, lineNumbered }) {
  if (!lineNumbered) {
    return <div className="afq-rc-text">{text}</div>;
  }
  const lines = text.split('\n');
  return (
    <div className="afq-rc-text afq-rc-numbered">
      {lines.map((line, i) => (
        <div className="afq-rc-line" key={i}>
          <span className="afq-rc-lineno" aria-hidden="true">{i + 1}</span>
          <span className="afq-rc-linetext">{line}</span>
        </div>
      ))}
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
