import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { getWorksheet } from '../worksheets/worksheetsRegistry';
import { flattenWorksheet, nextMark, markKey, stemNoteKey } from '../worksheets/worksheetEngine';
import { WorksheetStorage } from '../worksheets/worksheetStorage';
import '../worksheets/Worksheet.css';

const MARK_LABELS = { circle: 'selected', x: 'eliminated', question: 'uncertain' };

export default function WorksheetViewer() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const worksheet = getWorksheet(worksheetId);

  const [state, setState] = useState(() => WorksheetStorage.load(worksheetId));

  // Re-read from storage if the route swaps to a different worksheet id
  // without a full remount (e.g. navigating list -> viewer -> different item).
  useEffect(() => {
    setState(WorksheetStorage.load(worksheetId));
  }, [worksheetId]);

  useEffect(() => {
    WorksheetStorage.save(worksheetId, state);
  }, [worksheetId, state]);

  const blocks = useMemo(() => (worksheet ? flattenWorksheet(worksheet.data) : []), [worksheet]);

  // Both handlers are stable (functional setState, no closed-over state) so
  // memoized question rows never re-render just because a sibling changed.
  const cycleMark = useCallback((key) => {
    setState((prev) => {
      const next = nextMark(prev.marks[key] ?? null);
      const marks = { ...prev.marks };
      if (next === null) delete marks[key];
      else marks[key] = next;
      return { ...prev, marks };
    });
  }, []);

  const setNote = useCallback((key, text) => {
    setState((prev) => {
      const notes = { ...prev.notes };
      if (!text) delete notes[key];
      else notes[key] = text;
      return { ...prev, notes };
    });
  }, []);

  // A manual correction to a question/option's own text (right-click a
  // line to fix a parse glitch). Kept out of "Clear all marks & notes" —
  // that button is for study progress, not for discarding a correction.
  const setOverride = useCallback((key, text) => {
    setState((prev) => {
      const overrides = { ...prev.overrides };
      if (!text) delete overrides[key];
      else overrides[key] = text;
      return { ...prev, overrides };
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!window.confirm('Clear every mark and note on this worksheet? This cannot be undone.')) return;
    setState((prev) => ({ marks: {}, notes: {}, overrides: prev.overrides }));
  }, []);

  if (!worksheet) {
    return (
      <div className="crs-empty">
        Worksheet not found. <button className="crs-back" onClick={() => navigate('/TKB/courses/worksheets')}>← back to Worksheets</button>
      </div>
    );
  }

  const markedCount = Object.keys(state.marks).length;
  const noteCount = Object.keys(state.notes).length;

  return (
    <div className="wks-page">
      <button className="crs-back" onClick={() => navigate('/TKB/courses/worksheets')}>← All worksheets</button>

      <div className="crs-header">
        <div>
          <div className="crs-title">{worksheet.title}</div>
          <div className="crs-subtitle">
            {worksheet.questionCount} questions — click a letter to circle it, click again for an X, again for a
            ?, again to clear. Click the blank space on any line to jot a note.
            {markedCount > 0 && ` ${markedCount} marked.`}
            {noteCount > 0 && ` ${noteCount} note${noteCount === 1 ? '' : 's'}.`}
          </div>
        </div>
        <button className="crs-btn secondary" onClick={clearAll}>Clear all marks &amp; notes</button>
      </div>

      <div className="wks-grid">
        {blocks.map((block) =>
          block.type === 'heading' ? (
            <div key={block.key} className={`wks-heading wks-heading-${block.level}`}>{block.text}</div>
          ) : (
            <WorksheetQuestion
              key={block.key}
              question={block}
              marks={state.marks}
              notes={state.notes}
              overrides={state.overrides}
              onCycleMark={cycleMark}
              onSetNote={setNote}
              onSetOverride={setOverride}
            />
          )
        )}
      </div>
    </div>
  );
}

