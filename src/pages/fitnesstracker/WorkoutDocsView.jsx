import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import trainingMd from './runningworkouts/training.md?raw';
import trainingPushupsMd from './runningworkouts-derived/training-with-pushups.md?raw';
import trainingContextMd from './runningworkouts/training-context.md?raw';
import cycleMd from './runningworkouts/cycle.md?raw';
import pfra2MileMd from './runningworkouts/pfra-2mile-training-plan.md?raw';
import pfraCalendarMd from './runningworkouts/pfra-full-calendar.md?raw';
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
// canonical template) get it. The "(old)" docs' Session columns also use
// "+" for single-session detail joins (e.g. "Speed Day 1 — strides + relaxed
// 400s"), which isn't a double-workout-day and would be mis-split, so those
// are deliberately left alone.
const DOCS = [
  { slug: 'training', label: 'Training Plan', content: trainingMd, splitSessions: true },
  // Derived mirror of training.md with the daily pushup schedule bolted on.
  // Sits in runningworkouts-derived/ (a sibling folder) so the generator can
  // rewrite it without touching the authoritative running docs.
  { slug: 'pushups', label: 'Training + Pushups', content: trainingPushupsMd, splitSessions: true },
  { slug: 'context', label: 'Context & Rules', content: trainingContextMd },
  { slug: 'cycle', label: 'Cycle Template (old)', content: cycleMd, splitSessions: true },
  // Long-range projection of both cycle lengths. Its Session-ish columns are
  // prose, not the " + "-joined session lists markDoubleSessionDays parses,
  // so no splitSessions here.
  { slug: 'projection', label: 'Projection to 2027', content: cycleProjectionMd },
  { slug: '2mile', label: 'PFRA 2-Mile Plan (old)', content: pfra2MileMd },
  { slug: 'calendar', label: 'PFRA Full Calendar (old)', content: pfraCalendarMd },
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

// ---- section splitting, zoom, copy -------------------------------------

// Splits a doc at its top-level "## " headings so each section gets its own
// copy button. Everything before the first heading (title + preamble) becomes
// section 0 with no heading. "### " can't match here since the third char is
// "#", not a space. Fenced code is tracked so a "## " inside a fence is not
// mistaken for a heading.
function splitSections(md) {
  const out = [];
  let cur = [];
  let heading = null;
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line)) {
      if (cur.length) out.push({ heading, source: cur.join('\n').trim() });
      heading = line.replace(/^##\s+/, '').trim();
      cur = [line];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) out.push({ heading, source: cur.join('\n').trim() });
  return out.filter((s) => s.source !== '');
}

const ZOOM_KEY = 'ft.docs.zoom';
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 10) / 10));

function readZoom() {
  const raw = Number(localStorage.getItem(ZOOM_KEY));
  return Number.isFinite(raw) && raw >= ZOOM_MIN && raw <= ZOOM_MAX ? raw : 1;
}

// Copies the markdown SOURCE, not the rendered DOM. Selecting a rendered table
// and hitting ctrl-C pastes the cells as one run-on line with the column
// structure gone — which is what made these docs feel un-copyable. The source
// pastes back as a real table anywhere that renders markdown, and stays
// readable as aligned pipes anywhere that doesn't.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // navigator.clipboard needs a secure context — fall back so this still
    // works over plain http, e.g. hitting the dev server from a phone on the LAN.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

function CopyButton({ text, label, title, className = '' }) {
  const [state, setState] = useState('idle');
  return (
    <button
      type="button"
      className={`ft-docs-copy ${className} ${state}`.trim()}
      title={title}
      onClick={async () => {
        const ok = await copyText(text);
        setState(ok ? 'done' : 'fail');
        setTimeout(() => setState('idle'), 1600);
      }}
    >
      {state === 'done' ? '\u2713 Copied' : state === 'fail' ? 'Copy failed' : label}
    </button>
  );
}

export default function WorkoutDocsView() {
  const [activeSlug, setActiveSlug] = useState(DOCS[0].slug);
  const [zoom, setZoom] = useState(readZoom);
  const active = DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0];
  const sections = useMemo(() => splitSections(active.content), [active.content]);

  useEffect(() => { localStorage.setItem(ZOOM_KEY, String(zoom)); }, [zoom]);

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

      <div className="ft-docs-toolbar">
        <div className="ft-docs-zoom" role="group" aria-label="Text size">
          <button
            type="button" className="ft-docs-zoom-btn" aria-label="Smaller text"
            disabled={zoom <= ZOOM_MIN} onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
          >A&minus;</button>
          <button
            type="button" className="ft-docs-zoom-val" title="Reset to 100%"
            onClick={() => setZoom(1)}
          >{Math.round(zoom * 100)}%</button>
          <button
            type="button" className="ft-docs-zoom-btn" aria-label="Larger text"
            disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
          >A+</button>
        </div>
        <CopyButton
          text={active.content}
          label="Copy whole doc"
          title="Copy this document's full markdown source"
          className="ft-docs-copy-all"
        />
      </div>

      <div className="ft-docs-content" style={{ '--ft-docs-scale': zoom }}>
        {sections.map((sec, i) => (
          <section key={i} className="ft-docs-section">
            <CopyButton
              text={sec.source}
              label="Copy"
              title={sec.heading ? `Copy the "${sec.heading}" section as markdown` : 'Copy this section as markdown'}
              className="ft-docs-copy-section"
            />
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap, td: TdCell }}>
              {active.splitSessions ? markDoubleSessionDays(sec.source) : sec.source}
            </ReactMarkdown>
          </section>
        ))}
      </div>
    </div>
  );
}
