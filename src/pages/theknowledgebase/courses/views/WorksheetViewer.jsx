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

  // Which chapters to show - an array of chapter numbers, empty meaning all. Remembered per
  // worksheet (a phone-width grid of 60+ questions across 4 chapters is a lot to scroll past to get
  // back to the ones you were studying). Older saves held 'all' or a single number; both still load.
  const chapterStorageKey = `courses_worksheet_${worksheetId}_chapter`;
  const [selectedChapters, setSelectedChapters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(chapterStorageKey));
      if (Array.isArray(saved)) return saved.filter((n) => Number.isInteger(n));
      if (Number.isInteger(saved)) return [saved];
      return [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try { localStorage.setItem(chapterStorageKey, JSON.stringify(selectedChapters)); } catch { /* private mode etc - non-fatal */ }
  }, [chapterStorageKey, selectedChapters]);

  const toggleChapter = useCallback((number) => {
    setSelectedChapters((prev) => {
      const next = prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number];
      return next.length === chapters.length ? [] : next.sort((a, b) => a - b);
    });
  }, [chapters.length]);

  const visibleBlocks = useMemo(
    () => (selectedChapters.length === 0 ? blocks : blocks.filter((b) => selectedChapters.includes(b.chapterNumber))),
    [blocks, selectedChapters],
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
            {selectedChapters.length > 0 ? ` in the selected chapter${selectedChapters.length === 1 ? '' : 's'}` : ` of ${worksheet.questionCount} total`} — click a
            letter to circle it, click again for an X, again for a ?, again to clear. Click the blank space on
            any line to jot a note.
            {markedCount > 0 && ` ${markedCount} marked.`}
            {noteCount > 0 && ` ${noteCount} note${noteCount === 1 ? '' : 's'}.`}
          </div>
        </div>
        <div className="wks-header-actions">
          {chapters.length > 1 && (
            <div className="wks-chapter-chips" role="group" aria-label="Show chapters">
              <button
                type="button"
                className={`wks-chip${selectedChapters.length === 0 ? ' active' : ''}`}
                aria-pressed={selectedChapters.length === 0}
                onClick={() => setSelectedChapters([])}
              >
                All
              </button>
              {chapters.map((c) => (
                <button
                  key={c.number}
                  type="button"
                  className={`wks-chip${selectedChapters.includes(c.number) ? ' active' : ''}`}
                  aria-pressed={selectedChapters.includes(c.number)}
                  title={c.title}
                  onClick={() => toggleChapter(c.number)}
                >
                  Ch {c.number}
                </button>
              ))}
            </div>
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
  const unsure = question.confidence === 'unsure';
  const likely = question.likelyOptions ?? [];
  const knownWrong = question.knownWrong ?? [];
  return (
    <div className={`wks-question${hasEdit ? ' wks-has-edit' : ''}${unsure ? ' wks-unsure' : ''}`}>
      {unsure && (
        <div className="wks-unsure-flag">
          &#9888; Not 100% sure — most likely {question.answer}
          {likely.filter((l) => l !== question.answer).length > 0 && `, then ${likely.filter((l) => l !== question.answer).join(', ')}`}
        </div>
      )}
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
        const isKnownWrong = knownWrong.includes(opt.letter);
        const mark = isKnownWrong ? 'x' : (marks[key] ?? null);
        const isCorrect = showAnswers && !unsure && question.answer === opt.letter;
        const isLikelyTop = unsure && question.answer === opt.letter;
        const isLikelyAlt = unsure && question.answer !== opt.letter && likely.includes(opt.letter);
        return (
          <div className="wks-option-row" key={opt.letter}>
            <button
              type="button"
              className={`wks-letter${mark ? ` wks-mark-${mark}` : ''}${isKnownWrong ? ' wks-known-wrong' : ''}${isCorrect ? ' wks-correct-answer' : ''}${isLikelyTop ? ' wks-likely-top' : ''}${isLikelyAlt ? ' wks-likely-alt' : ''}`}
              onClick={() => { if (!isKnownWrong) onCycleMark(key); }}
              aria-label={`Option ${opt.letter}${isKnownWrong ? ', known wrong: marked wrong on one of your graded OLQ attempts' : mark ? `, marked ${MARK_LABELS[mark]}` : ''}${isCorrect ? ', correct answer' : ''}${isLikelyTop ? ', most likely answer, not certain' : ''}${isLikelyAlt ? ', also plausible, not certain' : ''}`}
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
      {knownWrong.length > 0 && (
        <div className="wks-known-wrong-note">
          &#10007; Red X = you picked {knownWrong.join(', ')} on a graded OLQ attempt and Canvas marked it wrong.
        </div>
      )}
      {showAnswers && question.answer && (
        <div className="wks-answer-note">
          {unsure ? (
            <strong className="wks-unsure-answer">
              Best guess: {question.answer}{likely.filter((l) => l !== question.answer).length > 0 && ` (also plausible: ${likely.filter((l) => l !== question.answer).join(', ')})`}.
            </strong>
          ) : (
            <strong>Answer: {question.answer}.</strong>
          )}{' '}
          {question.answerRationale}
          {question.answerSource === 'derived' && <span className="wks-derived-tag">derived, not an official key</span>}
          {question.answerSource === 'official' && <span className="wks-official-tag">marked correct in the source PDF</span>}
          {question.answerSource === 'graded' && <span className="wks-official-tag">confirmed by your graded OLQ attempt</span>}
          {question.answerSource === 'corrected' && <span className="wks-official-tag">corrected after OLQ grading, checked against the chapter text</span>}
          {question.answerSource === 'checked' && <span className="wks-official-tag">checked against the chapter text</span>}
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
