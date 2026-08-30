import { useState } from 'react';
import './NotesPanel.css';

// A single scratch-note pad, reachable from every page regardless of whether that page hides
// the global Navbar for its own top bar (most sub-apps do - see webdesign.md "One top bar per
// tool"). Mounted once in App.jsx, outside <Routes>, so open/closed state and the note text
// survive navigating between pages without a remount. Plain text, localStorage only - no
// formatting, no sync, nothing fancy, per the ask.
//
// State is read from storage via a LAZY useState initializer (runs once, first render only) and
// written explicitly inside each handler rather than through a reactive effect keyed on
// [text, open] - that effect shape looks natural but races on mount: React fires an effect for
// its OWN initial run regardless of dependencies, so a "persist on change" effect sitting next to
// a "load on mount" effect writes the STILL-DEFAULT state back to storage before the just-loaded
// setState calls have re-rendered, silently overwriting a real saved note with the empty default
// on every remount (i.e., every page reload). Explicit writes in the handlers can't race like that.
const KEY = 'astral_notes_v1';

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStored(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private window) - the note just won't persist this session.
  }
}

export default function NotesPanel() {
  const [open, setOpen] = useState(() => !!readStored().open);
  const [text, setText] = useState(() => readStored().text ?? '');

  const toggle = () => {
    const next = !open;
    setOpen(next);
    writeStored({ text, open: next });
  };

  const onChangeText = (e) => {
    const next = e.target.value;
    setText(next);
    writeStored({ text: next, open });
  };

  const clear = () => {
    if (text.trim() && !window.confirm('Clear your notes? This cannot be undone.')) return;
    setText('');
    writeStored({ text: '', open });
  };

  return (
    <>
      <button
        className={'notes-tab' + (open ? ' notes-tab-open' : '')}
        onClick={toggle}
        aria-label={open ? 'Close notes' : 'Open notes'}
        title={open ? 'Close notes' : 'Open notes'}
      >
        {open ? '✕' : '📝'}
      </button>

      {open && (
        <div className="notes-panel" role="dialog" aria-label="Notes">
          <div className="notes-panel-head">
            <span>Notes</span>
            <button className="notes-clear" onClick={clear} title="Clear notes">Clear</button>
          </div>
          <textarea
            className="notes-panel-text"
            value={text}
            onChange={onChangeText}
            placeholder="Jot something down…"
            autoFocus
          />
        </div>
      )}
    </>
  );
}
