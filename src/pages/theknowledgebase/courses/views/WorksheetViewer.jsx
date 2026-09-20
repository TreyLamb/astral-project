import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { getWorksheet } from '../worksheets/worksheetsRegistry';
import { flattenWorksheet, listChapters, nextMark, markKey, stemNoteKey } from '../worksheets/worksheetEngine';
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
  const chapters = useMemo(() => (worksheet ? listChapters(worksheet.data) : []), [worksheet]);

  // Which chapter to show - 'all' or a chapter number. Remembered per worksheet (a phone-width
  // grid of 60+ questions across 4 chapters is a lot to scroll past to get back to the one you
  // were studying), reset if the worksheet itself changes.
  const chapterStorageKey = `courses_worksheet_${worksheetId}_chapter`;
  const [selectedChapter, setSelectedChapter] = useState(() => {
    try {
      const saved = localStorage.getItem(chapterStorageKey);
      return saved ? JSON.parse(saved) : 'all';
    } catch {
      return 'all';
    }
  });
  useEffect(() => {
    try { localStorage.setItem(chapterStorageKey, JSON.stringify(selectedChapter)); } catch { /* private mode etc - non-fatal */ }
  }, [chapterStorageKey, selectedChapter]);

  const visibleBlocks = useMemo(
    () => (selectedChapter === 'all' ? blocks : blocks.filter((b) => b.chapterNumber === selectedChapter)),
    [blocks, selectedChapter],
  );

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

  // Deliberately NOT persisted (session-only, resets on reload) - this is a reveal toggle for
  // checking work, not a study preference, and leaving it silently "on" from a past visit would
  // spoil a self-test the next time this worksheet is opened.
  const [showAnswers, setShowAnswers] = useState(false);

  if (!worksheet) {
    return (
      <div className="crs-empty">
        Worksheet not found. <button className="crs-back" onClick={() => navigate('/TKB/courses/worksheets')}>← back to Worksheets</button>
      </div>
    );
  }

  const markedCount = Object.keys(state.marks).length;
  const noteCount = Object.keys(state.notes).length;
  const visibleQuestionCount = visibleBlocks.filter((b) => b.type === 'question').length;

  return (
    <div className="wks-page">
      <button className="crs-back" onClick={() => navigate('/TKB/courses/worksheets')}>← All worksheets</button>

      <div className="crs-header">
        <div>
          <div className="crs-title">{worksheet.title}</div>
          <div className="crs-subtitle">
            {visibleQuestionCount} question{visibleQuestionCount === 1 ? '' : 's'}
            {selectedChapter !== 'all' ? ' in this chapter' : ` of ${worksheet.questionCount} total`} — click a
            letter to circle it, click again for an X, again for a ?, again to clear. Click the blank space on
            any line to jot a note.
            {markedCount > 0 && ` ${markedCount} marked.`}
            {noteCount > 0 && ` ${noteCount} note${noteCount === 1 ? '' : 's'}.`}
          </div>
        </div>
        <div className="wks-header-actions">
          {chapters.length > 1 && (
            <select
              className="wks-chapter-select"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Show chapter"
            >
              <option value="all">All chapters</option>
              {chapters.map((c) => (
                <option key={c.number} value={c.number}>Ch {c.number} — {c.title}</option>
              ))}
            </select>
          )}
          <button
            className={`crs-btn${showAnswers ? '' : ' secondary'}`}
            onClick={() => setShowAnswers((v) => !v)}
          >
            {showAnswers ? 'Hide answers' : 'Show answers'}
          </button>
          <button className="crs-btn secondary" onClick={clearAll}>Clear all marks &amp; notes</button>
        </div>
      </div>

      <div className="wks-grid">
        {visibleBlocks.map((block) =>
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
              showAnswers={showAnswers}
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

const WorksheetQuestion = memo(function WorksheetQuestion({ question, marks, notes, overrides, onCycleMark, onSetNote, onSetOverride, showAnswers }) {
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
        const isCorrect = showAnswers && question.answer === opt.letter;
        return (
          <div className="wks-option-row" key={opt.letter}>
            <button
              type="button"
              className={`wks-letter${mark ? ` wks-mark-${mark}` : ''}${isCorrect ? ' wks-correct-answer' : ''}`}
              onClick={() => onCycleMark(key)}
              aria-label={`Option ${opt.letter}${mark ? `, marked ${MARK_LABELS[mark]}` : ''}${isCorrect ? ', correct answer' : ''}`}
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
      {showAnswers && question.answer && (
        <div className="wks-answer-note">
          <strong>Answer: {question.answer}.</strong> {question.answerRationale}
          {question.answerSource === 'derived' && <span className="wks-derived-tag">derived, not an official key</span>}
          {question.answerSource === 'official' && <span className="wks-official-tag">marked correct in the source PDF</span>}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  if (
    prev.question !== next.question ||
    prev.onCycleMark !== next.onCycleMark ||
    prev.onSetNote !== next.onSetNote ||
    prev.onSetOverride !== next.onSetOverride ||
    prev.showAnswers !== next.showAnswers
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
