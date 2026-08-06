// Bulk pokébox import: files (xlsx/xls/docx/csv/md/txt) and/or a freeform
// paste box are turned into raw lines, run through the same species matcher
// as the Pokébox quick-add (see BoxView.jsx / parse/lineParser.js), and shown
// in an editable preview before anything is committed to the box.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePogoAccs } from './pogoaccsContext';
import { buildSpeciesIndex } from './parse/speciesIndex';
import { parseFreeform } from './parse/lineParser';
import { extractLines } from './parse/fileExtractors';
import { uid, withEntryDefaults } from './pogoaccsConfig';
import speciesData from './data/species.json';

const ACCEPT = '.xlsx,.xls,.docx,.csv,.md,.txt';

function statusFor(result) {
  if (result.error) return 'error';
  if (result.splitEntries) return 'review';
  if (result.confidence === 'fuzzy') return 'review';
  return 'matched';
}

function statusLabel(status) {
  if (status === 'error') return 'Error';
  if (status === 'review') return 'Needs Review';
  return 'Matched';
}

// Expands each parsed line into one or more editable preview rows —
// splitEntries (from a "cp 1200,1300" style line) become independent rows
// so each can be individually included/excluded/re-speciesed.
function buildPreviewRows(parsedLines) {
  const rows = [];
  parsedLines.forEach((result) => {
    const status = statusFor(result);

    if (result.error) {
      rows.push({
        key: uid(),
        rawLine: result.line,
        status,
        speciesId: null,
        count: 1,
        included: false,
        entryDraft: null,
      });
      return;
    }

    const entries = result.splitEntries || [result.entry];
    entries.forEach((entry) => {
      rows.push({
        key: uid(),
        rawLine: result.line,
        status,
        speciesId: entry.speciesId,
        count: entry.count,
        included: true,
        entryDraft: entry,
      });
    });
  });
  return rows;
}

