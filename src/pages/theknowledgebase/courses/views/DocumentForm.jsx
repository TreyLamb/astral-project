import { useState } from 'react';
import { useCourses } from '../CoursesApp';

const KINDS = ['syllabus', 'slides', 'reading', 'book-notes', 'lecture-notes'];

// Adds a Document REFERENCE — a link or a repo-relative path, plus a short
// hand-written summary and tags. Never the content itself: see the Content
// strategy section of docs/courses/DATA-MODEL.md for why.
export default function DocumentForm({ courseId, onDone }) {
  const { addDocument } = useCourses();
  const [kind, setKind] = useState('reading');
  const [title, setTitle] = useState('');
  const [refType, setRefType] = useState('drive-link');
  const [refValue, setRefValue] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [weekId, setWeekId] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addDocument({
      courseId,
      kind,
      title: title.trim(),
      ref: { type: refType, value: refValue.trim() },
      summary: summary.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      weekId: weekId.trim() || null,
    });
    setTitle(''); setRefValue(''); setSummary(''); setTags(''); setWeekId('');
    onDone?.();
  };

  return (
    <form className="crs-form" onSubmit={submit}>
      <select value={kind} onChange={(e) => setKind(e.target.value)}>
        {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <input placeholder="Title (e.g. Week 3 slides)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Week (e.g. wk3) — optional" value={weekId} onChange={(e) => setWeekId(e.target.value)} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select value={refType} onChange={(e) => setRefType(e.target.value)}>
          <option value="drive-link">Drive / cloud link</option>
          <option value="repo-doc">Repo doc path (docs/courses/…)</option>
          <option value="none">No reference (notes only)</option>
        </select>
        <input
          style={{ flex: 1 }}
          placeholder={refType === 'drive-link' ? 'https://drive.google.com/…' : refType === 'repo-doc' ? 'docs/courses/MICR2060/week3.md' : ''}
          value={refValue}
          onChange={(e) => setRefValue(e.target.value)}
          disabled={refType === 'none'}
        />
      </div>
      <textarea placeholder="Short summary — this is what gets searched/tagged, not the full text" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <input placeholder="Tags, comma separated (e.g. gram-staining, cell-wall)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <button className="crs-btn" type="submit">Add document</button>
    </form>
  );
}
