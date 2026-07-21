// Dependency-free inline-SVG charts. The site bans CDN/remote assets, so no
// chart library — these cover the weekly-volume bars and pace/PR trend lines.

export function BarChart({ data, height = 130, color = '#a3e635', valueFmt }) {
  if (!data || !data.length) return <p className="ft-empty">No data yet.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const W = n * 10;
  return (
    <div className="ft-chart">
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="ft-chart-svg" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 6);
          return (
            <rect key={i} x={i * 10 + 1.2} y={height - h} width={7.6} height={Math.max(0.5, h)}
              fill={color} opacity={d.value ? 0.85 : 0.14}>
              <title>{d.label}: {valueFmt ? valueFmt(d.value) : d.value}</title>
            </rect>
          );
        })}
      </svg>
      <div className="ft-chart-labels">
        {data.map((d, i) => <span key={i} className="ft-chart-label">{d.label}</span>)}
      </div>
    </div>
  );
}

export function LineChart({ data, height = 130, color = '#67e8f9', invert = false, valueFmt }) {
  const pts = (data || []).filter((d) => d.value != null && isFinite(d.value));
  if (pts.length < 2) return <p className="ft-empty">Need a couple of data points.</p>;
  const n = pts.length;
  const W = 100;
  const vals = pts.map((d) => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 8;
  const y = (v) => {
    const frac = (v - min) / span;         // 0 at min .. 1 at max
    const f = invert ? frac : 1 - frac;     // invert => lower value plots higher (good for pace)
    return pad + f * (height - 2 * pad);
  };
  const x = (i) => (i / (n - 1)) * (W - 4) + 2;
  const path = pts.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(d.value).toFixed(2)}`).join(' ');
  return (
    <div className="ft-chart">
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="ft-chart-svg" style={{ height }}>
        <path d={path} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        {pts.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="1.6" fill={color} vectorEffect="non-scaling-stroke">
            <title>{d.label}: {valueFmt ? valueFmt(d.value) : d.value}</title>
          </circle>
        ))}
      </svg>
      <div className="ft-chart-labels">
        {pts.map((d, i) => <span key={i} className="ft-chart-label">{d.label}</span>)}
      </div>
    </div>
  );
}
