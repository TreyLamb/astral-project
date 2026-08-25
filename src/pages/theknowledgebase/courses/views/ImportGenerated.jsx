import { useState, useMemo } from 'react';
import { useCourses } from '../CoursesApp';
import { useTkbData } from '../../TkbApp';
import { buildStudyPrompt } from '../engine/promptBuilder';
import { generateFactQuestions, EXAMPLE_MICR_FACTS } from '../engine/facts';
import { generateBatch, courseTemplatesFor } from '../engine/generator';
import { dedupeQaBatch } from '../../engine/dedup';
import { untestedTaughtTags } from '../engine/patternAnalysis';

// Tier 2 (zero-AI, in-app) and Tier 3 (external AI, manual paste) question
// generation, both landing in the SAME place: TKB's existing question store,
// via the existing importQuestions() importer (TkbApp's TkbDataContext) —
// no separate review engine for Courses. Never calls an AI API itself.
export default function ImportGenerated({ course }) {
  const { documents, realQuestions } = useCourses();
  const { questions: tkbQuestions, importQuestions } = useTkbData();
  const [prompt, setPrompt] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const focusTags = useMemo(
    () => untestedTaughtTags(documents, realQuestions, course.id).map((t) => t.tag),
    [documents, realQuestions, course.id]
  );

  const buildPrompt = () => {
    setPrompt(buildStudyPrompt(course, documents, realQuestions, focusTags));
  };

  const runPreview = (rows) => {
    const existingPairs = tkbQuestions.map((q) => ({ question: q.question, answer: q.answer }));
    const candidatePairs = rows.map((r) => ({ question: r.question, answer: r.answer }));
    const { kept, droppedAsDuplicateOfExisting, droppedAsDuplicateWithinBatch } = dedupeQaBatch(candidatePairs, existingPairs);
    setPreview({ total: rows.length, kept: kept.length, dupes: droppedAsDuplicateOfExisting.length + droppedAsDuplicateWithinBatch.length });
  };

  const generateExample = () => {
    let rows = [];
    if (course.code === 'MICR 2060' || course.code === 'MICR 2065') {
      rows = generateFactQuestions(course, EXAMPLE_MICR_FACTS);
    } else {
      const templates = courseTemplatesFor(course.code);
      if (templates.length) rows = templates.flatMap((t) => generateBatch(t.id, 5));
    }
    if (!rows.length) {
      setResult({ added: 0, skipped: 0, errors: [`No example generator wired up yet for ${course.code} — see courses/engine/facts.js and generator.js.`] });
      return;
    }
    setPasteText(JSON.stringify(rows, null, 2));
    runPreview(rows);
  };

  const handlePreview = () => {
    try {
      const rows = JSON.parse(pasteText);
      if (!Array.isArray(rows)) throw new Error('Expected a JSON array');
      runPreview(rows);
      setResult(null);
    } catch (err) {
      setPreview(null);
      setResult({ added: 0, skipped: 0, errors: [`Couldn't parse: ${err.message}`] });
    }
  };

  const handleImport = async () => {
    const res = await importQuestions(pasteText);
    setResult(res);
    setPreview(null);
    setPasteText('');
  };

  return (
    <div className="crs-form">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="crs-btn secondary" onClick={buildPrompt}>Build AI study prompt</button>
        <button type="button" className="crs-btn secondary" onClick={generateExample}>Generate example questions (zero-AI)</button>
      </div>

      {prompt && (
        <>
          <div className="crs-empty">Paste this into any free AI chat, then paste its JSON reply below.</div>
          <div className="crs-prompt-box">{prompt}</div>
        </>
      )}

      <textarea
        placeholder="Paste generated question JSON here"
        value={pasteText}
        onChange={(e) => { setPasteText(e.target.value); setPreview(null); }}
        style={{ minHeight: '8rem' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="crs-btn secondary" onClick={handlePreview} disabled={!pasteText.trim()}>Preview</button>
        <button type="button" className="crs-btn" onClick={handleImport} disabled={!pasteText.trim()}>Import into TKB review deck</button>
      </div>

      {preview && (
        <div className="crs-empty">
          {preview.total} rows — {preview.kept} look new, {preview.dupes} look like near-duplicates of existing TKB questions.
        </div>
      )}
      {result && (
        <div className="crs-empty">
          {result.added != null && `Added ${result.added}, skipped ${result.skipped} (exact-text duplicates).`}
          {result.errors?.length > 0 && <div>{result.errors.join('; ')}</div>}
        </div>
      )}
    </div>
  );
}
