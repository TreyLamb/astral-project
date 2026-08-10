import { useState } from 'react';
import { usePogoFilters } from '../pogofiltersContext';

// The minimising corner tab. Sits bottom-right on the Filters and Labels pages,
// collapsed to just its handle until clicked.
//
// Saved on blur rather than on every keystroke — this writes to Firestore, and
// a note is exactly the kind of thing you'd otherwise burn a hundred writes on.

export default function NotesTab({ section, title }) {
  const { settings, updateSettings } = usePogoFilters();
  const stored = settings?.sectionNotes?.[section] ?? '';

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(stored);

  // Adopt the stored value when it changes underneath us (first load, or the
  // other device having written it). Reset-during-render rather than an effect —
  // React's recommended pattern for "reset state when a prop changes", and the
  // same one Navbar.jsx uses; an effect here would cascade an extra render.
  const [textFor, setTextFor] = useState(stored);
  if (textFor !== stored) {
    setTextFor(stored);
    setText(stored);
  }

  const save = () => {
    if (text === stored) return;
    updateSettings({ sectionNotes: { ...(settings?.sectionNotes || {}), [section]: text } });
  };

  const dirty = text !== stored;

  return (
    <div className={`pgf-notes${open ? ' open' : ''}`}>
      <div
        className="pgf-notes-tab"
        onClick={() => { if (open) save(); setOpen((o) => !o); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setOpen((o) => !o); }}
      >
        <span>{open ? '▾' : '▴'}</span>
        <span>{title}</span>
        {dirty && <span className="pgf-muted">unsaved</span>}
        {!open && stored && <span className="pgf-muted">· {stored.split('\n')[0].slice(0, 40)}…</span>}
      </div>

      {open && (
        <div className="pgf-notes-body">
          <textarea
            className="pgf-textarea"
            style={{ fontFamily: 'inherit', minHeight: 150 }}
            placeholder={`Anything you want to remember about your ${section}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={save}
          />
          <div className="pgf-fcard-row">
            <span className="pgf-muted">Saves when you click away</span>
            <span className="pgf-spacer" />
            <button className="pgf-btn pgf-btn-sm pgf-btn-primary" onClick={save} disabled={!dirty}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
