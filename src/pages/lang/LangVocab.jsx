import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';
import { VocabStorage } from './langStorage';

const allVocabFiles = import.meta.glob('/src/data/lang/*/vocab/*.json', { eager: true });
const POS_OPTIONS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'pronoun', 'number', 'particle'];

function speak(word, langCode) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = langCode ?? 'en-US';
  window.speechSynthesis.speak(utt);
}

const EMPTY_FORM = { word: '', romanization: '', english: '', pos: '', notes: '', exampleSentence: '' };

function VocabForm({ form, setForm, editing, onSubmit, onCancel, showRomanization }) {
  return (
    <form className="lang-vocab-form" onSubmit={onSubmit}>
      <div className="lang-vocab-form-row">
        <label>
          Word / phrase *
          <input
            type="text"
            value={form.word}
            onChange={e => setForm({ ...form, word: e.target.value })}
            placeholder="e.g. 你好"
            required
            autoFocus
          />
        </label>
        {showRomanization && (
          <label>
            Romanization / pronunciation
            <input
              type="text"
              value={form.romanization}
              onChange={e => setForm({ ...form, romanization: e.target.value })}
              placeholder="e.g. nǐ hǎo"
            />
          </label>
        )}
      </div>
      <div className="lang-vocab-form-row">
        <label>
          English *
          <input
            type="text"
            value={form.english}
            onChange={e => setForm({ ...form, english: e.target.value })}
            placeholder="e.g. Hello"
            required
          />
        </label>
        <label>
          Part of speech
          <input
            type="text"
            list="lang-pos-options"
            value={form.pos}
            onChange={e => setForm({ ...form, pos: e.target.value })}
            placeholder="e.g. phrase"
          />
          <datalist id="lang-pos-options">
            {POS_OPTIONS.map(p => <option key={p} value={p} />)}
          </datalist>
        </label>
      </div>
      <label className="lang-vocab-form-full">
        Example sentence (optional)
        <input
          type="text"
          value={form.exampleSentence}
          onChange={e => setForm({ ...form, exampleSentence: e.target.value })}
          placeholder="A sentence using this word"
        />
      </label>
      <label className="lang-vocab-form-full">
        Notes (optional)
        <input
          type="text"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Usage notes, formality, context…"
        />
      </label>
      <div className="lang-vocab-form-actions">
        <button type="submit" className="lang-quiz-btn lang-quiz-btn-check">
          {editing ? 'Save changes' : 'Add word'}
        </button>
        <button type="button" className="lang-quiz-btn lang-quiz-btn-skip" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function BulkImport({ langId, category, onImported, onCancel }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);

  function parse() {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { word: parts[0] || '', romanization: parts[1] || '', english: parts[2] || '', notes: parts[3] || '' };
    }).filter(p => p.word && p.english);
    return parsed;
  }

  function handlePreview() {
    setPreview(parse());
  }

  function handleImport() {
    const entries = preview ?? parse();
    if (entries.length === 0) return;
    VocabStorage.addBulk(entries.map(e => ({ ...e, langId, category, pos: '', exampleSentence: '' })));
    onImported();
  }

  return (
    <div className="lang-bulk-import">
      <p className="lang-bulk-hint">
        One entry per line: <code>word | romanization | english | notes</code> (romanization and notes optional).
      </p>
      <textarea
        className="lang-bulk-textarea"
        rows={8}
        value={text}
        onChange={e => { setText(e.target.value); setPreview(null); }}
        placeholder={'你好 | nǐ hǎo | Hello\n谢谢 | xiè xiè | Thank you'}
      />
      {preview && (
        <p className="lang-bulk-preview">{preview.length} word{preview.length !== 1 ? 's' : ''} ready to import.</p>
      )}
      <div className="lang-vocab-form-actions">
        {!preview ? (
          <button className="lang-quiz-btn lang-quiz-btn-reveal" onClick={handlePreview} disabled={!text.trim()}>Preview</button>
        ) : (
          <button className="lang-quiz-btn lang-quiz-btn-check" onClick={handleImport} disabled={preview.length === 0}>
            Import {preview.length} word{preview.length !== 1 ? 's' : ''}
          </button>
        )}
        <button className="lang-quiz-btn lang-quiz-btn-skip" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function LangVocab() {
  const { langId, category } = useParams();
  const navigate = useNavigate();
  const lang = languages.find(l => l.id === langId);

  const [customWords, setCustomWords] = useState(() => VocabStorage.getByLangCategory(langId, category));
  const [mode, setMode] = useState(null); // null | 'add' | 'edit' | 'bulk'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  if (!lang) return <div className="lang-error">Language not found.</div>;

  const staticWords = (allVocabFiles[`/src/data/lang/${langId}/vocab/${category}.json`]?.default ?? [])
    .map(w => ({ ...w, custom: false }));
  const words = [...staticWords, ...customWords];
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ');

  function refresh() {
    setCustomWords(VocabStorage.getByLangCategory(langId, category));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMode('add');
  }

  function openEdit(w) {
    setForm({
      word: w.word ?? '', romanization: w.romanization ?? '', english: w.english ?? '',
      pos: w.pos ?? '', notes: w.notes ?? '', exampleSentence: w.exampleSentence ?? '',
    });
    setEditingId(w.id);
    setMode('edit');
  }

  function submitForm(e) {
    e.preventDefault();
    if (!form.word.trim() || !form.english.trim()) return;
    if (editingId) {
      VocabStorage.update(editingId, form);
    } else {
      VocabStorage.add({ ...form, langId, category });
    }
    refresh();
    setMode(null);
  }

  function deleteWord(id) {
    if (!window.confirm('Delete this word?')) return;
    VocabStorage.remove(id);
    refresh();
  }

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate(`/vocab-vault/${langId}`)}>
        ← {lang.name}
      </button>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn active">Vocabulary</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/vocab-vault/${langId}/slang`)}>Slang</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/vocab-vault/${langId}/grammar`)}>Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/vocab-vault/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <div className="lang-vocab-title-row">
        <h2 className="lang-vocab-title">{lang.flag} {categoryLabel}</h2>
        <div className="lang-vocab-title-actions">
          <button className="lang-add-word-btn" onClick={openAdd}>+ Add Word</button>
          <button className="lang-add-word-btn ghost" onClick={() => setMode('bulk')}>Bulk Add</button>
        </div>
      </div>

      {(mode === 'add' || mode === 'edit') && (
        <VocabForm
          form={form}
          setForm={setForm}
          editing={mode === 'edit'}
          onSubmit={submitForm}
          onCancel={() => setMode(null)}
          showRomanization={!!lang.romanization}
        />
      )}

      {mode === 'bulk' && (
        <BulkImport
          langId={langId}
          category={category}
          onImported={() => { refresh(); setMode(null); }}
          onCancel={() => setMode(null)}
        />
      )}

      {words.length === 0 ? (
        <div className="lang-placeholder"><p>No words in this category yet — add your first one above.</p></div>
      ) : (
        <table className="lang-word-table">
          <thead>
            <tr>
              <th></th>
              <th>Word</th>
              {lang.romanization && <th>{lang.romanization}</th>}
              <th>English</th>
              <th>POS</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={w.id ?? `static-${i}`} className={w.custom ? 'lang-row-custom' : ''}>
                <td className="lang-speak-cell">
                  <button
                    className="lang-speak-btn"
                    onClick={() => speak(w.word, lang.langCode)}
                    title={`Hear ${w.word}`}
                  >
                    🔊
                  </button>
                </td>
                <td className="lang-word-script">
                  {w.word}
                  {w.custom && <span className="lang-custom-badge" title="Your word">yours</span>}
                </td>
                {lang.romanization && <td className="lang-word-rom">{w.romanization || '—'}</td>}
                <td>{w.english}</td>
                <td className="lang-word-pos">{w.pos}</td>
                <td className="lang-word-notes">{w.notes || (w.exampleSentence ? w.exampleSentence : '')}</td>
                <td className="lang-word-actions">
                  {w.custom && (
                    <>
                      <button className="lang-row-action-btn" onClick={() => openEdit(w)} title="Edit">✎</button>
                      <button className="lang-row-action-btn" onClick={() => deleteWord(w.id)} title="Delete">🗑</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {words.length > 0 && (
        <button
          className="lang-quiz-cta-btn"
          onClick={() => navigate(`/vocab-vault/${langId}/quiz`)}
        >
          ⚡ Quiz yourself on {categoryLabel}
        </button>
      )}
    </div>
  );
}