function questionRelevantKeys(question) {
  return [stemNoteKey(question.id), ...question.options.map((o) => markKey(question.id, o.letter))];
}

const WorksheetQuestion = memo(function WorksheetQuestion({ question, marks, notes, overrides, onCycleMark, onSetNote, onSetOverride }) {
  const stemKey = stemNoteKey(question.id);
  const hasEdit = questionRelevantKeys(question).some((k) => overrides[k] !== undefined);
  return (
    <div className={`wks-question${hasEdit ? ' wks-has-edit' : ''}`}>
      <WorksheetLine
        className="wks-line-stem"
        prefix={`${question.number}.`}
        text={overrides[stemKey] ?? question.stem}
        noteKey={stemKey}
        noteValue={notes[stemKey] ?? ''}
        onSetNote={onSetNote}
        overrideKey={stemKey}
        onSetOverride={onSetOverride}
      />
      {question.options.map((opt) => {
        const key = markKey(question.id, opt.letter);
        const mark = marks[key] ?? null;
        return (
          <div className="wks-option-row" key={opt.letter}>
            <button
              type="button"
              className={`wks-letter${mark ? ` wks-mark-${mark}` : ''}`}
              onClick={() => onCycleMark(key)}
              aria-label={`Option ${opt.letter}${mark ? `, marked ${MARK_LABELS[mark]}` : ''}`}
            >
              {opt.letter}
            </button>
            <WorksheetLine
              className="wks-line-option"
              text={overrides[key] ?? opt.text}
              noteKey={key}
              noteValue={notes[key] ?? ''}
              onSetNote={onSetNote}
              overrideKey={key}
              onSetOverride={onSetOverride}
            />
          </div>
        );
      })}
    </div>
  );
}, (prev, next) => {
  if (
    prev.question !== next.question ||
    prev.onCycleMark !== next.onCycleMark ||
    prev.onSetNote !== next.onSetNote ||
    prev.onSetOverride !== next.onSetOverride
  ) {
    return false;
  }
  for (const key of questionRelevantKeys(prev.question)) {
    if (prev.marks[key] !== next.marks[key]) return false;
    if (prev.notes[key] !== next.notes[key]) return false;
    if (prev.overrides[key] !== next.overrides[key]) return false;
  }
  return true;
});

// Right-click the text (stem or option) to correct it in place — for fixing
// the odd PDF-extraction glitch, not general editing. At rest it's a plain
// span with zero clickable affordance, per design: nothing should hint that
// left-clicking does anything here (that's reserved for the letter marker
// and the note field). contentEditable is used uncontrolled (seeded via ref
// on entering edit mode, read back on commit) so React never fights the DOM
// for cursor position while typing.
const WorksheetLine = memo(function WorksheetLine({ className, prefix, text, noteKey, noteValue, onSetNote, overrideKey, onSetOverride }) {
  const [editing, setEditing] = useState(false);
  const editRef = useRef(null);

  useEffect(() => {
    if (!editing || !editRef.current) return;
    const el = editRef.current;
    el.textContent = text;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed text only on entering edit mode, not on every keystroke
  }, [editing]);

  const startEdit = (e) => {
    e.preventDefault();
    setEditing(true);
  };
  const commit = () => {
    const val = editRef.current?.textContent ?? '';
    setEditing(false);
    onSetOverride(overrideKey, val);
  };
  const cancel = () => setEditing(false);

  return (
    <div className={`wks-ruled-line ${className}`}>
      {prefix && <span className="wks-line-num">{prefix}</span>}
      {editing ? (
        <span
          ref={editRef}
          className="wks-line-text wks-editing"
          contentEditable
          suppressContentEditableWarning
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
        />
      ) : (
        <span className="wks-line-text" onContextMenu={startEdit}>{text}</span>
      )}
      <input
        type="text"
        className="wks-note-input"
        value={noteValue}
        onChange={(e) => onSetNote(noteKey, e.target.value)}
        aria-label="Note"
      />
    </div>
  );
});
