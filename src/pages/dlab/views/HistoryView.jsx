import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDlab } from '../dlabContext';
import { presetById } from '../engine/buildTest';
import { GRAMMAR_AXES } from '../engine/grammar';

function when(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function duration(a, b) {
  if (!a || !b) return '—';
  const m = Math.round((b - a) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// A plain SVG polyline rather than a chart library: it is one series of at most
// 100 points and the axis labels would be noise at this size.
function Trend({ results }) {
  const pts = results.slice().reverse().map((r) => r.score?.percent ?? 0);
  if (pts.length < 2) return null;

  const W = 640;
  const H = 90;
  const step = W / (pts.length - 1);
  const path = pts.map((p, i) => `${i * step},${H - (p / 100) * H}`).join(' ');
  const mean = Math.round(pts.reduce((s, p) => s + p, 0) / pts.length);

  return (
    <div className="dlab-trend">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="dlab-trend-svg" aria-hidden="true">
        <line x1="0" y1={H - (mean / 100) * H} x2={W} y2={H - (mean / 100) * H} className="dlab-trend-mean" />
        <polyline points={path} className="dlab-trend-line" />
      </svg>
      <p className="dlab-help">
        {pts.length} sittings, oldest to newest. The dashed line is your average, {mean}%.
      </p>
    </div>
  );
}

export default function HistoryView() {
  const { results, removeResult, clearHistory, loading, mode } = useDlab();
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const pcts = results.map((r) => r.score?.percent ?? 0);
    const audio = results.reduce((a, r) => a + (r.score?.byPool?.audio?.total ?? 0), 0);
    const audioOk = results.reduce((a, r) => a + (r.score?.byPool?.audio?.correct ?? 0), 0);
    const written = results.reduce((a, r) => a + (r.score?.byPool?.written?.total ?? 0), 0);
    const writtenOk = results.reduce((a, r) => a + (r.score?.byPool?.written?.correct ?? 0), 0);
    return {
      best: Math.max(...pcts),
      mean: Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length),
      items: results.reduce((a, r) => a + (r.score?.total ?? 0), 0),
      audioPct: audio ? Math.round((audioOk / audio) * 100) : null,
      writtenPct: written ? Math.round((writtenOk / written) * 100) : null,
    };
  }, [results]);

  if (loading) return <p className="dlab-empty">Loading…</p>;

  if (!results.length) {
    return (
      <div className="dlab-history">
        <p className="dlab-empty">
          No sittings yet. <Link to="/DLAB">Take one</Link> and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="dlab-history">
      <section className="dlab-panel">
        <div className="dlab-histhead">
          <h2>History</h2>
          <span className="dlab-help">
            {mode === 'cloud' ? 'Synced to your account' : 'Saved on this device only — sign in to sync'}
            {' · '}last {results.length} sitting{results.length === 1 ? '' : 's'} kept
          </span>
        </div>

        <div className="dlab-stats">
          <div className="dlab-stat"><span className="dlab-statn">{stats.best}%</span><span>best</span></div>
          <div className="dlab-stat"><span className="dlab-statn">{stats.mean}%</span><span>average</span></div>
          <div className="dlab-stat"><span className="dlab-statn">{stats.items}</span><span>questions answered</span></div>
          {stats.writtenPct !== null && (
            <div className="dlab-stat"><span className="dlab-statn">{stats.writtenPct}%</span><span>written</span></div>
          )}
          {stats.audioPct !== null && (
            <div className="dlab-stat"><span className="dlab-statn">{stats.audioPct}%</span><span>by ear</span></div>
          )}
        </div>

        <Trend results={results} />
      </section>

      <table className="dlab-table dlab-histtable">
        <thead>
          <tr>
            <th>When</th><th>Code</th><th>Format</th><th>Score</th>
            <th>Written</th><th>Audio</th><th>Took</th><th>Grammar</th><th />
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const s = r.score ?? {};
            const preset = r.presetId ? presetById(r.presetId) : null;
            // How far this language sat from the site's parameter space, as a
            // rough "how unusual was it" cue — the count of axes it filled.
            const axes = r.paramVector ? GRAMMAR_AXES.filter((a) => r.paramVector[a] != null).length : 0;
            return (
              <tr key={r.id}>
                <td>{when(r.createdAt ?? r.endedAt)}</td>
                <td className="dlab-form">{r.seedCode}</td>
                <td>{preset?.label ?? `${r.config?.written ?? 0}+${r.config?.audio ?? 0} custom`}</td>
                <td>
                  <strong>{s.percent ?? 0}%</strong>
                  <span className="dlab-subtle"> {s.correct ?? 0}/{s.total ?? 0}</span>
                  {r.assistUsed && <span className="dlab-chip">options</span>}
                </td>
                <td>{s.byPool?.written?.total ? `${s.byPool.written.correct}/${s.byPool.written.total}` : '—'}</td>
                <td>{s.byPool?.audio?.total ? `${s.byPool.audio.correct}/${s.byPool.audio.total}` : '—'}</td>
                <td>{duration(r.startedAt, r.endedAt)}</td>
                <td className="dlab-subtle">{axes} axes</td>
                <td className="dlab-rowactions">
                  <Link className="dlab-btn dlab-btn-quiet" to={`/DLAB/results/${r.id}`}>Review</Link>
                  <button type="button" className="dlab-btn dlab-btn-quiet" onClick={() => removeResult(r.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="dlab-actions">
        {confirmClear ? (
          <>
            <span className="dlab-warn dlab-warn-inline">Delete all {results.length} sittings? This cannot be undone.</span>
            <button type="button" className="dlab-btn" onClick={() => setConfirmClear(false)}>Cancel</button>
            <button
              type="button"
              className="dlab-btn dlab-btn-danger"
              onClick={() => { clearHistory(); setConfirmClear(false); }}
            >
              Delete everything
            </button>
          </>
        ) : (
          <button type="button" className="dlab-btn" onClick={() => setConfirmClear(true)}>Clear history</button>
        )}
      </div>
    </div>
  );
}
