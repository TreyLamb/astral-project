import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import trainingMd from './runningworkouts/training.md?raw';
import trainingContextMd from './runningworkouts/training-context.md?raw';
import cycleMd from './runningworkouts/cycle.md?raw';
import acft2MileMd from './runningworkouts/acft-2mile-training-plan.md?raw';
import acftCalendarMd from './runningworkouts/acft-full-calendar.md?raw';
import cycleProjectionMd from './runningworkouts/cycleProjection.md?raw';
import officerRanksMd from './runningworkouts/usMilitaryOfficerRanks.md?raw';
import './WorkoutDocsView.css';

// `?raw` is a Vite-native import (no config needed) — pulls the file's text in
// at build time, bundled as a string. These docs are table-heavy (pace charts,
// per-cycle calendars), so this uses a real markdown renderer (remark-gfm for
// GFM tables) rather than Orbit's hand-rolled markdown-lite, which only
// supports bold/italic/links/lists and would mangle headers/tables/hr.
//
// splitSessions: true opts a doc's "Session" table column into the
// double-workout-day treatment below (markDoubleSessionDays + TdCell) — only
// the two CURRENT docs (training.md, and cycle.md which it points to as the
// canonical template) get it. The ACFT "(old)" docs' Session columns also use
// "+" for single-session detail joins (e.g. "Speed Day 1 — strides + relaxed
// 400s"), which isn't a double-workout-day and would be mis-split, so those
// are deliberately left alone.
const DOCS = [
  { slug: 'training', label: 'Training Plan', content: trainingMd, splitSessions: true },
  { slug: 'context', label: 'Context & Rules', content: trainingContextMd },
  { slug: 'cycle', label: 'Cycle Template (old)', content: cycleMd, splitSessions: true },
  // Long-range projection of both cycle lengths. Its Session-ish columns are
  // prose, not the " + "-joined session lists markDoubleSessionDays parses,
  // so no splitSessions here.
  { slug: 'projection', label: 'Projection to 2027', content: cycleProjectionMd },
  { slug: '2mile', label: 'ACFT 2-Mile Plan (old)', content: acft2MileMd },
  { slug: 'calendar', label: 'ACFT Full Calendar (old)', content: acftCalendarMd },
  // Reference material rather than a training plan — no session column, so no
  // splitSessions. compact:true sizes the table to its own text (see the CSS).
  { slug: 'ranks', label: 'Officer Ranks', content: officerRanksMd, compact: true },
];

function TableWrap({ children }) {
  return <div className="ft-docs-table-wrap"><table>{children}</table></div>;
}

// Marks a multi-workout day so TdCell (below) can render it as N distinct
// session chips instead of one undifferentiated line — a markdown-source
// preprocess, not a change to the .md files themselves (those belong to a
// different agent's scope — see WorkoutDocsView's owning agent notes).
// Header-aware (finds the "Session" column by name per table) rather than a
// fixed column index, since training.md's table is 4 columns and cycle.md's
// is 2 — and header-scoped rather than a blind global " + " replace, since
// the Workout/detail columns also legitimately use "+" to join reps
// ("WU 1mi + 5x400m + CD 0.5mi") and must not be touched. Replaces EVERY
// " + " in the cell (not just the first) — some days now stack three
// sessions ("Easy + Lift A + Ab Circuit A"), not just two.
const SESSION_SPLIT_SENTINEL = '␟';
function markDoubleSessionDays(md) {
  let sessionColIdx = null;
  return md.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) { sessionColIdx = null; return line; }
    const cells = trimmed.split('|');
    const headerIdx = cells.findIndex((c) => c.trim().toLowerCase() === 'session');
    if (headerIdx !== -1) { sessionColIdx = headerIdx; return line; }
    const isDivider = cells.every((c) => c.trim() === '' || /^:?-+:?$/.test(c.trim()));
    if (isDivider || sessionColIdx == null) return line;
    const raw = line.split('|');
    const cell = raw[sessionColIdx];
    if (!cell || !cell.includes(' + ')) return line;
    raw[sessionColIdx] = cell.split(' + ').join(` ${SESSION_SPLIT_SENTINEL} `);
    return raw.join('|');
  }).join('\n');
}

function flattenText(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node.props?.children != null) return flattenText(node.props.children);
  return '';
}

// Splits a td's rendered children (a mix of plain strings and elements like
// <strong>Lift A</strong>) into N groups at every sentinel, without losing
// the bold formatting on any of them. A single string child can itself carry
// more than one sentinel ("Speed 2 ␟ light ab"), so this walks every child
// rather than just locating one split point.
function splitAllOnSentinel(children) {
  const arr = Array.isArray(children) ? children : [children];
  const groups = [[]];
  let found = false;
  for (const child of arr) {
    if (typeof child === 'string' && child.includes(SESSION_SPLIT_SENTINEL)) {
      found = true;
      child.split(SESSION_SPLIT_SENTINEL).forEach((piece, i) => {
        if (i > 0) groups.push([]);
        if (piece !== '') groups[groups.length - 1].push(piece);
      });
    } else {
      groups[groups.length - 1].push(child);
    }
  }
  return found ? groups : null;
}

// lift / ab-core / run(-or-rest) covers every session kind the source data
// currently produces. The kind drives the chip's COLOUR only — there used to be
// a pictogram per chip (a runner beside "Full rest", a weightlifter beside
// "Lift A"), which was decoration on top of text that already said it.
function sessionKind(text) {
  if (/lift/i.test(text)) return 'lift';
  if (/ab circuit|ab\/core|\bab\b/i.test(text)) return 'core';
  return 'run';
}

function SessionChip({ children }) {
  const kind = sessionKind(flattenText(children));
  return (
    <div className={`ft-docs-session-chip ft-docs-session-${kind}`}>
      <span className="ft-docs-session-label">{children}</span>
    </div>
  );
}

function TdCell({ children, ...props }) {
  const groups = splitAllOnSentinel(children);
  if (!groups) return <td {...props}>{children}</td>;
  return (
    <td {...props} className="ft-docs-double-td">
      <div className="ft-docs-double-cell">
        <span className="ft-docs-double-badge" title={`${groups.length} sessions this day`}>{groups.length}×</span>
        {groups.map((group, i) => (
          <div key={i} className="ft-docs-session-group">
            {i > 0 && <div className="ft-docs-session-divider" aria-hidden="true" />}
            <SessionChip>{group}</SessionChip>
          </div>
        ))}
      </div>
    </td>
  );
}

export default function WorkoutDocsView() {
  const [activeSlug, setActiveSlug] = useState(DOCS[0].slug);
  const active = DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0];
  const content = active.splitSessions ? markDoubleSessionDays(active.content) : active.content;

  return (
    <div className={`ft-docs${active.compact ? ' ft-docs-compact' : ''}`}>
      <nav className="ft-docs-tabs" role="tablist" aria-label="Workout plan documents">
        {DOCS.map((d) => (
          <button
            key={d.slug}
            type="button"
            role="tab"
            aria-selected={d.slug === activeSlug}
            className={`ft-docs-tab${d.slug === activeSlug ? ' active' : ''}`}
            onClick={() => setActiveSlug(d.slug)}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <div className="ft-docs-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap, td: TdCell }}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}