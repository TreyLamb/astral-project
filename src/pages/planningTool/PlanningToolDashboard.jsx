import { useMemo, useState } from 'react';

// Read-only DASHBOARD VIEW for any saved workbook — KPI tiles + an
// auto-detected bar chart layered on top of the SAME locked grid used below
// (SheetGrid with readOnly), rather than replacing it. Works generically off
// whatever's in the active sheet; nothing here is pushup-plan-specific.
//
// Per the dataviz skill: single-hue sequential blue (dark-mode-validated
// step, see references/palette.md) for the one-series bar chart — a single
// series needs no legend box, the chart's own title names it. Selective
// direct labels (only the max bar) + a real hover tooltip, not a title-attr
// tooltip. This page has no light theme at all (PlanningTool.css is a fixed
// dark surface throughout), so colors are the dark-mode-validated hex
// directly rather than a light/dark custom-property pair.
const CHART_HUE = '#3987e5'; // palette.md categorical slot 1 / sequential step 400, dark-mode
const CHART_HUE_MUTED = 'rgba(57, 135, 229, 0.35)';

function isHeaderLikeText(v) {
  return typeof v === 'string' && v.trim() !== '' && Number.isNaN(Number(v));
}

// Scans the sheet's actual used range (not the padded min-20x10 display
// grid) for: total/numeric/formula cell counts, a label column (first mostly-
// text column), and every numeric column with a usable header — the inputs
// both the KPI tiles and the chart column picker need. Generic over any
// workbook; nothing here assumes pushup-plan's own column layout.
function analyzeSheet(hf, sheetId) {
  const dims = hf.getSheetDimensions(sheetId);
  const height = dims.height, width = dims.width;
  let nonEmpty = 0, numeric = 0, formula = 0;
  const hasHeaderRow = Array.from({ length: width }, (_, c) => hf.getCellValue({ sheet: sheetId, row: 0, col: c }))
    .some((v) => isHeaderLikeText(v));
  const bodyStart = hasHeaderRow ? 1 : 0;

  const columns = Array.from({ length: width }, () => ({ numericCount: 0, textCount: 0 }));
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const addr = { sheet: sheetId, row: r, col: c };
      const v = hf.getCellValue(addr);
      const isFormula = hf.doesCellHaveFormula(addr);
      if (isFormula) formula++;
      if (v === null || v === undefined || v === '') continue;
      nonEmpty++;
      const isNum = typeof v === 'number';
      if (isNum) numeric++;
      if (r >= bodyStart) {
        if (isNum) columns[c].numericCount++;
        else if (typeof v === 'string' && v.trim() !== '') columns[c].textCount++;
      }
    }
  }

  const bodyRows = height - bodyStart;
  const numericColumns = [];
  let labelCol = 0, labelColScore = -1;
  for (let c = 0; c < width; c++) {
    const { numericCount, textCount } = columns[c];
    if (bodyRows > 0 && numericCount / bodyRows >= 0.5 && numericCount >= 2) {
      const header = hasHeaderRow ? String(hf.getCellValue({ sheet: sheetId, row: 0, col: c }) ?? '') : '';
      numericColumns.push({ col: c, header: header || `Column ${String.fromCharCode(65 + c)}`, numericCount });
    }
    if (textCount > labelColScore) { labelColScore = textCount; labelCol = c; }
  }

  // A "headline" KPI: the LAST value in a Total/Sum/Grand-labeled column, or
  // the MAX value in a Cumulative-labeled column — both direct, generic
  // pattern-matches on header text, not anything pushup-plan-specific.
  let headline = null;
  for (const nc of numericColumns) {
    const isTotalish = /total|sum|grand/i.test(nc.header);
    const isCumulative = /cumulative|running/i.test(nc.header);
    if (!isTotalish && !isCumulative) continue;
    const values = [];
    for (let r = bodyStart; r < height; r++) {
      const v = hf.getCellValue({ sheet: sheetId, row: r, col: nc.col });
      if (typeof v === 'number') values.push(v);
    }
    if (values.length === 0) continue;
    const value = isCumulative ? Math.max(...values) : values[values.length - 1];
    if (!headline || isCumulative) headline = { label: nc.header, value };
    if (isCumulative) break; // prefer a cumulative headline over a plain total if both exist
  }

  return { dims, hasHeaderRow, bodyStart, nonEmpty, numeric, formula, numericColumns, labelCol, headline };
}

function readColumnSeries(hf, sheetId, bodyStart, height, col, labelCol) {
  const points = [];
  for (let r = bodyStart; r < height; r++) {
    const v = hf.getCellValue({ sheet: sheetId, row: r, col });
    if (typeof v !== 'number') continue;
    const rawLabel = hf.getCellValue({ sheet: sheetId, row: r, col: labelCol });
    points.push({ row: r, label: rawLabel === null || rawLabel === undefined || rawLabel === '' ? String(r + 1) : String(rawLabel), value: v });
  }
  return points;
}

