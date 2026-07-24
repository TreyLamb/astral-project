import { useMemo, useRef, useState } from 'react';
import { MOCK_AREAS, MOCK_TASKS, TODAY } from '../mockData';
import './MatrixMock.css';

const AREAS_BY_ID = Object.fromEntries(MOCK_AREAS.map(a => [a.id, a]));

// a live prioritization matrix is for open work — done/killed tasks would
// just be dead weight cluttering every quadrant
const ACTIVE_TASKS = MOCK_TASKS.filter(t => t.status === 'todo' || t.status === 'doing');
const HIDDEN_COUNT = MOCK_TASKS.length - ACTIVE_TASKS.length;

const AXIS_MIN = 1;
const AXIS_MAX = 5;
const PLOT_INSET = 8; // % inset each side so a dot at value 1 or 5 doesn't clip

const QUADRANT_KEYS = ['tl', 'tr', 'bl', 'br'];

const AXIS_CONFIG = {
  eisenhower: {
    xKey: 'urgency',
    xShort: 'Urgency',
    xLabel: 'Urgency',
    quadrants: { tl: 'Schedule', tr: 'Do First', bl: 'Eliminate', br: 'Delegate' },
    quadrantPriority: { tr: 0, tl: 1, br: 2, bl: 3 },
  },
  actionPriority: {
    xKey: 'effort',
    xShort: 'Effort',
    xLabel: 'Effort (low is the easy side)',
    quadrants: { tl: 'Quick Wins', tr: 'Major Projects', bl: 'Fill-ins', br: 'Thankless Tasks' },
    quadrantPriority: { tl: 0, tr: 1, bl: 2, br: 3 },
  },
};

const MODES = [
  { id: 'weighted', label: 'Weighted (continuous)' },
  { id: 'dueUrgency', label: 'Due-urgency (2-axis)' },
  { id: 'quadrant', label: 'Quadrant buckets' },
];

const clamp01 = v => Math.min(1, Math.max(0, v));
const clampAxis = v => Math.min(AXIS_MAX, Math.max(AXIS_MIN, v));
const round0_5 = v => Math.round(v * 2) / 2;

