import { Fragment, useState } from 'react';
import { SCALES, GRADES, REMOVED, isCounted, gradeOf } from './gpa';
import { COLUMNS } from './columns';
import { creditBreaks, bandOf, BAND_PROSPECTIVE, BAND_PLAIN } from './creditBlocks';

// Letter band of a GRADE (the 'B' of a B+), for the colour classes. Named in
// full because 'band' means a table section everywhere else in this file.
const gradeBand = (g) => (g || '').charAt(0);

// The sentinel the What-if dropdown uses for "put this back to the real grade".
// A distinct value rather than the actual grade because the two are not the
// same thing: picking B on a course that IS a B leaves it in the changed list
// as a no-op override, which is exactly what this option exists to undo.
const RESET = '__reset';

const fmtCr = (n) => (n % 1 ? n.toFixed(1) : String(n));

const BOUNDARY_LABEL = { extras: 'prospective below', rest: 'untouched below' };

function BreakRow({ mark }) {
  const pros = mark.kind === BAND_PROSPECTIVE;
  return (
    <tr className={`tt-break${pros ? ' tt-break-pros' : ''}${mark.boundary ? ' tt-break-end' : ''}`}>
      <td colSpan={COLUMNS.length}>
        <div className="tt-break-in">
          <span className="tt-break-rule" />
          {mark.credits != null && (
            <span className="tt-break-tag">
              {pros ? 'Prospective' : 'Retake'} {mark.block} · <strong>{fmtCr(mark.credits)}</strong> cr
            </span>
          )}
          {mark.boundary && (
            <span className="tt-break-tag tt-break-tag-end">{BOUNDARY_LABEL[mark.boundary]}</span>
          )}
          <span className="tt-break-rule" />
        </div>
      </td>
    </tr>
  );
}

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
            {GRADES.map((g) => <option key={g} value={g} className={`tt-g-${gradeBand(g)}`}>{g}</option>)}
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
  changedFirst, onChangedFirst, changedCount, creditBlock, showBlocks, onMoveRow,
}) {
  const table = SCALES[scale].points;
  const breaks = creditBreaks(rows, overrides, honorRepeats, showBlocks ? creditBlock : 0);

  // Native HTML5 drag. `drag` is armed by pressing the grip rather than set on
  // every row, so text selection and the grade dropdown still behave normally
  // everywhere else in the table.
  const [drag, setDrag] = useState(null);   // { id, band } being dragged
  const [over, setOver] = useState(null);   // { id, after } currently hovered
  const [armed, setArmed] = useState(null); // row id whose grip is held down

  const endDrag = () => { setDrag(null); setOver(null); setArmed(null); };

  function onRowDragOver(e, c, band) {
    if (!drag || band === BAND_PLAIN || band !== drag.band || c.id === drag.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const box = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > box.top + box.height / 2;
    if (over?.id !== c.id || over?.after !== after) setOver({ id: c.id, after });
  }

  function onRowDrop(e, c, band) {
    if (!drag || band !== drag.band || c.id === drag.id) return;
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    onMoveRow(drag.id, c.id, e.clientY > box.top + box.height / 2);
    endDrag();
  }

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
          {rows.map((c, i) => {
            const counted = isCounted(c, honorRepeats);
            const grade = gradeOf(c, overrides);
            const removed = grade === REMOVED;
            const shown = counted && !removed;
            const changed = !!overrides[c.id];
            const pts = shown ? table[grade] * c.credits : 0;
            const impact = impacts[c.id] || 0;
            const mark = breaks.get(i);
            const band = bandOf(c, overrides);
            const movable = band !== BAND_PLAIN;
            const isOver = over?.id === c.id && drag?.band === band;
            return (
              <Fragment key={c.id}>
              <tr
                /* A prospective class keeps its own blue tint even when its
                   assumed grade is edited — it is still a prospective class,
                   not a retake, and stacking both tints reads as neither. */
                className={[
                  shown ? '' : 'tt-row-out',
                  removed ? 'tt-row-removed' : '',
                  changed && !c.isExtra ? 'tt-row-changed' : '',
                  c.isExtra ? 'tt-row-extra' : '',
                  drag?.id === c.id ? 'tt-row-dragging' : '',
                  isOver ? (over.after ? 'tt-drop-below' : 'tt-drop-above') : '',
                ].filter(Boolean).join(' ')}
                draggable={movable && armed === c.id}
                onDragStart={(e) => {
                  setDrag({ id: c.id, band });
                  e.dataTransfer.effectAllowed = 'move';
                  // Firefox refuses to start a drag with an empty payload.
                  e.dataTransfer.setData('text/plain', c.id);
                }}
                onDragEnd={endDrag}
                onDragOver={(e) => onRowDragOver(e, c, band)}
                onDrop={(e) => onRowDrop(e, c, band)}
              >
                <td className="tt-c-term">
                  {movable && (
                    <span
                      className="tt-grip"
                      role="button"
                      tabIndex={-1}
                      aria-label={`Drag to reorder ${c.code}`}
                      title="Drag to reorder — a manual order overrides the column sort"
                      onMouseDown={() => setArmed(c.id)}
                      onMouseUp={() => setArmed(null)}
                    >⠿</span>
                  )}
                  {c.semester}
                </td>
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
                  <span className={`tt-g tt-g-${gradeBand(c.grade)}`}>{c.grade}</span>
                </td>
                <td className="tt-c-what">
                  <select
                    className={`tt-sel${removed ? ' tt-g-removed' : ` tt-g-${gradeBand(grade)}`}${changed ? ' changed' : ''}`}
                    value={grade}
                    disabled={!counted}
                    onChange={(e) => {
                      const v = e.target.value;
                      onGrade(c.id, v === RESET || v === c.grade ? null : v);
                    }}
                    aria-label={`Hypothetical grade for ${c.code}`}
                  >
                    {/* Only offered once there is something to undo, so the
                        list of an untouched course is just the grades. */}
                    {changed && <option value={RESET}>↺ Reset to {c.grade}</option>}
                    {GRADES.map((g) => (
                      <option key={g} value={g} className={`tt-g-${gradeBand(g)}`}>{g === 'E' ? 'E (fail)' : g}</option>
                    ))}
                    {/* Not a grade — drops the course from both the GPA hours
                        and the points, same as an excluded repeat attempt. */}
                    <option value={REMOVED} className="tt-g-removed">✕ Removed (as if it never happened)</option>
                  </select>
                  {changed && (
                    <button type="button" className="tt-undo" title={`Back to ${c.grade}`} onClick={() => onGrade(c.id, null)}>↺</button>
                  )}
                  {c.isExtra && (
                    <button type="button" className="tt-undo" title="Remove this planned course" onClick={() => onRemoveExtra(c.id)}>✕</button>
                  )}
                </td>
                <td className="tt-c-num">
                  {shown
                    ? pts.toFixed(2)
                    : (
                      <span className="tt-dash" title={removed ? 'Removed — contributes no hours or points' : 'Excluded attempt — contributes no hours or points'}>—</span>
                    )}
                </td>
                <td className="tt-c-num">
                  {shown && impact > 0.0005
                    ? <span className="tt-impact">+{impact.toFixed(3)}</span>
                    : <span className="tt-dash">—</span>}
                </td>
              </tr>
              {mark && <BreakRow mark={mark} />}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