export default function ImportView() {
  const { accounts, actions, loading } = usePogoAccs();

  const speciesIndex = useMemo(() => buildSpeciesIndex(speciesData.species), []);
  const speciesOptions = useMemo(
    () => Object.entries(speciesData.species)
      .map(([id, s]) => ({ id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  // Derived (not synced-via-effect): defaults to the first account until the
  // user explicitly picks a different one, and re-derives if that pick ever
  // stops being valid (e.g. accounts reload).
  const [manualTargetAccountId, setManualTargetAccountId] = useState(null);
  const targetAccountId = manualTargetAccountId && accounts.some((a) => a.id === manualTargetAccountId)
    ? manualTargetAccountId
    : (accounts[0]?.id ?? '');

  const [uploadedLines, setUploadedLines] = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [previewRows, setPreviewRows] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  if (loading) {
    return <div className="pgoa-panel pgoa-loading">Loading…</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="pgoa-panel pgoa-empty">
        No accounts yet — create them in <Link className="pgoa-link" to="/POGO">POGO Tracker</Link>.
      </div>
    );
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    for (const file of files) {
      try {
        const lines = await extractLines(file);
        setUploadedLines((prev) => [...prev, ...lines]);
        setFileNames((prev) => [...prev, file.name]);
        setFileError(null);
      } catch (err) {
        setFileError(`${file.name}: ${err.message}`);
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const clearFiles = () => {
    setUploadedLines([]);
    setFileNames([]);
    setFileError(null);
  };

  const runParse = () => {
    const pasteLines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const allLines = [...uploadedLines, ...pasteLines];
    if (!allLines.length) return;
    const parsed = parseFreeform(allLines.join('\n'), speciesIndex);
    setPreviewRows(buildPreviewRows(parsed));
    setConfirmMsg(null);
  };

  const updateRow = (key, updates) => {
    setPreviewRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...updates } : row)));
  };

  const setRowSpecies = (key, speciesId) => {
    setPreviewRows((prev) => prev.map((row) => {
      if (row.key !== key) return row;
      const included = row.status === 'error' ? !!speciesId : row.included;
      return { ...row, speciesId, included };
    }));
  };

  const includedRows = (previewRows || []).filter((r) => r.included && r.speciesId);

  const runImport = () => {
    if (!includedRows.length) return;
    const entries = includedRows.map((row) => withEntryDefaults({
      ...(row.entryDraft || {}),
      id: undefined,
      speciesId: row.speciesId,
      count: Math.max(1, parseInt(row.count, 10) || 1),
    }));

    const accountName = accounts.find((a) => a.id === targetAccountId)?.name ?? 'account';
    actions.addEntries(targetAccountId, entries);
    setConfirmMsg(`Imported ${entries.length} row${entries.length === 1 ? '' : 's'} to ${accountName}.`);
    setPreviewRows(null);
    setUploadedLines([]);
    setFileNames([]);
    setPasteText('');
    setTimeout(() => setConfirmMsg(null), 3000);
  };

  return (
    <div className="pgoa-panel pgoa-panel-accent">
      <div className="pgoa-section-label">Bulk Import</div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="pgoa-import-target" style={{ marginRight: '0.75rem' }}>Target account:</label>
        <select
          id="pgoa-import-target"
          className="pgoa-select"
          value={targetAccountId}
          onChange={(e) => setManualTargetAccountId(e.target.value)}
        >
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div
        className={`pgoa-dropzone${isDragging ? ' pgoa-dropzone-active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p>Drag &amp; drop .xlsx, .xls, .docx, .csv, .md, or .txt files here</p>
        <input type="file" multiple accept={ACCEPT} onChange={onFileInputChange} />
      </div>

      {fileNames.length > 0 && (
        <div className="pgoa-import-list" style={{ marginTop: '0.75rem' }}>
          {fileNames.map((name, i) => (
            <div key={`${name}-${i}`} className="pgoa-import-row">
              <span>{name}</span>
            </div>
          ))}
          <button className="pgoa-btn" onClick={clearFiles}>Clear files</button>
        </div>
      )}
      {fileError && <p className="pgoa-parse-error">{fileError}</p>}

      <div className="pgoa-section-label" style={{ marginTop: '1.5rem' }}>Or paste freeform text</div>
      <textarea
        className="pgoa-input"
        rows={6}
        style={{ width: '100%', maxWidth: '40rem', resize: 'vertical', display: 'block' }}
        placeholder={'One Pokémon per line, e.g.\n6 machamps around lvl 20\n1 rayquaza 13/15/15 best buddy'}
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
      />

      <div style={{ margin: '1.25rem 0' }}>
        <button className="pgoa-btn pgoa-btn-primary" onClick={runParse}>Parse</button>
      </div>

      {confirmMsg && <p className="pgoa-confirm-flash">{confirmMsg}</p>}

      {previewRows && (
        previewRows.length === 0 ? (
          <div className="pgoa-empty">No lines to parse — add files or paste some text above.</div>
        ) : (
          <>
            <div className="pgoa-table-wrap">
              <table className="pgoa-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Status</th>
                    <th>Species</th>
                    <th>Count</th>
                    <th>Include</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.key} className="pgoa-row">
                      <td className="pgoa-row-line">{row.rawLine}</td>
                      <td><span className="pgoa-badge">{statusLabel(row.status)}</span></td>
                      <td>
                        <select
                          className="pgoa-select"
                          value={row.speciesId ?? ''}
                          onChange={(e) => setRowSpecies(row.key, e.target.value || null)}
                        >
                          <option value="">— pick species —</option>
                          {speciesOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="pgoa-input"
                          type="number"
                          min="1"
                          value={row.count}
                          onChange={(e) => updateRow(row.key, { count: e.target.value })}
                          style={{ width: '4.5rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.included}
                          disabled={row.status === 'error' && !row.speciesId}
                          onChange={(e) => updateRow(row.key, { included: e.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ margin: '1rem 0' }}>
              <button className="pgoa-btn pgoa-btn-primary" onClick={runImport} disabled={includedRows.length === 0}>
                Import
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
