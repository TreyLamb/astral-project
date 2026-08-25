import DataTable from './DataTable.jsx';
import AttitudeIndicator from './AttitudeIndicator.jsx';
import CompassCard from './CompassCard.jsx';
import AircraftSilhouette from './AircraftSilhouette.jsx';
import BlockPile from './BlockPile.jsx';
import PassageView from './PassageView.jsx';

// One place that knows how to draw a question's figure, so the runner never has to.
export default function Figure({ render, reveal = false }) {
  if (!render) return null;

  if (render.kind === 'table') {
    return (
      <DataTable
        sheetSeed={render.sheetSeed}
        x={render.x}
        y={render.y}
        from={render.from ?? null}
        reveal={reveal}
      />
    );
  }

  // The two dials, side by side, exactly as the subtest presents them. The technique drill shows
  // the artificial horizon alone, so a null heading means no compass.
  if (render.kind === 'instrument') {
    return (
      <figure className="afq-dials">
        <span className="afq-dial-wrap">
          <AttitudeIndicator pitch={render.pitch} bank={render.bank} size={150} />
          <figcaption>ARTIFICIAL HORIZON</figcaption>
        </span>
        {render.heading != null && (
          <span className="afq-dial-wrap">
            <CompassCard heading={render.heading} size={150} />
            <figcaption>COMPASS</figcaption>
          </span>
        )}
      </figure>
    );
  }

  // One pile serves the whole run - the seed carries the figure, the question carries which
  // numbered block is being asked about.
  if (render.kind === 'blockpile') {
    return <BlockPile sheetSeed={render.sheetSeed} highlight={render.highlight} reveal={reveal} />;
  }

  if (render.kind === 'silhouette') {
    return <AircraftSilhouette heading={render.heading} pitch={render.pitch} bank={render.bank} />;
  }

  // The reading passage. Same figure stays mounted across every question drawn from it in a
  // run (engine/passage.js picks the passage from the sheet, not per-question) - React sees the
  // same `text` prop come back on consecutive questions and does not re-mount the DOM, so the
  // passage does not visibly reload or lose scroll position between questions about it.
  if (render.kind === 'passage') {
    return <PassageView text={render.text} lineNumbered={render.lineNumbered} passageId={render.passageId} />;
  }

  return null;
}