function valueToPercent(value, invert = false) {
  const t = (value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
  const pct = PLOT_INSET + t * (100 - PLOT_INSET * 2);
  return invert ? 100 - pct : pct;
}

function fracToValue(frac, invert = false) {
  const effectiveFrac = invert ? 1 - frac : frac;
  const pct = effectiveFrac * 100;
  const t = clamp01((pct - PLOT_INSET) / (100 - PLOT_INSET * 2));
  return round0_5(clampAxis(AXIS_MIN + t * (AXIS_MAX - AXIS_MIN)));
}

function daysUntil(dateStr) {
  return Math.round((new Date(dateStr) - new Date(TODAY)) / 86400000);
}

// no due date reads as "least urgent"; overdue caps the scale so an overdue
// task can never be out-argued by one that's merely close but not passed
function computeDueUrgency(dueDate) {
  if (!dueDate) return 1;
  const days = daysUntil(dueDate);
  if (days <= 0) return 5;
  if (days <= 2) return 4.5;
  if (days <= 5) return 4;
  if (days <= 10) return 3;
  if (days <= 20) return 2;
  return 1.5;
}

function isOverdue(task) {
  return Boolean(task.dueDate) && task.dueDate < TODAY;
}

function initialQuadrant(task, variant) {
  const xVal = variant === 'eisenhower' ? task.urgency : task.effort;
  const highImportance = task.importance >= 3;
  const highX = xVal >= 3;
  if (variant === 'eisenhower') {
    if (highImportance && highX) return 'tr';
    if (highImportance && !highX) return 'tl';
    if (!highImportance && highX) return 'br';
    return 'bl';
  }
  if (highImportance && !highX) return 'tl';
  if (highImportance && highX) return 'tr';
  if (!highImportance && !highX) return 'bl';
  return 'br';
}

function buildInitialTasks(variant) {
  const xKey = AXIS_CONFIG[variant]?.xKey ?? 'urgency';
  return ACTIVE_TASKS.map(t => ({
    ...t,
    importanceV: t.importance,
    xV: t[xKey],
    quadrant: initialQuadrant(t, variant),
  }));
}

// score always wants real importance/urgency/effort — whichever of urgency
// or effort isn't this variant's draggable x-axis still feeds the score from
// its original mock value, it just isn't visualized as a position here
function computeScore(task, variant, mode) {
  const isEisenhower = variant === 'eisenhower';
  const importance = task.importanceV;
  const urgency = isEisenhower
    ? (mode === 'dueUrgency' ? computeDueUrgency(task.dueDate) : task.xV)
    : task.urgency;
  const effort = isEisenhower ? task.effort : task.xV;
  return 2 * importance + 2 * urgency - effort;
}

function legendFor(mode, axisConfig) {
  if (mode === 'weighted') {
    return `Drag a task anywhere — Importance and ${axisConfig.xShort} both become continuous 1-5 values. Most expressive model, but every task needs two judgment calls to place.`;
  }
  if (mode === 'dueUrgency') {
    return `Importance is still yours to drag; ${axisConfig.xShort} is computed from each task's due date — nearer deadlines land further right automatically. Can't drift out of sync with reality, but only works where a date exists.`;
  }
  return `Drop a task into ${Object.values(axisConfig.quadrants).join(', ')}. Fastest to sort, but everything sharing a box is tied — no ordering inside it.`;
}

function ScatterPlot({ tasks, axisConfig, mode, onDrag, draggingId, setDraggingId }) {
  const plotRef = useRef(null);

  const valuesFromPointer = (clientX, clientY) => {
    const rect = plotRef.current.getBoundingClientRect();
    const xFrac = clamp01((clientX - rect.left) / rect.width);
    const yFrac = clamp01((clientY - rect.top) / rect.height);
    return { xVal: fracToValue(xFrac), impVal: fracToValue(yFrac, true) };
  };

  const applyDrag = (e, taskId) => {
    const { xVal, impVal } = valuesFromPointer(e.clientX, e.clientY);
    onDrag(taskId, mode === 'dueUrgency' ? { importanceV: impVal } : { importanceV: impVal, xV: xVal });
  };

  const handlePointerDown = (e, taskId) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(taskId);
    applyDrag(e, taskId);
  };

  const handleKeyDown = (e, taskId, currentX, currentImp) => {
    const step = 0.5;
    let patch = null;
    if (e.key === 'ArrowUp') patch = { importanceV: clampAxis(currentImp + step) };
    else if (e.key === 'ArrowDown') patch = { importanceV: clampAxis(currentImp - step) };
    else if (e.key === 'ArrowRight' && mode !== 'dueUrgency') patch = { xV: clampAxis(currentX + step) };
    else if (e.key === 'ArrowLeft' && mode !== 'dueUrgency') patch = { xV: clampAxis(currentX - step) };
    if (patch) { e.preventDefault(); onDrag(taskId, patch); }
  };

  return (
    <div className="orb-matrix-plot" ref={plotRef}>
      <div className="orb-matrix-gridline orb-matrix-gridline-v" />
      <div className="orb-matrix-gridline orb-matrix-gridline-h" />

      <span className="orb-matrix-qlabel orb-matrix-qlabel-tl">{axisConfig.quadrants.tl}</span>
      <span className="orb-matrix-qlabel orb-matrix-qlabel-tr">{axisConfig.quadrants.tr}</span>
      <span className="orb-matrix-qlabel orb-matrix-qlabel-bl">{axisConfig.quadrants.bl}</span>
      <span className="orb-matrix-qlabel orb-matrix-qlabel-br">{axisConfig.quadrants.br}</span>

      <span className="orb-matrix-axislabel orb-matrix-axislabel-top">High Importance</span>
      <span className="orb-matrix-axislabel orb-matrix-axislabel-bottom">Low Importance</span>
      <span className="orb-matrix-axislabel orb-matrix-axislabel-left">Low {axisConfig.xShort}</span>
      <span className="orb-matrix-axislabel orb-matrix-axislabel-right">High {axisConfig.xShort}</span>

      {tasks.map(t => {
        const xVal = mode === 'dueUrgency' ? computeDueUrgency(t.dueDate) : t.xV;
        const left = valueToPercent(xVal);
        const top = valueToPercent(t.importanceV, true);
        const overdue = isOverdue(t);
        const dragging = draggingId === t.id;
        const area = AREAS_BY_ID[t.areaId];
        return (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            aria-label={`${t.title} — drag or use arrow keys to reprioritize`}
            className={[
              'orb-matrix-dot',
              overdue && 'orb-matrix-dot-warn',
              dragging && 'orb-matrix-dot-dragging',
              mode === 'dueUrgency' && 'orb-matrix-dot-vonly',
            ].filter(Boolean).join(' ')}
            style={{ left: `${left}%`, top: `${top}%`, '--orb-chip-color': area?.color }}
            title={t.title}
            onPointerDown={e => handlePointerDown(e, t.id)}
            onPointerMove={e => applyDrag(e, t.id)}
            onPointerUp={() => setDraggingId(null)}
            onPointerCancel={() => setDraggingId(null)}
            onKeyDown={e => handleKeyDown(e, t.id, t.xV, t.importanceV)}
          >
            <span className="orb-matrix-dot-mark" />
            <span className="orb-matrix-dot-label">{t.title}</span>
            {dragging && (
              <span className="orb-matrix-dot-readout">
                Imp {t.importanceV.toFixed(1)} · {axisConfig.xShort} {xVal.toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuadrantBoard({ tasks, axisConfig, onDrop }) {
  const [hoverKey, setHoverKey] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);

  const byQuadrant = QUADRANT_KEYS.reduce((acc, key) => {
    acc[key] = tasks.filter(t => t.quadrant === key);
    return acc;
  }, {});

  const panelAt = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    return el && el.closest('[data-quadrant-key]');
  };

  const handlePointerDown = (e, taskId) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragTaskId(taskId);
  };
  const handlePointerMove = e => {
    const panel = panelAt(e.clientX, e.clientY);
    setHoverKey(panel ? panel.dataset.quadrantKey : null);
  };
  const handlePointerUp = (e, taskId) => {
    const panel = panelAt(e.clientX, e.clientY);
    if (panel) onDrop(taskId, panel.dataset.quadrantKey);
    setDragTaskId(null);
    setHoverKey(null);
  };
  const handleKeyDown = (e, taskId, currentKey) => {
    const idx = QUADRANT_KEYS.indexOf(currentKey);
    let nextIdx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = (idx + 1) % QUADRANT_KEYS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = (idx - 1 + QUADRANT_KEYS.length) % QUADRANT_KEYS.length;
    if (nextIdx !== null) { e.preventDefault(); onDrop(taskId, QUADRANT_KEYS[nextIdx]); }
  };

  return (
    <div className="orb-matrix-board">
      {QUADRANT_KEYS.map(key => (
        <div
          key={key}
          data-quadrant-key={key}
          className={`orb-matrix-panel${hoverKey === key ? ' orb-matrix-panel-hover' : ''}`}
        >
          <div className="orb-matrix-panel-head">
            <span className="orb-matrix-panel-title">{axisConfig.quadrants[key]}</span>
            <span className="orb-matrix-panel-count">{byQuadrant[key].length}</span>
          </div>
          <div className="orb-matrix-panel-list">
            {byQuadrant[key].length === 0 && <p className="orb-matrix-panel-empty">Drop a task here</p>}
            {byQuadrant[key].map(t => {
              const area = AREAS_BY_ID[t.areaId];
              const overdue = isOverdue(t);
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t.title} — drag or use arrow keys to move to another quadrant`}
                  className={[
                    'orb-matrix-chip',
                    overdue && 'orb-matrix-chip-warn',
                    dragTaskId === t.id && 'orb-matrix-chip-dragging',
                  ].filter(Boolean).join(' ')}
                  style={{ '--orb-chip-color': area?.color }}
                  title={t.title}
                  onPointerDown={e => handlePointerDown(e, t.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={e => handlePointerUp(e, t.id)}
                  onPointerCancel={e => handlePointerUp(e, t.id)}
                  onKeyDown={e => handleKeyDown(e, t.id, t.quadrant)}
                >
                  <span className="orb-chip-dot" />
                  <span className="orb-matrix-chip-title">{t.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedList({ tasks, mode, axisConfig }) {
  const items = mode === 'quadrant'
    ? [...tasks].sort((a, b) => {
        const rankDiff = axisConfig.quadrantPriority[a.quadrant] - axisConfig.quadrantPriority[b.quadrant];
        return rankDiff !== 0 ? rankDiff : b.score - a.score;
      })
    : [...tasks].sort((a, b) => b.score - a.score);

  return (
    <aside className="orb-matrix-ranked">
      <h3 className="orb-matrix-ranked-title">{mode === 'quadrant' ? 'Priority order' : 'Today score'}</h3>
      <p className="orb-matrix-ranked-note">
        {mode === 'quadrant'
          ? 'Grouped by quadrant, highest-priority box first — no numeric score in this model.'
          : '2 × importance + 2 × urgency − effort, live as you drag.'}
      </p>
      <ol className="orb-matrix-ranked-list">
        {items.map((t, i) => {
          const area = AREAS_BY_ID[t.areaId];
          const overdue = isOverdue(t);
          return (
            <li key={t.id} className={`orb-matrix-ranked-item${overdue ? ' orb-matrix-ranked-item-warn' : ''}`}>
              <span className="orb-matrix-rank-num">{i + 1}</span>
              <span className="orb-chip-dot" style={{ '--orb-chip-color': area?.color }} />
              <span className="orb-matrix-rank-title">{t.title}</span>
              {mode === 'quadrant'
                ? <span className="orb-matrix-rank-badge">{axisConfig.quadrants[t.quadrant]}</span>
                : <span className="orb-matrix-rank-score">{t.score.toFixed(1)}</span>}
              {overdue && <span className="orb-matrix-rank-flag">overdue</span>}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default function MatrixMock({ variant }) {
  const isEisenhower = variant === 'eisenhower';
  const axisConfig = AXIS_CONFIG[variant] ?? AXIS_CONFIG.eisenhower;

  const [mode, setMode] = useState('weighted');
  const [tasks, setTasks] = useState(() => buildInitialTasks(variant));
  const [draggingId, setDraggingId] = useState(null);

  // the toggle button is disabled for this variant so mode can't actually
  // reach 'dueUrgency' here, but derive rather than trust stale state anyway
  const effectiveMode = mode === 'dueUrgency' && !isEisenhower ? 'weighted' : mode;

  const handleAxisDrag = (taskId, patch) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...patch } : t)));
  };
  const handleQuadrantDrop = (taskId, quadrantKey) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, quadrant: quadrantKey } : t)));
  };

  const scoredTasks = useMemo(
    () => tasks.map(t => ({ ...t, score: computeScore(t, variant, effectiveMode) })),
    [tasks, variant, effectiveMode],
  );

  return (
    <div className="orb-matrix">
      <div className="orb-matrix-head">
        <div className="orb-matrix-heading">
          <h2 className="orb-matrix-title">{isEisenhower ? 'Eisenhower Matrix' : 'Action-Priority Matrix'}</h2>
          <p className="orb-matrix-sub">
            Importance × {axisConfig.xLabel} · {ACTIVE_TASKS.length} open tasks
            {HIDDEN_COUNT ? ` · ${HIDDEN_COUNT} done/killed hidden` : ''}
          </p>
        </div>
        <div className="orb-matrix-modes" role="tablist" aria-label="Granularity model">
          {MODES.map(m => {
            const disabled = m.id === 'dueUrgency' && !isEisenhower;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={effectiveMode === m.id}
                className={`orb-btn orb-matrix-mode-btn${effectiveMode === m.id ? ' active' : ''}`}
                disabled={disabled}
                title={disabled ? "Not available on Action-Priority — effort isn't derived from a date" : undefined}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="orb-matrix-legend">{legendFor(effectiveMode, axisConfig)}</p>

      <div className="orb-matrix-body">
        {effectiveMode === 'quadrant' ? (
          <QuadrantBoard tasks={scoredTasks} axisConfig={axisConfig} onDrop={handleQuadrantDrop} />
        ) : (
          <ScatterPlot
            tasks={scoredTasks}
            axisConfig={axisConfig}
            mode={effectiveMode}
            onDrag={handleAxisDrag}
            draggingId={draggingId}
            setDraggingId={setDraggingId}
          />
        )}
        <RankedList tasks={scoredTasks} mode={effectiveMode} axisConfig={axisConfig} />
      </div>
    </div>
  );
}