function StatTile({ label, value, sub }) {
  return (
    <div className="pt-dash-tile">
      <div className="pt-dash-tile-value">{value}</div>
      <div className="pt-dash-tile-label">{label}</div>
      {sub && <div className="pt-dash-tile-sub">{sub}</div>}
    </div>
  );
}

// Thin-bar chart, rounded data-ends anchored to a baseline, 2px surface gaps,
// single hue (magnitude, one series — no legend box needed), a real hover
// tooltip (not a title attribute), and a direct label on only the max bar
// (selective labeling, not a number on every point). Horizontal scroll if
// there are more bars than comfortably fit, per the "wide content scrolls in
// its own container" rule.
function BarChart({ title, points, maxBars = 40 }) {
  const [hover, setHover] = useState(null); // { idx, x, y }
  const shown = points.slice(0, maxBars);
  const max = Math.max(1, ...shown.map((p) => p.value));
  const maxIdx = shown.reduce((best, p, i) => (p.value > shown[best]?.value ? i : best), 0);

  if (shown.length === 0) {
    return <div className="pt-dash-chart-empty">No numeric data to chart in this column.</div>;
  }

  return (
    <div className="pt-dash-chart-card">
      <div className="pt-dash-chart-title">{title}</div>
      <div className="pt-dash-chart-scroll">
        <div className="pt-dash-chart-plot" style={{ '--bar-count': shown.length }}>
          {shown.map((p, i) => {
            const pct = Math.max(2, (p.value / max) * 100);
            return (
              <div
                key={p.row}
                className="pt-dash-bar-col"
                onMouseEnter={(e) => setHover({ idx: i, x: e.currentTarget.offsetLeft, y: 0 })}
                onMouseLeave={() => setHover((h) => (h?.idx === i ? null : h))}
              >
                {i === maxIdx && <div className="pt-dash-bar-directlabel">{p.value}</div>}
                <div
                  className="pt-dash-bar"
                  style={{ height: `${pct}%`, background: i === maxIdx ? CHART_HUE : CHART_HUE_MUTED, borderColor: CHART_HUE }}
                />
                <div className="pt-dash-bar-xlabel" title={p.label}>{p.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      {hover && (
        <div className="pt-dash-tooltip" style={{ left: hover.x }}>
          <strong>{shown[hover.idx].label}</strong>: {shown[hover.idx].value}
        </div>
      )}
      {points.length > maxBars && (
        <div className="pt-dash-chart-note">Showing first {maxBars} of {points.length} data points.</div>
      )}
    </div>
  );
}

export default function PlanningToolDashboard({ doc, activeSheet, sheetId }) {
  const analysis = useMemo(() => {
    if (!doc || sheetId === null || sheetId === undefined) return null;
    return analyzeSheet(doc.hf, sheetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, activeSheet, sheetId]);

  const [chartCol, setChartCol] = useState(null);
  const effectiveChartCol = chartCol ?? analysis?.numericColumns?.[0]?.col ?? null;

  if (!analysis) return null;

  const chartSeries = effectiveChartCol !== null
    ? readColumnSeries(doc.hf, sheetId, analysis.bodyStart, analysis.dims.height, effectiveChartCol, analysis.labelCol)
    : [];
  const chartColMeta = analysis.numericColumns.find((c) => c.col === effectiveChartCol);
  const chartTotal = chartSeries.reduce((a, p) => a + p.value, 0);

  return (
    <div className="pt-dash">
      <div className="pt-dash-tiles">
        <StatTile label="Used range" value={`${analysis.dims.height} × ${analysis.dims.width}`} sub="rows × cols" />
        <StatTile label="Non-empty cells" value={analysis.nonEmpty} />
        <StatTile label="Numeric cells" value={analysis.numeric} />
        <StatTile label="Formula cells" value={analysis.formula} />
        {analysis.headline && (
          <StatTile label={analysis.headline.label} value={analysis.headline.value} sub="auto-detected headline" />
        )}
      </div>

      {analysis.numericColumns.length > 0 ? (
        <>
          <div className="pt-dash-chart-controls">
            <label>
              Chart column:
              <select value={effectiveChartCol ?? ''} onChange={(e) => setChartCol(Number(e.target.value))}>
                {analysis.numericColumns.map((c) => (
                  <option key={c.col} value={c.col}>{c.header}</option>
                ))}
              </select>
            </label>
            {chartColMeta && <span className="pt-dash-chart-total">Sum: {Math.round(chartTotal * 1e6) / 1e6}</span>}
          </div>
          <BarChart title={chartColMeta ? chartColMeta.header : 'Chart'} points={chartSeries} />
        </>
      ) : (
        <div className="pt-dash-chart-empty">No column in this sheet looks numeric enough to chart (need at least 2 numeric cells filling half a column).</div>
      )}
    </div>
  );
}
