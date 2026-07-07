import { useState, useMemo } from 'react';
import { useTkbData, useTkbToast } from './TkbApp';
import { TkbStorage } from './tkbStorage';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function TkbSettings() {
  const {
    questions,
    subjects,
    weights,
    cycles,
    settings,
    updateQuestion,
    setWeight,
    updateSettings,
  } = useTkbData();
  const showToast = useTkbToast();

  const styleTags = useMemo(() => {
    const set = new Set();
    questions.forEach(q => (q.styleTags ?? []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [questions]);

  const [importText, setImportText] = useState('');
  const [retryMin, setRetryMin] = useState(settings.retryOffset.min);
  const [retryMax, setRetryMax] = useState(settings.retryOffset.max);

  const [newFocusSubject, setNewFocusSubject] = useState(subjects[0]?.id ?? '');
  const [newFocusMultiplier, setNewFocusMultiplier] = useState(1.5);
  const [newFocusDate, setNewFocusDate] = useState('');

  const drafts = questions.filter(q => q.status === 'draft');
  const flagged = questions.filter(q => q.flagged);
  const cyclingCount = Object.values(cycles).filter(c => c.phase === 'active').length;

  function subjectName(id) {
    return subjects.find(s => s.id === id)?.name ?? '(unknown)';
  }

  function handleRetrySave() {
    if (retryMin >= retryMax) {
      showToast('Retry min must be less than max', 'error');
      return;
    }
    updateSettings({ retryOffset: { min: retryMin, max: retryMax } });
  }

  function handleAddFocusWeek() {
    if (!newFocusSubject || !newFocusDate) return;
    const entry = {
      id: uid(),
      subjectId: newFocusSubject,
      multiplier: Number(newFocusMultiplier),
      revertDate: newFocusDate,
    };
    updateSettings({ focusWeeks: [...settings.focusWeeks, entry] });
    setNewFocusDate('');
  }

  function handleRemoveFocusWeek(id) {
    updateSettings({ focusWeeks: settings.focusWeeks.filter(f => f.id !== id) });
  }

  function handleImport() {
    const result = TkbStorage.importQuestions(importText);
    if (result.restored) {
      showToast('Restored full backup', 'success');
    } else if (result.added === 0 && result.errors.length > 0) {
      showToast(`Import failed: ${result.errors[0]}`, 'error');
    } else {
      showToast(`Added ${result.added}, skipped ${result.skipped}`, result.errors.length ? 'error' : 'success');
    }
    setImportText('');
  }

  return (
    <div className="tkb-settings">
      <div className="tkb-settings-section">
        <h3>Subject Weights</h3>
        {subjects.map(s => (
          <div className="tkb-slider-row" key={s.id}>
            <label>{s.name}</label>
            <input
              type="range"
              min={1}
              max={100}
              value={weights.subject[s.id] ?? 50}
              onChange={(e) => setWeight('subject', s.id, Number(e.target.value))}
            />
            <output>{weights.subject[s.id] ?? 50}</output>
          </div>
        ))}
      </div>

      <div className="tkb-settings-section">
        <h3>Style Tag Weights</h3>
        {styleTags.length === 0 ? (
          <p>No style tags yet.</p>
        ) : (
          styleTags.map(tag => (
            <div className="tkb-slider-row" key={tag}>
              <label>{tag}</label>
              <input
                type="range"
                min={1}
                max={100}
                value={weights.tag[tag] ?? 50}
                onChange={(e) => setWeight('tag', tag, Number(e.target.value))}
              />
              <output>{weights.tag[tag] ?? 50}</output>
            </div>
          ))
        )}
      </div>

      <div className="tkb-settings-section">
        <h3>Cycle Config</h3>
        <div className="tkb-slider-row">
          <label>Active min (days)</label>
          <input
            type="number"
            value={settings.cycle.activeMin}
            onChange={(e) => updateSettings({ cycle: { ...settings.cycle, activeMin: Number(e.target.value) } })}
          />
        </div>
        <div className="tkb-slider-row">
          <label>Active max (days)</label>
          <input
            type="number"
            value={settings.cycle.activeMax}
            onChange={(e) => updateSettings({ cycle: { ...settings.cycle, activeMax: Number(e.target.value) } })}
          />
        </div>
        <div className="tkb-slider-row">
          <label>Rest min (days)</label>
          <input
            type="number"
            value={settings.cycle.restMin}
            onChange={(e) => updateSettings({ cycle: { ...settings.cycle, restMin: Number(e.target.value) } })}
          />
        </div>
        <div className="tkb-slider-row">
          <label>Rest max (days)</label>
          <input
            type="number"
            value={settings.cycle.restMax}
            onChange={(e) => updateSettings({ cycle: { ...settings.cycle, restMax: Number(e.target.value) } })}
          />
        </div>
        <p>Currently cycling: {cyclingCount} (no cap — every wrong/flagged/new question cycles)</p>
      </div>

      <div className="tkb-settings-section">
        <h3>Retry Offset</h3>
        <div className="tkb-slider-row">
          <label>Min</label>
          <input type="number" value={retryMin} onChange={(e) => setRetryMin(Number(e.target.value))} />
        </div>
        <div className="tkb-slider-row">
          <label>Max</label>
          <input type="number" value={retryMax} onChange={(e) => setRetryMax(Number(e.target.value))} />
        </div>
        <button className="tkb-btn tkb-btn-primary" onClick={handleRetrySave}>Save</button>
      </div>

      <div className="tkb-settings-section">
        <h3>Focus Weeks</h3>
        {settings.focusWeeks.length === 0 ? (
          <p>No focus weeks active.</p>
        ) : (
          <ul>
            {settings.focusWeeks.map(f => (
              <li key={f.id}>
                {subjectName(f.subjectId)} — x{f.multiplier} until {f.revertDate}{' '}
                <button className="tkb-btn tkb-btn-secondary" onClick={() => handleRemoveFocusWeek(f.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
        <div className="tkb-slider-row">
          <select value={newFocusSubject} onChange={(e) => setNewFocusSubject(e.target.value)}>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={newFocusMultiplier} onChange={(e) => setNewFocusMultiplier(e.target.value)}>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
          <input type="date" value={newFocusDate} onChange={(e) => setNewFocusDate(e.target.value)} />
          <button className="tkb-btn tkb-btn-primary" onClick={handleAddFocusWeek}>Add</button>
        </div>
      </div>

      <div className="tkb-settings-section">
        <h3>Toggles</h3>
        <div className="tkb-slider-row">
          <label>
            <input
              type="checkbox"
              checked={settings.selfRating}
              onChange={(e) => updateSettings({ selfRating: e.target.checked })}
            />
            {' '}Require self-rating to advance
          </label>
        </div>
        <div className="tkb-slider-row">
          <label htmlFor="tkb-color-mode">Color mode</label>
          <select
            id="tkb-color-mode"
            value={settings.colorMode}
            onChange={(e) => updateSettings({ colorMode: e.target.value })}
          >
            <option value="pool">Pool</option>
            <option value="subject">Subject</option>
          </select>
        </div>
      </div>

      <div className="tkb-settings-section">
        <h3>Flagged ({flagged.length})</h3>
        {flagged.length === 0 ? (
          <p>No flagged questions.</p>
        ) : (
          <ul>
            {flagged.map(q => (
              <li key={q.id}>
                {q.question.slice(0, 60)}{q.question.length > 60 ? '…' : ''} — {subjectName(q.subjectId)}{' '}
                <button className="tkb-btn tkb-btn-secondary" onClick={() => updateQuestion(q.id, { flagged: false })}>
                  Unflag
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tkb-settings-section">
        <h3>Drafts ({drafts.length})</h3>
        {drafts.length === 0 ? (
          <p>No drafts pending.</p>
        ) : (
          <>
            <button
              className="tkb-btn tkb-btn-primary"
              onClick={() => drafts.forEach(d => updateQuestion(d.id, { status: 'active' }))}
            >
              Approve All
            </button>
            <ul>
              {drafts.map(d => (
                <li key={d.id}>
                  {d.question.slice(0, 60)}{d.question.length > 60 ? '…' : ''} — {subjectName(d.subjectId)}{' '}
                  <button className="tkb-btn tkb-btn-secondary" onClick={() => updateQuestion(d.id, { status: 'active' })}>
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="tkb-settings-section">
        <h3>Data</h3>
        <button className="tkb-btn tkb-btn-primary" onClick={() => TkbStorage.downloadExport()}>
          Export JSON
        </button>
        <div style={{ marginTop: '1rem' }}>
          <textarea
            rows={6}
            style={{ width: '100%' }}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON to import…"
          />
          <button className="tkb-btn tkb-btn-secondary" onClick={handleImport}>Import</button>
        </div>
      </div>
    </div>
  );
}
