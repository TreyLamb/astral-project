import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { getWorksheet } from '../worksheets/worksheetsRegistry';
import { flattenWorksheet, nextMark, markKey, stemNoteKey } from '../worksheets/worksheetEngine';
import { WorksheetStorage } from '../worksheets/worksheetStorage';
import '../worksheets/Worksheet.css';

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

  const clearAll = useCallback(() => {
    if (!window.confirm('Clear every mark and note on this worksheet? This cannot be undone.')) return;
    const cleared = { marks: {}, notes: {} };
    setState(cleared);
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
            {worksheet.questionCount} questions — click a letter to circle it, click again for an X, again to
            clear. Click the blank space on any line to jot a note.
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
              onCycleMark={cycleMark}
              onSetNote={setNote}
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

const WorksheetQuestion = memo(function WorksheetQuestion({ question, marks, notes, onCycleMark, onSetNote }) {
  const stemKey = stemNoteKey(question.id);
  return (
    <div className="wks-question">
      <WorksheetLine
        className="wks-line-stem"
        text={`${question.number}. ${question.stem}`}
        noteKey={stemKey}
        noteValue={notes[stemKey] ?? ''}
        onSetNote={onSetNote}
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
              aria-label={`Option ${opt.letter}${mark ? `, marked ${mark === 'circle' ? 'selected' : 'eliminated'}` : ''}`}
            >
              {opt.letter}
            </button>
            <WorksheetLine
              className="wks-line-option"
              text={opt.text}
              noteKey={key}
              noteValue={notes[key] ?? ''}
              onSetNote={onSetNote}
            />
          </div>
        );
      })}
    </div>
  );
}, (prev, next) => {
  if (prev.question !== next.question || prev.onCycleMark !== next.onCycleMark || prev.onSetNote !== next.onSetNote) {
    return false;
  }
  for (const key of questionRelevantKeys(prev.question)) {
    if (prev.marks[key] !== next.marks[key]) return false;
    if (prev.notes[key] !== next.notes[key]) return false;
  }
  return true;
});

const WorksheetLine = memo(function WorksheetLine({ className, text, noteKey, noteValue, onSetNote }) {
  return (
    <div className={`wks-ruled-line ${className}`}>
      <span className="wks-line-text">{text}</span>
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
