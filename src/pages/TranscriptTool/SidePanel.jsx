import { SCALES, isCounted, gradeOf, fmtGpa } from './gpa';

const BANDS = ['A', 'B', 'C', 'D', 'E'];

export default function SidePanel({
  actual, whatIf, termRows, courses, overrides, honorRepeats, scale, goal, solver, extras,
  onScale, onHonorRepeats, onGoal, onOpenProspective, onRemoveExtra,
  onCopyLink, onExportCsv, onExportJson, onOpenPaste,
}) {
  const prosCredits = extras.reduce((s, e) => s + (Number(e.credits) || 0), 0);

  // Credits per letter band, on the what-if grades — this is the shape of the
  // transcript, so it moves as grades are flipped.
  const dist = BANDS.map((b) => ({
    band: b,
    credits: courses
      .filter((c) => isCounted(c, honorRepeats) && gradeOf(c, overrides).charAt(0) === b)
      .reduce((s, c) => s + c.credits, 0),
  }));
  const distMax = Math.max(1, ...dist.map((d) => d.credits));

  return (
    <aside className="tt-side">
      <section className="tt-card">
        <h2>Totals</h2>
        <dl className="tt-stats">
          <div><dt>GPA hours</dt><dd>{actual.gpaHours} <em>→ {whatIf.gpaHours}</em></dd></div>
          <div><dt>Earned hours</dt><dd>{actual.earnedHours} <em>→ {whatIf.earnedHours}</em></dd></div>
          <div><dt>Quality points</dt><dd>{actual.points.toFixed(2)} <em>→ {whatIf.points.toFixed(2)}</em></dd></div>
          <div><dt>GPA</dt><dd className="tt-stat-big">{fmtGpa(actual.gpa)} <em>→ {fmtGpa(whatIf.gpa)}</em></dd></div>
        </dl>
      </section>

      <section className="tt-card">
        <h2>How it's counted</h2>
        <label className="tt-field">
          <span>Grade scale</span>
          <select value={scale} onChange={(e) => onScale(e.target.value)}>
            {Object.entries(SCALES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
          </select>
        </label>
        <label className="tt-check">
          <input type="checkbox" checked={honorRepeats} onChange={(e) => onHonorRepeats(e.target.checked)} />
          <span>
            Honour repeat exclusions
            <em>UVU drops a superseded attempt from the GPA entirely. Off = every attempt counts.</em>
          </span>
        </label>
        <p className="tt-note">
          UVU's plus/minus steps are ±0.4 / 0.7, not the ±0.3 / 0.7 used elsewhere, and it truncates
          the displayed GPA rather than rounding. Both defaults reproduce the printed 3.05.
        </p>
      </section>

      <section className="tt-card">
        <h2>Reach a target</h2>
        <label className="tt-field">
          <span>Goal GPA</span>
          <input
            type="number" min="0" max="4" step="0.01"
            value={goal}
            onChange={(e) => onGoal(e.target.value)}
          />
        </label>
        <p className="tt-solve">
          {solver.met
            ? <>Already there — the what-if GPA is <strong>{fmtGpa(whatIf.gpa)}</strong>.</>
            : solver.unreachable
              ? <>Out of reach at that grade.</>
              : <>Needs <strong>{solver.credits}</strong> more credit hours at an <strong>A</strong>.</>}
        </p>
      </section>

      <section className="tt-card">
        <h2>Prospective classes</h2>
        <button type="button" className="tt-btn tt-btn-pros tt-btn-wide" onClick={onOpenProspective}>
          + Add a prospective class
        </button>
        {extras.length > 0 && (
          <ul className="tt-proslist">
            {extras.map((e) => (
              <li key={e.id}>
                <span className="tt-proslist-code">{e.code}</span>
                <span className="tt-proslist-title">{e.course}</span>
                <span className="tt-proslist-cr">{e.credits} cr</span>
                <span className={`tt-g tt-g-${e.grade.charAt(0)}`}>{e.grade}</span>
                <button type="button" className="tt-undo" title={`Remove ${e.code}`} onClick={() => onRemoveExtra(e.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <p className="tt-note">
          {extras.length
            ? `${extras.length} prospective class${extras.length === 1 ? '' : 'es'} — ${prosCredits} cr at assumed grades, counted in the what-if column only.`
            : 'Classes you have not taken yet, with the grade you are assuming. They get their own section in the table.'}
        </p>
      </section>

      <section className="tt-card">
        <h2>Grade spread</h2>
        <ul className="tt-dist">
          {dist.map((d) => (
            <li key={d.band}>
              <span className={`tt-dist-label tt-g-${d.band}`}>{d.band}</span>
              <span className="tt-dist-bar"><i className={`tt-band-${d.band}`} style={{ width: `${(d.credits / distMax) * 100}%` }} /></span>
              <span className="tt-dist-num">{d.credits}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="tt-card">
        <h2>By semester</h2>
        <table className="tt-terms">
          <thead>
            <tr><th>Term</th><th>Hrs</th><th>GPA</th><th>What-if</th><th>Printed</th></tr>
          </thead>
          <tbody>
            {termRows.map((t) => {
              const shown = fmtGpa(t.actual.gpa);
              const printed = t.printed ? t.printed.gpa.toFixed(2) : null;
              const mismatch = printed && shown !== printed;
              const moved = fmtGpa(t.whatIf.gpa) !== shown;
              return (
                <tr key={t.semester} className={mismatch ? 'tt-term-bad' : ''}>
                  <td>{t.semester}</td>
                  <td className="tt-c-num">{t.actual.gpaHours}</td>
                  <td className="tt-c-num">{shown}</td>
                  <td className={`tt-c-num${moved ? ' tt-term-moved' : ''}`}>{moved ? fmtGpa(t.whatIf.gpa) : '·'}</td>
                  <td className="tt-c-num">{mismatch ? <strong>{printed} ✗</strong> : <span className="tt-dash">{printed || '—'} ✓</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="tt-note">
          <strong>Printed</strong> is what the registrar put on the transcript. A ✗ means this tool
          disagrees with it — that would be a parsing bug, not a what-if change.
        </p>
      </section>

      <section className="tt-card">
        <h2>Scenario</h2>
        <div className="tt-side-actions">
          <button type="button" className="tt-btn" onClick={onCopyLink}>Copy link</button>
          <button type="button" className="tt-btn" onClick={onExportCsv}>Export CSV</button>
          <button type="button" className="tt-btn" onClick={onExportJson}>Export JSON</button>
          <button type="button" className="tt-btn" onClick={onOpenPaste}>Load transcript…</button>
        </div>
        <p className="tt-note">Changes save to this browser automatically.</p>
      </section>
    </aside>
  );
}
