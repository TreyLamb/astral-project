import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './PassageWindow.css';

// A floating, draggable, resizable reading pane for the LIVE Reading Comprehension question
// only - the post-drill review/miss list still uses PassageView's plain inline block (see
// Figure.jsx's `reveal` branch), because that screen can show several missed RC questions at
// once and stacking several of these on top of each other would be its own mess.
//
// Deliberately its OWN palette, not var(--tkb-*) - Trey's rule, verbatim: "I don't want it to
// match theme for our TKB because our TKB theme is terrible." PassageWindow.css defines every
// colour as a literal so a future TKB retheme can't accidentally drag this along with it.
//
// Rendered via a portal straight onto document.body so `position: fixed` coordinates are real
// viewport coordinates, unaffected by any `position: relative` ancestor inside the runner's
// card layout.

const DEFAULT_W = 460;
const DEFAULT_H = 560;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export default function PassageWindow({ text, lineNumbered, passageId }) {
  const [rect, setRect] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return { x: Math.max(16, vw - DEFAULT_W - 32), y: 96, w: DEFAULT_W, h: DEFAULT_H };
  });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closed, setClosed] = useState(false);

  const preMaxRect = useRef(null);
  const dragState = useRef(null);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);

  // New passage on this same sheet - start reading from the top again rather than wherever the
  // previous question left the scroll position.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [passageId]);

  useEffect(() => {
    if (!panelRef.current || maximized || minimized) return undefined;
    const el = panelRef.current;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setRect((r) => (Math.abs(r.w - width) > 1 || Math.abs(r.h - height) > 1
        ? { ...r, w: width, h: height }
        : r));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maximized, minimized]);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragState.current;
      if (!d) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setRect((r) => ({
        ...r,
        x: clamp(d.origX + (e.clientX - d.startX), -(r.w - 120), vw - 60),
        y: clamp(d.origY + (e.clientY - d.startY), 0, vh - 40),
      }));
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onHeaderMouseDown = (e) => {
    if (maximized || e.target.closest('button')) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: rect.x, origY: rect.y };
  };

  const toggleMaximize = () => {
    if (maximized) {
      setRect(preMaxRect.current || rect);
      setMaximized(false);
    } else {
      preMaxRect.current = rect;
      setMaximized(true);
      setMinimized(false);
    }
  };
  const toggleMinimize = () => setMinimized((m) => !m);

  if (closed) {
    return createPortal(
      <button type="button" className="rcw-reopen" onClick={() => setClosed(false)}>
        📖 Reading passage
      </button>,
      document.body,
    );
  }

  const style = maximized
    ? { left: '3vw', top: '4vh', width: '94vw', height: '90vh' }
    : { left: rect.x, top: rect.y, width: rect.w, height: minimized ? undefined : rect.h };

  const lines = lineNumbered ? text.split('\n') : null;

  return createPortal(
    <div
      ref={panelRef}
      className={'rcw-panel'
        + (maximized ? ' rcw-maximized' : '')
        + (minimized ? ' rcw-minimized' : '')}
      style={style}
    >
      <div className="rcw-header" onMouseDown={onHeaderMouseDown}>
        <span className="rcw-title">📖 Reading Passage</span>
        <div className="rcw-controls">
          <button
            type="button"
            className="rcw-btn"
            title={minimized ? 'Restore' : 'Minimize'}
            onClick={toggleMinimize}
          >
            {minimized ? '▢' : '—'}
          </button>
          <button
            type="button"
            className="rcw-btn"
            title={maximized ? 'Restore' : 'Maximize'}
            onClick={toggleMaximize}
          >
            {maximized ? '❐' : '▭'}
          </button>
          <button
            type="button"
            className="rcw-btn rcw-btn-close"
            title="Close"
            onClick={() => setClosed(true)}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="rcw-body" ref={bodyRef}>
          {lineNumbered ? (
            <div className="rcw-text rcw-numbered">
              {lines.map((line, i) => {
                const n = i + 1;
                const blank = line.trim() === '';
                return (
                  <div className={'rcw-line' + (blank ? ' rcw-line-blank' : '')} key={i}>
                    <span className="rcw-lineno" aria-hidden="true">{n % 5 === 0 ? n : ''}</span>
                    <span className="rcw-linetext">{line}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rcw-text">{text}</div>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
