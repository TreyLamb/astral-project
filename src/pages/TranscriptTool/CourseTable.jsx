import { SCALES, GRADES, isCounted, gradeOf } from './gpa';
import { COLUMNS } from './columns';

const band = (g) => (g || '').charAt(0);

function FilterCell({ col, filters, onFilter, semesters, creditValues }) {
  const value = filters[col.key] || '';
  const set = (v) => onFilter(col.key, v);

  switch (col.filter) {
    case 'semester':
      return (
        <select className="tt-f" value={value} onChange={(e) => set(e.target.value)} aria-label="Filter by semester">
          <option value="">All</option>
          {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    case 'credits':
      return (
        <select className="tt-f" value={value} onChange={(e) => set(e.target.value)} aria-label="Filter by credits">
          <option value="">All</option>
          {creditValues.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    case 'grade':
      return (
        <select className="tt-f" value={value} onChange={(e) => set(e.target.value)} aria-label={`Filter by ${col.label.toLowerCase()} grade`}>
          <option value="">All</option>
          <optgroup label="Exactly">
            {GRADES.map((g) => <option key={g} value={g} className={`tt-g-${band(g)}`}>{g}</option>)}
          </optgroup>
          <optgroup label="Band">
            {['A', 'B', 'C', 'D', 'E'].map((b) => <option key={`b${b}`} value={`band:${b}`} className={`tt-g-${b}`}>{b} range</option>)}
          </optgroup>
        </select>
      );
    case 'impact':
      return (
        <select className="tt-f" value={value} onChange={(e) => set(e.target.value)} aria-label="Filter by impact">
          <option value="">All</option>
          <option value="gain">Any gain</option>
          <option value="big">Big (≥0.01)</option>
          <option value="none">No gain</option>
        </select>
      );
    case 'text':
      return (
        <input
          className="tt-f"
          type="search"
          value={value}
          placeholder="filter…"
          onChange={(e) => set(e.target.value)}
          aria-label={`Filter by ${col.label.toLowerCase()}`}
        />
      );
    default:
      return null;
  }
}

export default function CourseTable({
  rows, overrides, impacts, scale, honorRepeats, onGrade, onRemoveExtra,
  sort, onSort, filters, onFilter, semesters, creditValues,
  changedFirst, onChangedFirst, changedCount,
}) {
  const table = SCALES[scale].points;

  return (
    <div className="tt-scroll">
      <table className="tt-table">
        <thead>
          <tr className="tt-head-labels">
            {COLUMNS.map((col) => {
              const on = sort.key === col.key;
              return (
                <th key={col.key} className={`${col.cls}${on ? ' tt-sorted' : ''}`} title={col.title}>
                  <button type="button" className="tt-sortbtn" onClick={() => onSort(col.key)}>
                    <span>{col.label}</span>
                    <i className="tt-caret">{on ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</i>
                  </button>
                </th>
              );
            })}
          </tr>
          <tr className="tt-head-filters">
            {COLUMNS.map((col) => (
              <th key={col.key} className={col.cls}>
                <FilterCell
                  col={col}
                  filters={filters}
                  onFilter={onFilter}
                  semesters={semesters}
                  creditValues={creditValues}
                />
                {/* Review mode lives under What-if because that is the column
                    it orders by. Without the pin, a course you just raised to
                    an A sinks to the bottom of a worst-first list. */}
                {col.key === 'whatif' && (
                  <button
                    type="button"
                    className={`tt-review${changedFirst ? ' on' : ''}`}
                    onClick={onChangedFirst}
                    aria-pressed={changedFirst}
                    title="Order by lowest what-if grade first, and pin every course you have changed to the top"
                  >
                    ⇧ changed first{changedCount ? ` (${changedCount})` : ''}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="tt-empty" colSpan={COLUMNS.length}>No courses match these filters.</td></tr>
          )}
          {rows.map((c) => {
            const counted = isCounted(c, honorRepeats);
            const grade = gradeOf(c, overrides);
            const changed = !!overrides[c.id];
            const pts = counted ? table[grade] * c.credits : 0;
            const impact = impacts[c.id] || 0;
            return (
              <tr
                key={c.id}
                className={`${counted ? '' : 'tt-row-out '}${changed ? 'tt-row-changed ' : ''}${c.isExtra ? 'tt-row-extra' : ''}`}
              >
                <td className="tt-c-term">{c.semester}</td>
                <td className="tt-c-code">
                  {c.code}
                  {c.repeatFlag === 'E' && (
                    <span className="tt-flag tt-flag-e" title="Attempt superseded by a retake — excluded from GPA">excluded</span>
                  )}
                  {c.repeatFlag === 'I' && (
                    <span className="tt-flag tt-flag-i" title="The retake that counts toward GPA">retake</span>
                  )}
                </td>
                <td className="tt-c-title">
                  {c.course}
                  {c.attribute && <span className="tt-attr" title="General education attribute">{c.attribute}</span>}
                </td>
                <td className="tt-c-num">{c.credits.toFixed(2)}</td>
                <td className="tt-c-grade">
                  <span className={`tt-g tt-g-${band(c.grade)}`}>{c.grade}</span>
                </td>
                <td className="tt-c-what">
                  <select
                    className={`tt-sel tt-g-${band(grade)}${changed ? ' changed' : ''}`}
                    value={grade}
                    disabled={!counted}
                    onChange={(e) => onGrade(c.id, e.target.value === c.grade ? null : e.target.value)}
                    aria-label={`Hypothetical grade for ${c.code}`}
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g} className={`tt-g-${band(g)}`}>{g === 'E' ? 'E (fail)' : g}</option>
                    ))}
                  </select>
                  {changed && (
                    <button type="button" className="tt-undo" title={`Back to ${c.grade}`} onClick={() => onGrade(c.id, null)}>↺</button>
                  )}
                  {c.isExtra && (
                    <button type="button" className="tt-undo" title="Remove this planned course" onClick={() => onRemoveExtra(c.id)}>✕</button>
                  )}
                </td>
                <td className="tt-c-num">{counted ? pts.toFixed(2) : <span className="tt-dash" title="Excluded attempt — contributes no hours or points">—</span>}</td>
                <td className="tt-c-num">
                  {counted && impact > 0.0005
                    ? <span className="tt-impact">+{impact.toFixed(3)}</span>
                    : <span className="tt-dash">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
