// The calendar's left-hand notes pad — one free-text scratch area, deliberately unstructured.
//
// Trey uses it as a to-do list, but it is NOT a checklist: no items, no schema, no "add" button.
// A pad you can type anything into is the point; imposing a row shape on it would make it worse
// at the job it was asked for.
//
// Persists into settings.calendarNotes, so it rides the same localStorage/Firestore split as
// every other MFT setting and follows him between devices when signed in.

import { useState, useEffect, useRef } from 'react';

const SAVE_DELAY_MS = 700;

export default function CalendarNotes({ value, onSave, onClose }) {
  const [text, setText] = useState(value ?? '');
  const [dirty, setDirty] = useState(false);
  // What we last handed to onSave. Settings load asynchronously, so the incoming `value` can
  // change under us after mount — adopting it blindly would wipe whatever was being typed.
  const savedRef = useRef(value ?? '');
  const timerRef = useRef(null);

  useEffect(() => {
    const incoming = value ?? '';
    if (incoming !== savedRef.current) {
      savedRef.current = incoming;
      setText(incoming);
      setDirty(false);
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onChange = (e) => {
    const next = e.target.value;
    setText(next);
    setDirty(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      savedRef.current = next;
      setDirty(false);
      onSave(next);
    }, SAVE_DELAY_MS);
  };

  // Blur commits immediately — waiting out the debounce after the user has visibly finished is
  // the window where a refresh loses the last sentence.
  const onBlur = () => {
    if (!dirty) return;
    clearTimeout(timerRef.current);
    savedRef.current = text;
    setDirty(false);
    onSave(text);
  };

  return (
    <aside className="ft-notes-side">
      <div className="ft-notes-head">
        <span className="ft-field-label">Notes</span>
        <span className="ft-notes-state">{dirty ? 'saving…' : 'saved'}</span>
        <button type="button" className="ft-x ft-notes-x" onClick={onClose} aria-label="Hide notes">✕</button>
      </div>
      <textarea
        className="ft-notes-area"
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        spellCheck
        placeholder={'Anything you want to keep in front of you.\n\n- call advisor\n- order running shoes\n- lab notebook due Thu'}
      />
    </aside>
  );
}
