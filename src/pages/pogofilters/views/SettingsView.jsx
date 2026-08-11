import { useState, useMemo } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { DEFAULT_CP_PRESETS, isAssigned, SPECIES_STAR_CHOICES } from '../pogofiltersConfig';
import { planAdoption, applyAdoption } from '../applyEngine';
import { SPECIES_ROWS } from '../speciesTable';
import ApplyPreview from './ApplyPreview';

// Settings owns the deliberate decisions: the CP preset set, per-tier star
// defaults, and the Update button that pushes species assignments into the
// filters.
//
// Update is LIVE. It was inert through the first build; rewriting the filters
// from the matrix is the entire point of the tool, so it now opens the dry run
// and commits from there. Nothing is written without the diff being shown
// first, every commit snapshots the previous state, and Undo restores it.

// Declared outside the component: a component created during render would
// remount and lose state on every parent render.
function UpdateButton({ onClick }) {
  return (
    <button
      className="pgf-btn pgf-btn-primary"
      onClick={onClick}
      title="Shows the diff first — nothing is written until you confirm"
    >
      Update filters from these settings
    </button>
  );
}

export default function SettingsView() {
  const {
    settings, updateSettings, filters, labels, species, showToast, reseed,
    commitFilters, undo, hasUndo,
  } = usePogoFilters();
  const [presetDraft, setPresetDraft] = useState((settings?.cpPresets || DEFAULT_CP_PRESETS).join(', '));
  const [previewing, setPreviewing] = useState(false);

  const presets = settings?.cpPresets || DEFAULT_CP_PRESETS;
  const assigned = Object.values(species).filter(isAssigned).length;
  const untracked = Object.values(species).filter((s) => s.tracked === false).length;

  // The CP tiers your filters actually use, read off their queries. A preset
  // that isn't one of these can't produce a distinct result — two presets
  // falling between the same pair of filter tiers write byte-identical output —
  // so this is the set the tier buttons should be.
  const filterTiers = useMemo(
    () => [...new Set(filters.map((f) => f.cpTier).filter((n) => n != null))].sort((a, b) => a - b),
    [filters],
  );
  const presetsMatchFilters = filterTiers.length > 0
    && filterTiers.length === presets.length
    && filterTiers.every((t, i) => t === presets[i]);

  const savePresets = () => {
    const parsed = presetDraft.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    if (parsed.length < 2) { showToast('Give at least two CP tiers, comma separated', 'error'); return; }
    updateSettings({ cpPresets: [...new Set(parsed)].sort((a, b) => a - b) });
    showToast('CP tiers updated');
  };

  const useFilterTiers = () => {
    updateSettings({ cpPresets: filterTiers });
    setPresetDraft(filterTiers.join(', '));
    showToast(`CP tiers set to ${filterTiers.join(' / ')} — one button per filter tier`);
  };

  // Opt every CP-tier filter into being maintained by the matrix. Filters with
  // no CP term (TTE, Luckies, Megas…) are left alone: a species rule has
  // nothing to say about them.
  const manageAllTiers = () => {
    const targets = filters.filter((f) => f.cpTier != null && !f.managed);
    if (!targets.length) { showToast('Every CP-tier filter is already managed'); return; }
    const ids = new Set(targets.map((f) => f.id));
    commitFilters(
      filters.map((f) => (ids.has(f.id) ? { ...f, managed: true, updatedAt: Date.now() } : f)),
      `managed ${targets.length} CP-tier filters`,
    );
    showToast(`${targets.length} filters are now maintained by the matrix — Undo restores this`);
  };

  const onUpdateClick = () => setPreviewing(true);

  // Provenance: the engine may only remove species names it added itself, so a
  // name typed before this tool existed is invisible to the matrix — it gets
  // reported as "typed by hand, left alone" for ever. Adoption hands those over
  // in one explicit act, so the matrix becomes genuinely authoritative.
  const adoption = useMemo(() => planAdoption(filters, SPECIES_ROWS), [filters]);
  const adoptCount = adoption.reduce((n, r) => n + r.adopt.length, 0);

  const runAdoption = async () => {
    const saved = await commitFilters(
      applyAdoption(filters, adoption),
      `matrix took over ${adoptCount} species names in ${adoption.length} filters`,
    );
    if (saved) {
      showToast(`${adoptCount} species names are now the matrix's to maintain — no query text changed`);
    }
  };

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
        <button className="pgf-btn" onClick={manageAllTiers}>
          Manage all CP-tier filters ({filters.filter((f) => f.cpTier != null && !f.managed).length} off)
        </button>
        <button className="pgf-btn" disabled={!hasUndo} onClick={undo}>
          Undo last write
        </button>
        <span className="pgf-muted">
          {assigned} species assigned · {untracked} marked never-save
          · {filters.filter((f) => f.managed).length} of {filters.length} filters managed
        </span>
      </div>

      {previewing && (
        <ApplyPreview
          filters={filters}
          species={species}
          settings={settings}
          onApply={async (nextList, description) => {
            const saved = await commitFilters(nextList, description);
            if (saved) showToast(`${description} — Undo is available`);
            setPreviewing(false);
          }}
          onClose={() => setPreviewing(false)}
        />
      )}

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">Who owns the species names in your filters</div>
        <p className="pgf-sub">
          The engine only ever removes species names it added itself, so nothing it didn&apos;t write
          can be deleted by accident. The cost is that a name you typed before this tool existed is
          invisible to the matrix — it stays in the query for ever, and the matrix is not really in
          charge. Adopting hands those names over. <b>No query text changes</b>; only the record of
          who owns them, so the effect shows up in the next Apply, which you preview as usual.
        </p>
        {adoptCount === 0 ? (
          <p className="pgf-muted" style={{ margin: 0 }}>
            {filters.some((f) => f.managed)
              ? '✓ The matrix already owns every species name in your managed filters.'
              : 'Nothing to adopt yet — no filter is managed.'}
          </p>
        ) : (
          <>
            <div className="pgf-fcard-row" style={{ marginBottom: 8 }}>
              <button className="pgf-btn pgf-btn-primary" onClick={runAdoption}>
                Hand {adoptCount} species names to the matrix
              </button>
              <span className="pgf-muted">across {adoption.length} managed filters · undoable</span>
            </div>
            <p className="pgf-muted" style={{ margin: 0, lineHeight: 1.6 }}>
              {[...new Set(adoption.flatMap((r) => r.adopt.map((a) => a.name)))].slice(0, 12).join(', ')}
              {adoptCount > 12 ? ' …' : ''}
            </p>
          </>
        )}
      </div>

      <div className="pgf-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div className="pgf-h">CP tiers</div>
        <p className="pgf-sub">
          The tier buttons on the species matrix. Selecting a tier for a species means
          <b> keep it at that tier and above</b> — the engine writes <code>!name</code> into that
          tier&apos;s filter and every tier above it, and leaves lower tiers alone.
          Free numeric entry is always available per species regardless of what is set here.
        </p>

        {filterTiers.length > 0 && !presetsMatchFilters && (
          <div className="pgf-lint-row pgf-lint-warn" style={{ marginBottom: 10 }}>
            <span className="pgf-lint-badge">tiers don&apos;t match your filters</span>
            <span>
              Your filters use <b>{filterTiers.join(' / ')}</b>, these buttons are{' '}
              <b>{presets.join(' / ')}</b>. Two presets that fall between the same pair of filter
              tiers write byte-identical output, and a tier above your highest filter writes nothing
              at all — so some of these buttons cannot produce a distinct result.
              <button className="pgf-btn pgf-btn-sm" style={{ marginLeft: 10 }} onClick={useFilterTiers}>
                Use {filterTiers.join(' / ')}
              </button>
            </span>
          </div>
        )}

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
          Only 0–2 are offered: every trash filter starts <code>!3*&amp;!4*</code>, so 3★ and 4★ are
          already spared and a higher minimum would ask for protection no filter can give.
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
                  {SPECIES_STAR_CHOICES.map((n) => (
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
