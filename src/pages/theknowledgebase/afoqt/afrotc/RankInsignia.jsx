/**
 * Cadet rank insignia, drawn rather than photographed.
 *
 * Two forms, because the chart shows two and a cadet meets both: the shoulder EPAULET (a dark
 * sleeve carrying silver marks) and the UTILITY PIN worn on the flight-duty uniform. The pin is
 * not a smaller epaulet - GMC pins are chevrons where GMC epaulets are diagonal slashes, and the
 * officer pin stacks its stripes horizontally where the epaulet runs them vertically. Drilling
 * only one form is why people freeze when they meet the other.
 *
 * Colours come from the --tkb-* tokens, so both themes work without a second palette.
 */

const PLATE = 'var(--afq-rotc-plate)';
const MARK = 'var(--afq-rotc-mark)';
const GMC_MARK = 'var(--afq-rotc-gmc)';

/** Shoulder epaulet: a dark sleeve, marks reading outboard edge inward. */
export function Epaulet({ rank, size = 148 }) {
  const W = 148, H = 66, pad = 9;
  const marks = [];

  if (rank.kind === 'off') {
    let x = pad;
    for (const b of rank.bars) {
      const w = b === 'w' ? 13 : 6;
      marks.push(<rect key={`b${x}`} x={x} y={pad} width={w} height={H - pad * 2} fill={MARK} />);
      x += w + 8;
    }
  } else {
    // GMC epaulet marks are diagonal slashes, not chevrons - the chevrons are the pin.
    for (let i = 0; i < rank.n; i++) {
      const x = pad + 6 + i * 21;
      marks.push(
        <path key={`s${i}`} d={`M${x} ${H - pad} L${x + 17} ${pad} L${x + 25} ${pad} L${x + 8} ${H - pad} Z`} fill={MARK} />,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} height={(size / W) * H} role="img"
      aria-label={`${rank.name} epaulet`} className="afq-rotc-svg">
      <rect width={W} height={H} rx="2" fill={PLATE} />
      {marks}
    </svg>
  );
}

/** Utility-uniform pin. Officer stripes stack horizontally; GMC is chevrons on no plate. */
export function Pin({ rank, size = 74 }) {
  const S = 74, pad = 9;

  if (rank.kind === 'off') {
    const hs = rank.bars.map((b) => (b === 'w' ? 9 : 4));
    const gap = 7;
    const total = hs.reduce((a, b) => a + b, 0) + gap * (hs.length - 1);
    // Offsets are computed up front rather than accumulated inside the map - a map callback that
    // mutates an outer variable is a side effect in render, and it reads wrong on a re-render.
    const top = (S - total) / 2;
    const ys = hs.reduce((acc, h, i) => [...acc, acc[i] + h + gap], [top]);
    const rows = hs.map((h, i) => (
      <rect key={i} x={pad} y={ys[i]} width={S - pad * 2} height={h} fill={MARK} />
    ));
    return (
      <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size} role="img"
        aria-label={`${rank.name} utility pin`} className="afq-rotc-svg">
        <rect width={S} height={S} rx="2" fill={PLATE} />
        {rows}
      </svg>
    );
  }

  // GMC pin: chevron count is one MORE than the epaulet slash count.
  const count = rank.n + 1, cw = 15, gap = 5;
  const totalW = count * cw + (count - 1) * gap;
  let x = (S - totalW) / 2;
  const chevrons = [];
  for (let i = 0; i < count; i++) {
    chevrons.push(
      <path key={i}
        d={`M${x} 16 L${x + cw} ${S / 2} L${x} ${S - 16} L${x + 6} ${S - 16} L${x + cw + 6} ${S / 2} L${x + 6} 16 Z`}
        fill={GMC_MARK} />,
    );
    x += cw + gap;
  }
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size} role="img"
      aria-label={`${rank.name} utility pin`} className="afq-rotc-svg">
      {chevrons}
    </svg>
  );
}

/** One or both forms with captions, for the flashcard face. */
export function Plates({ rank, form }) {
  return (
    <div className="afq-rotc-plates">
      {(form === 'both' || form === 'epaulet') && (
        <div className="afq-rotc-plate-box"><Epaulet rank={rank} /><span className="afq-rotc-cap">Epaulet</span></div>
      )}
      {(form === 'both' || form === 'pin') && (
        <div className="afq-rotc-plate-box"><Pin rank={rank} /><span className="afq-rotc-cap">Utility pin</span></div>
      )}
    </div>
  );
}

/**
 * A single un-captioned plate, for a multiple-choice option.
 *
 * `form` of 'both' collapses to the epaulet: four options each showing two plates is eight
 * pictures on one phone screen, at which point the choice is a reading exercise rather than a
 * recognition one.
 */
export function PlateOnly({ rank, form, size }) {
  return form === 'pin' ? <Pin rank={rank} size={size} /> : <Epaulet rank={rank} size={size} />;
}
