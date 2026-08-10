import { useState } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { DEFAULT_CP_PRESETS } from '../pogofiltersConfig';
import ApplyPreview from './ApplyPreview';

// Settings owns the deliberate decisions: the CP preset set, per-tier star
// defaults, and the Update button that would push species assignments into the
// filters.
//
// Per Trey's explicit instruction the Update button is WIRED TO NOTHING in this
// build. It renders, it's positioned top and bottom, it's styled, and it is
// inert. The apply engine is built and testable through its dry-run preview;
// only the commit is disconnected until he says otherwise.

// Declared outside the component: a component created during render would
// remount and lose state on every parent render.
function UpdateButton({ onClick }) {
  return (
    <button
      className="pgf-btn pgf-btn-primary"
      onClick={onClick}
      title="Not wired up yet, by request"
    >
      Update filters from these settings
    </button>
  );
}

export default function SettingsView() {
  const { settings, updateSettings, filters, labels, species, showToast, reseed } = usePogoFilters();
  const [presetDraft, setPresetDraft] = useState((settings?.cpPresets || DEFAULT_CP_PRESETS).join(', '));
  const [previewing, setPreviewing] = useState(false);

  const presets = settings?.cpPresets || DEFAULT_CP_PRESETS;
  const assigned = Object.values(species).filter((s) => s.tier !== null || s.customCp !== null).length;
  const untracked = Object.values(species).filter((s) => s.tracked === false).length;

  const savePresets = () => {
    const parsed = presetDraft.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    if (parsed.length < 2) { showToast('Give at least two CP tiers, comma separated', 'error'); return; }
    updateSettings({ cpPresets: [...new Set(parsed)].sort((a, b) => a - b) });
    showToast('CP tiers updated');
  };

  const onUpdateClick = () =>
    showToast('Update is intentionally not wired up yet — nothing was written to your filters.');

  // Regenerates Existingfilters.md's shape — heading line, then the query — so
  // the markdown that has been the source of truth since 2026-07-18 can be
  // refreshed from the app rather than hand-maintained alongside it.
  const exportMarkdown = () => {
    const lines = ['# Existing filters', '', `_Exported from PogoFilters on ${new Date().toISOString().slice(0, 10)}._`, ''];
    const groups = [...new Set(filters.map((f) => f.group || ''))];
    for (const g of groups) {
      if (g) lines.push(`## ${g}`, '');
      for (const f of filters.filter((x) => (x.group || '') === g)) {
        lines.push(`${f.name}:`);
        lines.push(f.query);
        if (f.notes) lines.push(`> ${f.notes.replace(/\n/g, '\n> ')}`);
        lines.push('');
      }
    }
    lines.push('', '# Labels', '');
    for (const l of labels) lines.push(`${l.name}${l.notes ? `: ${l.notes}` : ''}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Existingfilters.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ filters, labels, species, settings }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pogofilters-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <UpdateButton onClick={onUpdateClick} />
        <button className="pgf-btn" onClick={() => setPreviewing(true)}>
          Preview what it would write
        </button>
        <span className="pgf-muted">
          {assigned} species assigned · {untracked} marked never-save
        </span>
      </div>

      {previewing && (
        <ApplyPreview
          filters={filters}
          species={species}
          settings={settings}
          onClose={() => setPreviewing(false)}
        />
      )}

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">CP tiers</div>
        <p className="pgf-sub">
          The tier buttons on the species matrix. Selecting a tier for a species means
          <b> keep it at that tier and above</b> — the engine writes <code>!name</code> into that
          tier&apos;s filter and every tier above it, and leaves lower tiers alone.
          Free numeric entry is always available per species regardless of what is set here.
        </p>
        <div className="pgf-fcard-row">
          <input
            className="pgf-input" style={{ flex: '1 1 260px' }}
            value={presetDraft}
            onChange={(e) => setPresetDraft(e.target.value)}
            placeholder="800, 1300, 1600, 1900, 2300"
          />
          <button className="pgf-btn" onClick={savePresets}>Save tiers</button>
          <button
            className="pgf-btn pgf-btn-sm"
            onClick={() => { setPresetDraft(DEFAULT_CP_PRESETS.join(', ')); }}
          >
            Reset to default
          </button>
        </div>
        <div className="pgf-fcard-row">
          {presets.map((t) => <span key={t} className="pgf-tierbtn on" style={{ cursor: 'default' }}>{t}</span>)}
        </div>
      </div>

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">Default minimum stars per tier</div>
        <p className="pgf-sub">
          Most species should inherit rather than be decided one at a time. A species only needs
          its own star setting where you actually care — everything else follows its tier.
        </p>
        <table className="pgf-table">
          <thead>
            <tr><th style={{ width: 120 }}>CP tier</th><th>Minimum stars to keep</th></tr>
          </thead>
          <tbody>
            {presets.map((t) => (
              <tr key={t}>
                <td><span className="pgf-tierbtn on" style={{ cursor: 'default' }}>{t}</span></td>
                <td>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      className={`pgf-tierbtn${(settings?.tierStarDefaults?.[t] ?? 0) === n ? ' on' : ''}`}
                      onClick={() => updateSettings({
                        tierStarDefaults: { ...(settings?.tierStarDefaults || {}), [t]: n },
                      })}
                    >
                      {n}★
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">Matrix density</div>
        <div className="pgf-fcard-row">
          {['compact', 'comfortable'].map((d) => (
            <button
              key={d}
              className={`pgf-chip${(settings?.density || 'compact') === d ? ' on' : ''}`}
              onClick={() => updateSettings({ density: d })}
            >
              {d === 'compact' ? 'Compact — ~35 rows visible' : 'Comfortable — bigger sprites'}
            </button>
          ))}
        </div>
      </div>

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">Data</div>
        <div className="pgf-fcard-row">
          <button className="pgf-btn" onClick={exportMarkdown}>Export filters as markdown</button>
          <button className="pgf-btn" onClick={exportJson}>Export everything as JSON</button>
          <button
            className="pgf-btn pgf-btn-danger"
            onClick={() => {
              if (confirm('Replace all filters and labels with the versions in Existingfilters.md / ExistingLabels.md? Your species assignments are kept.')) reseed();
            }}
          >
            Reload filters from markdown
          </button>
        </div>
        <p className="pgf-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          {filters.length} filters · {labels.length} labels · {Object.keys(species).length} species touched
        </p>
      </div>

      <div className="pgf-chipbar" style={{ marginTop: 16 }}>
        <UpdateButton onClick={onUpdateClick} />
      </div>
    </div>
  );
}
