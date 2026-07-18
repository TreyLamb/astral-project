// Medal bulk upload -- requirement #5. Paste raw per-medal numbers (one per
// line, e.g. "Kanto: 1234" or "Collector 1234"), fuzzy-match each line
// against the medal list, review/correct the matches, then apply them all
// to the active account in one action. Modeled on POGO Accs' ImportView.jsx
// paste-then-preview-then-commit flow (see src/pages/pogoaccs/ImportView.jsx)
// so the interaction pattern is familiar across sub-apps.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import { parseMedalBulkText, MEDALS } from './medaldexEngine';

let rowKeySeq = 0;
function nextRowKey() {
  rowKeySeq += 1;
  return `bulk-row-${rowKeySeq}`;
}

const MEDAL_OPTIONS = MEDALS.slice().sort((a, b) => a.name.localeCompare(b.name));

const PLACEHOLDER = [
  'Paste one medal per line, e.g.',
  'Kanto: 1234',
  'Collector 1234',
  'Great League Veteran - 500',
  'best buddy 40',
].join('\n');

export default function BulkUpdate() {
  const { accounts, medals, activeAccountId, actions, loading } = useMedalDex();
  const [pasteText, setPasteText] = useState('');
  const [rows, setRows] = useState(null); // null = not parsed yet
  const [unmatched, setUnmatched] = useState([]);
  const [confirmMsg, setConfirmMsg] = useState(null);

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!activeAccountId) {
    return <div className="mdx-panel mdx-empty">No active account selected.</div>;
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountMedals = medals[activeAccountId]?.medals || {};

  const runParse = () => {
    const result = parseMedalBulkText(pasteText);
    setRows(result.matched.map((m) => ({
      key: nextRowKey(),
      line: m.line,
      medalId: m.medalId,
      value: m.value,
      matchType: m.matchType,
      included: true,
    })));
    setUnmatched(result.unmatched);
    setConfirmMsg(null);
  };

  const updateRow = (key, updates) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...updates } : r)));
  };

  const includedRows = (rows || []).filter((r) => r.included && r.medalId);
  const matchTypeCounts = (rows || []).reduce((acc, r) => {
    acc[r.matchType] = (acc[r.matchType] || 0) + 1;
    return acc;
  }, {});

  const applyAll = async () => {
    if (includedRows.length === 0) return;
    // Last-write-wins if the pasted text repeats a medal on multiple lines
    // (e.g. copy/pasted twice) -- dedupe by medalId, keeping the LAST
    // included row's value, same "latest entry wins" semantics as typing
    // into the same input field twice.
    const byMedal = new Map();
    includedRows.forEach((r) => byMedal.set(r.medalId, r.value));
    await Promise.all(
      Array.from(byMedal.entries()).map(([medalId, value]) => actions.setMedalValue(activeAccountId, medalId, value))
    );
    setConfirmMsg(`Applied ${byMedal.size} medal${byMedal.size === 1 ? '' : 's'} to ${activeAccount?.name || 'this account'}.`);
    setRows(null);
    setUnmatched([]);
    setPasteText('');
    setTimeout(() => setConfirmMsg(null), 4000);
  };

  return (
    <div className="mdx-view mdx-bulk-update">
      <div className="mdx-panel mdx-panel-accent">
        <div className="mdx-section-row">
          <div className="mdx-section-label">Bulk update — {activeAccount?.name || 'Trainer'}</div>
          <Link to="/medaldex/medals" className="mdx-link">&larr; Back to Medals</Link>
        </div>
        <p className="mdx-bulk-hint">
          Paste raw medal numbers, one per line. Each line should end in a number; everything before it is
          matched (fuzzily -- typos and small variations are fine) against the {MEDALS.length} medal names.
          Review the matches below, fix any that guessed wrong, then apply them all at once.
        </p>
        <textarea
          className="mdx-input mdx-bulk-textarea"
          rows={7}
          placeholder={PLACEHOLDER}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <div className="mdx-bulk-actions">
          <button type="button" className="mdx-chip mdx-bulk-parse-btn" onClick={runParse} disabled={!pasteText.trim()}>
            Parse
          </button>
        </div>
      </div>

      {confirmMsg && <div className="mdx-panel mdx-bulk-confirm">{confirmMsg}</div>}

      {rows !== null && (
        <div className="mdx-panel">
          <div className="mdx-section-label">Parse summary</div>
          <div className="mdx-bulk-summary">
            <span className="mdx-badge mdx-bulk-summary-matched">{rows.length} matched</span>
            <span className="mdx-badge mdx-bulk-summary-unmatched">{unmatched.length} unmatched</span>
            {matchTypeCounts.fuzzy > 0 && (
              <span className="mdx-badge mdx-bulk-summary-fuzzy">{matchTypeCounts.fuzzy} fuzzy-matched — double check these</span>
            )}
          </div>

          {rows.length > 0 && (
            <div className="mdx-bulk-table-wrap">
              <table className="mdx-bulk-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Matched medal</th>
                    <th>Value</th>
                    <th>Match</th>
                    <th>Include</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const current = accountMedals[row.medalId] ?? 0;
                    return (
                      <tr key={row.key} className="mdx-bulk-row">
                        <td className="mdx-bulk-row-line">{row.line}</td>
                        <td>
                          <select
                            className="mdx-select"
                            value={row.medalId}
                            onChange={(e) => updateRow(row.key, { medalId: e.target.value })}
                          >
                            {MEDAL_OPTIONS.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="mdx-input mdx-bulk-value-input"
                            value={row.value}
                            onChange={(e) => updateRow(row.key, { value: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                          />
                          {current > 0 && <span className="mdx-bulk-current-hint"> (was {current.toLocaleString()})</span>}
                        </td>
                        <td>
                          <span className={`mdx-badge mdx-bulk-matchtype-${row.matchType}`}>{row.matchType}</span>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={row.included}
                            onChange={(e) => updateRow(row.key, { included: e.target.checked })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mdx-bulk-actions">
            <button
              type="button"
              className="mdx-chip mdx-chip-on mdx-bulk-apply-btn"
              onClick={applyAll}
              disabled={includedRows.length === 0}
            >
              Apply {includedRows.length} to {activeAccount?.name || 'account'}
            </button>
          </div>

          {unmatched.length > 0 && (
            <>
              <div className="mdx-section-label mdx-bulk-unmatched-label">Unmatched lines</div>
              <ul className="mdx-notes-list">
                {unmatched.map((u, i) => (
                  <li key={i} className="mdx-notes-item mdx-bulk-unmatched-item">
                    <strong>{u.line}</strong> — {u.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
