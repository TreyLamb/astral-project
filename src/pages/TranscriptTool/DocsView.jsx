import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../AuthContext';
import seedMd from './notes.md?raw';
import { loadLocal, saveLocal, loadCloud, saveCloud, newer } from './notesStore';
import './TranscriptDocs.css';

// Renders and EDITS the notes document. Markdown is rendered by react-markdown
// + remark-gfm, exactly as src/pages/fitnesstracker/WorkoutDocsView.jsx does.
//
// Styling is applied per ELEMENT TYPE in TranscriptDocs.css — h2, table, li —
// never per document, so rewriting the prose can never break the layout.
//
// notes.md is the SEED: it is what shows before you have ever edited, and what
// "Reset to file" returns to. After that the saved copy wins, because the file
// itself only changes on a deploy.
const AUTOSAVE_MS = 1200;

function TableWrap({ children }) {
  return <div className="tt-doc-table-wrap"><table>{children}</table></div>;
}

export default function DocsView() {
  const { user, signIn } = useAuth();
  const uid = user ? user.uid : null;
  const [text, setText] = useState(() => loadLocal()?.text ?? seedMd);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | dirty | saving | saved | error
  const [where, setWhere] = useState(() => (loadLocal() ? 'local' : 'file'));
  const [err, setErr] = useState(null);
  const dirtyRef = useRef(false);

  // Pull the cloud copy once auth settles, and again on sign-in. Never
  // overwrites an edit in progress — a slow network response landing on top of
  // what you are typing is worse than being briefly out of date.
  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const cloud = await loadCloud(uid);
        if (cancelled || !cloud || dirtyRef.current) return;
        const best = newer(loadLocal(), cloud);
        setText(best.text);
        saveLocal(best);
        setWhere(best === cloud ? 'cloud' : 'local');
      } catch (e) {
        setErr(`Couldn't reach your saved copy: ${e.message}`);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  const save = useCallback(async (value) => {
    const entry = { text: value, updatedAt: Date.now() };
    setStatus('saving');
    setErr(null);
    saveLocal(entry);
    if (!uid) {
      dirtyRef.current = false;
      setWhere('local');
      setStatus('saved');
      return;
    }
    try {
      await saveCloud(uid, entry);
      dirtyRef.current = false;
      setWhere('cloud');
      setStatus('saved');
    } catch (e) {
      // The local copy is already written, so nothing is lost — only the
      // cross-device mirror failed, and that is what the message has to say.
      dirtyRef.current = false;
      setWhere('local');
      setStatus('error');
      setErr(`Saved on this device, but syncing failed: ${e.message}`);
    }
  }, [uid]);

  // Debounced autosave. Runs off `text` rather than a keystroke handler so a
  // paste, an undo and a Reset all take the same path.
  useEffect(() => {
    if (status !== 'dirty') return undefined;
    const t = setTimeout(() => save(text), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [text, status, save]);

  // Ctrl/Cmd+S saves immediately instead of printing the page.
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirtyRef.current) save(text);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, text, save]);

  // A tab close mid-edit still leaves the local copy behind.
  useEffect(() => {
    const onLeave = () => { if (dirtyRef.current) saveLocal({ text, updatedAt: Date.now() }); };
    window.addEventListener('pagehide', onLeave);
    return () => window.removeEventListener('pagehide', onLeave);
  }, [text]);

  function edit(value) {
    setText(value);
    dirtyRef.current = true;
    setStatus('dirty');
  }

  function resetToFile() {
    if (text !== seedMd && !window.confirm('Replace your edits with the version committed in the repo?')) return;
    edit(seedMd);
    setWhere('file');
  }

  const label = {
    idle: where === 'cloud' ? 'Synced to your account' : where === 'local' ? 'Saved on this device' : 'Showing the committed file',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    saved: uid ? 'Synced to your account' : 'Saved on this device',
    error: 'Saved locally only',
  }[status];

  return (
    <div className="tt-docs">
      <div className="tt-doc-bar">
        <div className="tt-doc-modes">
          <button
            type="button"
            className={`tt-doc-tab${editing ? '' : ' active'}`}
            onClick={() => setEditing(false)}
          >Read</button>
          <button
            type="button"
            className={`tt-doc-tab${editing ? ' active' : ''}`}
            onClick={() => setEditing(true)}
          >Edit</button>
        </div>

        <span className={`tt-doc-status tt-doc-status-${status}`}>
          <i className="tt-doc-dot" aria-hidden="true" />{label}
        </span>

        <div className="tt-doc-spacer" />

        {status === 'dirty' && (
          <button type="button" className="tt-btn tt-btn-primary" onClick={() => save(text)}>Save now</button>
        )}
        {editing && (
          <button type="button" className="tt-btn" onClick={resetToFile}>Reset to file</button>
        )}
        {!user && (
          <button type="button" className="tt-btn" onClick={signIn} title="Sign in so this document follows you between devices">
            Sign in to sync
          </button>
        )}
      </div>

      {err && <p className="tt-doc-err">{err}</p>}
      {!user && (
        <p className="tt-doc-hint">
          Edits are saved in this browser. Sign in and they follow you to your phone and any other device.
        </p>
      )}

      {editing ? (
        <div className="tt-doc-split">
          <textarea
            className="tt-doc-editor"
            value={text}
            onChange={(e) => edit(e.target.value)}
            spellCheck="false"
            aria-label="Notes markdown source"
          />
          <article className="tt-doc-content tt-doc-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap }}>{text}</ReactMarkdown>
          </article>
        </div>
      ) : (
        <article className="tt-doc-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: TableWrap }}>{text}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
