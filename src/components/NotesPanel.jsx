import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { firstSegment, segmentLabel } from '../routeAliases';
import './NotesPanel.css';

// A scratch-note pad, reachable from every page regardless of whether that page hides the
// global Navbar for its own top bar (most sub-apps do - see webdesign.md "One top bar per
// tool"). Mounted once in App.jsx, outside <Routes>, so the open/closed state survives
// navigating between pages without a remount. Plain text, localStorage only - no formatting,
// no sync, nothing fancy, per the ask.
//
// PER-PAGE, not one shared blob: added 2026-09-21 after Trey noticed a note meant for TKB
// showing up on the EFT page. "It should be page-specific" - keyed on the first path segment
// (TKB, EFTsh, MFT, ...), the same granularity the site already uses for tool-level state
// elsewhere (OWN_TOPBAR_ROUTES, SITE_LINKS). Finer than that (one note per exact URL) would
// lose your note walking from /TKB/afoqt to /TKB/afoqt/drill, which is worse, not better.
// `open` stays a single global toggle - only the TEXT is per-section - so the panel doesn't
// re-close every time you navigate.
const KEY = 'astral_notes_v2';
const LEGACY_KEY = 'astral_notes_v1';

// `currentSection` is only used to migrate a v1 note somewhere reachable rather than dropping
// it - wherever Trey happens to be the first time this runs after the upgrade.
function readStored(currentSection) {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) return { open: !!parsed.open, notes: parsed.notes ?? {} };
  } catch {
    /* fall through to legacy/default */
  }
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
    if (legacy?.text) {
      return { open: !!legacy.open, notes: { [currentSection]: legacy.text } };
    }
  } catch {
    /* nothing to migrate */
  }
  return { open: false, notes: {} };
}

function writeStored(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private window) - the note just won't persist this session.
  }
}

export default function NotesPanel() {
  const location = useLocation();
  const section = firstSegment(location.pathname) || 'home';
  const label = segmentLabel(location.pathname);

  const [open, setOpen] = useState(() => !!readStored(section).open);
  const [notes, setNotes] = useState(() => readStored(section).notes);

  const text = notes[section] ?? '';

  const toggle = () => {
    const next = !open;
    setOpen(next);
    writeStored({ notes, open: next });
  };

  const onChangeText = (e) => {
    const value = e.target.value;
    const nextNotes = { ...notes, [section]: value };
    setNotes(nextNotes);
    writeStored({ notes: nextNotes, open });
  };

  const clear = () => {
    if (text.trim() && !window.confirm(`Clear your ${label} notes? This cannot be undone.`)) return;
    const nextNotes = { ...notes, [section]: '' };
    setNotes(nextNotes);
    writeStored({ notes: nextNotes, open });
  };

  return (
    <>
      <button
        className={'notes-tab' + (open ? ' notes-tab-open' : '')}
        onClick={toggle}
        aria-label={open ? 'Close notes' : 'Open notes'}
        title={open ? 'Close notes' : `Open notes (${label})`}
      >
        {open ? '✕' : '📝'}
      </button>

      {open && (
        <div className="notes-panel" role="dialog" aria-label={`${label} notes`}>
          <div className="notes-panel-head">
            <span>Notes — {label}</span>
            <button className="notes-clear" onClick={clear} title="Clear notes for this page">Clear</button>
          </div>
          <textarea
            className="notes-panel-text"
            value={text}
            onChange={onChangeText}
            placeholder={`Jot something down for ${label}…`}
            autoFocus
          />
        </div>
      )}
    </>
  );
}
