import { useMemo, useRef, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { isOverdue, hasOpenChildren } from '../calc/priority';
import './MatrixView.css';

const AXIS_MIN = 1;
const AXIS_MAX = 5;
const PLOT_INSET = 8; // % inset each side so a dot at value 1 or 5 doesn't clip

const VARIANTS = {
  eisenhower: {
    id: 'eisenhower',
    label: 'Eisenhower',
    xLabel: 'Urgency',
    quadrants: { tl: 'Schedule', tr: 'Do First', bl: 'Eliminate', br: 'Delegate' },
  },
  actionPriority: {
    id: 'actionPriority',
    label: 'Action-Priority',
    xLabel: 'Cost',
    quadrants: { tl: 'Quick Wins', tr: 'Major Projects', bl: 'Fill-ins', br: 'Thankless Tasks' },
  },
};

// Real fields are ints 1-5 (see orbitConfig.js) — unlike the exploration
// mock's continuous 0.5-step scatter, drags here always round to a whole
// number before hitting updateTask.
const clampAxis = (v) => Math.min(AXIS_MAX, Math.max(AXIS_MIN, Math.round(v)));
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function valueToPercent(value, invert = false) {
  const t = (value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
  const pct = PLOT_INSET + t * (100 - PLOT_INSET * 2);
  return invert ? 100 - pct : pct;
}
function fracToValue(frac, invert = false) {
  const effectiveFrac = invert ? 1 - frac : frac;
  const pct = effectiveFrac * 100;
  const t = clamp01((pct - PLOT_INSET) / (100 - PLOT_INSET * 2));
  return clampAxis(AXIS_MIN + t * (AXIS_MAX - AXIS_MIN));
}

// There's no stored `effort` field anymore — Action-Priority's x-axis is a
// derived "cost" = round((difficulty+energy)/2), and a drag on this axis
// writes the SAME value back to both difficulty and energy (per spec: no way
// to split one continuous axis back into two independent int fields, so a
// drag sets them equal).
function costOf(task) {
  return clampAxis((task.difficulty + task.energy) / 2);
}
function xValueOf(task, variantId) {
  return variantId === 'eisenhower' ? task.urgency : costOf(task);
}

// Real Eisenhower / Action-Priority: importance (y) is always the vertical
// axis; the horizontal axis swaps between urgency and the difficulty/energy
// cost stand-in via the variant toggle. Deliberately just one continuous
// weighted mode (no quadrant-bucket / due-urgency granularity toggle like
// the mock) — see CLAUDE.md task note: "simpler than the 3-model mock".
export default function MatrixView() {
  const { tasks, areas, settings, today, updateTask } = useOrbit();
  const [variantId, setVariantId] = useState('eisenhower');
  const [drag, setDrag] = useState(null); // { id, impVal, xVal } — transient drag preview only, never persisted mid-drag
  const plotRef = useRef(null);

  const variant = VARIANTS[variantId];
  const areaById = (id) => areas.find((a) => a.id === id);

  // A live prioritization matrix is for open work — done/killed would just
  // be dead weight cluttering every quadrant.
  const activeTasks = useMemo(
    () => tasks.filter((t) => (t.status === 'todo' || t.status === 'doing') && !hasOpenChildren(t, tasks)),
    [tasks],
  );
  const hiddenCount = tasks.length - activeTasks.length;

  const ranked = useMemo(() => [...activeTasks].sort((a, b) => b.priorityScore - a.priorityScore), [activeTasks]);

  const valuesFromPointer = (clientX, clientY) => {
    const rect = plotRef.current.getBoundingClientRect();
    const xFrac = clamp01((clientX - rect.left) / rect.width);
    const yFrac = clamp01((clientY - rect.top) / rect.height);
    return { xVal: fracToValue(xFrac), impVal: fracToValue(yFrac, true) };
  };

  const startDrag = (e, task) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: task.id, ...valuesFromPointer(e.clientX, e.clientY) });
  };
  const moveDrag = (e, task) => {
    if (!drag || drag.id !== task.id) return;
    setDrag({ id: task.id, ...valuesFromPointer(e.clientX, e.clientY) });
  };
  // Mutation lands on drop (not every pointermove) — same "drag is transient
  // local UI, drop is what persists" contract as BoardView/ScheduleView.
  const commitDrag = (task) => {
    if (!drag || drag.id !== task.id) return;
    if (variantId === 'eisenhower') updateTask(task.id, { importance: drag.impVal, urgency: drag.xVal });
    else updateTask(task.id, { importance: drag.impVal, difficulty: drag.xVal, energy: drag.xVal });
    setDrag(null);
  };
  const cancelDrag = () => setDrag(null);

  const nudge = (task, dImp, dX) => {
    const impVal = clampAxis(task.importance + dImp);
    const xVal = clampAxis(xValueOf(task, variantId) + dX);
    if (variantId === 'eisenhower') updateTask(task.id, { importance: impVal, urgency: xVal });
    else updateTask(task.id, { importance: impVal, difficulty: xVal, energy: xVal });
  };
  const handleKeyDown = (e, task) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(task, 1, 0); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); nudge(task, -1, 0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(task, 0, 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(task, 0, -1); }
  };

  return (
    <div className="orb-mtx">
      <div className="orb-mtx-head">
        <div>
          <h2 className="orb-mtx-title">{variant.label} Matrix</h2>
          <p className="orb-mtx-sub">
            Importance × {variant.xLabel} · {activeTasks.length} open task{activeTasks.length === 1 ? '' : 's'}
            {hiddenCount ? ` · ${hiddenCount} done/killed hidden` : ''}
          </p>
        </div>
        <div className="orb-mtx-variants" role="tablist" aria-label="Matrix variant">
          {Object.values(VARIANTS).map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={variantId === v.id}
              className={`orb-tab${variantId === v.id ? ' active' : ''}`}
              onClick={() => setVariantId(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="orb-mtx-body">
        <div className="orb-mtx-plot" ref={plotRef}>
          <div className="orb-mtx-gridline orb-mtx-gridline-v" />
          <div className="orb-mtx-gridline orb-mtx-gridline-h" />

          <span className="orb-mtx-qlabel orb-mtx-qlabel-tl">{variant.quadrants.tl}</span>
          <span className="orb-mtx-qlabel orb-mtx-qlabel-tr">{variant.quadrants.tr}</span>
          <span className="orb-mtx-qlabel orb-mtx-qlabel-bl">{variant.quadrants.bl}</span>
          <span className="orb-mtx-qlabel orb-mtx-qlabel-br">{variant.quadrants.br}</span>

          <span className="orb-mtx-axislabel orb-mtx-axislabel-top">High Importance</span>
          <span className="orb-mtx-axislabel orb-mtx-axislabel-bottom">Low Importance</span>
          <span className="orb-mtx-axislabel orb-mtx-axislabel-left">Low {variant.xLabel}</span>
          <span className="orb-mtx-axislabel orb-mtx-axislabel-right">High {variant.xLabel}</span>

          {activeTasks.length === 0 && <div className="orb-mtx-plot-empty">No open tasks to plot</div>}

          {activeTasks.map((t) => {
            const dragging = drag?.id === t.id;
            const impVal = dragging ? drag.impVal : t.importance;
            const xVal = dragging ? drag.xVal : xValueOf(t, variantId);
            const left = valueToPercent(xVal);
            const top = valueToPercent(impVal, true);
            const area = areaById(t.areaId);
            const overdue = isOverdue(t, today);
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                aria-label={`${t.title} — drag or use arrow keys to reprioritize`}
                className={`orb-mtx-dot${overdue ? ' orb-mtx-dot-warn' : ''}${dragging ? ' orb-mtx-dot-dragging' : ''}`}
                style={{ left: `${left}%`, top: `${top}%`, '--orb-chip-color': area?.color }}
                title={t.title}
                onPointerDown={(e) => startDrag(e, t)}
                onPointerMove={(e) => moveDrag(e, t)}
                onPointerUp={() => commitDrag(t)}
                onPointerCancel={cancelDrag}
                onKeyDown={(e) => handleKeyDown(e, t)}
              >
                <span className="orb-mtx-dot-mark" />
                <span className="orb-mtx-dot-label">{t.title}</span>
                {dragging && (
                  <span className="orb-mtx-dot-readout">Imp {impVal} · {variant.xLabel} {xVal}</span>
                )}
              </div>
            );
          })}
        </div>

        <aside className="orb-mtx-ranked">
          <h3 className="orb-mtx-ranked-title">Priority score</h3>
          <p className="orb-mtx-ranked-note">
            {settings.importanceWeight}×importance + {settings.urgencyWeight}×urgency − {settings.costWeight}×cost
            (Settings' weights), live as you drag.
          </p>
          <ol className="orb-mtx-ranked-list">
            {ranked.map((t, i) => {
              const area = areaById(t.areaId);
              const overdue = isOverdue(t, today);
              return (
                <li key={t.id} className={`orb-mtx-ranked-item${overdue ? ' orb-mtx-ranked-item-warn' : ''}`}>
                  <span className="orb-mtx-rank-num">{i + 1}</span>
                  <span className="orb-chip-dot" style={{ '--orb-chip-color': area?.color }} />
                  <span className="orb-mtx-rank-title">{t.title}</span>
                  <span className="orb-mtx-rank-score">{t.priorityScore.toFixed(1)}</span>
                  {overdue && <span className="orb-mtx-rank-flag">overdue</span>}
                </li>
              );
            })}
            {ranked.length === 0 && <li className="orb-mtx-ranked-empty">No open tasks</li>}
          </ol>
        </aside>
      </div>
    </div>
  );
}
