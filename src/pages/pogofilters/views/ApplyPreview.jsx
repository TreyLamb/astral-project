import { useMemo } from 'react';
import { planApply } from '../applyEngine';
import { SPECIES_ROWS } from '../speciesTable';

// The dry run. Every automated edit is inspected here before anything is
// written — and in this build nothing is written at all, because the Update
// button is deliberately inert. This is the whole safety story made visible.

function TokenDiff({ before, after }) {
  const beforeSet = new Set(before.split('&'));
  const afterSet = new Set(after.split('&'));
  return (
    <>
      <span className="pgf-diff-del">
        − {before.split('&').map((t, i) => (
          <span key={i}>
            {i > 0 && '&'}
            <span className={afterSet.has(t) ? '' : 'pgf-diff-tok-del'}>{t}</span>
          </span>
        ))}
      </span>
      <span className="pgf-diff-add">
        + {after.split('&').map((t, i) => (
          <span key={i}>
            {i > 0 && '&'}
            <span className={beforeSet.has(t) ? '' : 'pgf-diff-tok-add'}>{t}</span>
          </span>
        ))}
      </span>
    </>
  );
}

export default function ApplyPreview({ filters, species, settings, onClose }) {
  const plan = useMemo(
    () => planApply({ filters, species, speciesRows: SPECIES_ROWS, settings }),
    [filters, species, settings],
  );

  const { summary, changes, conflicts } = plan;
  const managedCount = filters.filter((f) => f.managed).length;

  return (
    <div className="pgf-modal-back" onClick={onClose}>
      <div className="pgf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="pgf-modal-title">What the engine would write</h3>
        <p className="pgf-sub">
          A dry run over the {managedCount} filter{managedCount === 1 ? '' : 's'} you&apos;ve marked
          managed. <b>Nothing is written</b> — the Update button is intentionally not wired up yet.
        </p>

        <div className="pgf-chipbar">
          <span className="pgf-chip on">{summary.filtersTouched} filters would change</span>
          <span className="pgf-chip">{summary.added} added</span>
          <span className="pgf-chip">{summary.removed} removed</span>
          <span className="pgf-chip">{summary.skipped} skipped</span>
          {summary.blocked > 0 && <span className="pgf-chip warn on">{summary.blocked} blocked</span>}
          {summary.rolledBack > 0 && <span className="pgf-chip warn on">{summary.rolledBack} rolled back</span>}
          {summary.conflicts > 0 && <span className="pgf-chip warn on">{summary.conflicts} conflicts</span>}
        </div>

        {managedCount === 0 && (
          <div className="pgf-lint-row pgf-lint-info">
            <span className="pgf-lint-badge">nothing to do</span>
            <span>
              No filter is marked <b>Managed</b>. Open a filter on the Filters tab and turn Managed
              on to let the species matrix maintain species names inside it.
            </span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="pgf-lint" style={{ marginBottom: 14 }}>
            {conflicts.map((c) => (
              <div key={c.dex} className="pgf-lint-row pgf-lint-error">
                <span className="pgf-lint-badge">conflict</span>
                <span>{c.message}</span>
              </div>
            ))}
          </div>
        )}

        {changes.length === 0 && managedCount > 0 && (
          <div className="pgf-lint-row pgf-lint-info">
            <span className="pgf-lint-badge">in sync</span>
            <span>Your managed filters already match every species assignment. Nothing to change.</span>
          </div>
        )}

        <div className="pgf-diff">
          {changes.map((c) => (
            <div key={c.filter.id}>
              <div className="pgf-diff-file">
                {c.filter.name}
                {c.filter.cpTier && <span className="pgf-muted"> · cp{c.filter.cpTier}</span>}
                {c.invalid && (
                  <span className="pgf-lint-badge pgf-lint-error" style={{ marginLeft: 8 }}>
                    rolled back — {c.invalid}
                  </span>
                )}
              </div>

              {c.after === c.before ? (
                <span className="pgf-muted">No change to the query.</span>
              ) : (
                <TokenDiff before={c.before} after={c.after} />
              )}

              {c.blocked.length > 0 && (
                <div className="pgf-lint" style={{ marginTop: 6 }}>
                  {c.blocked.map((b) => (
                    <div key={b.dex} className="pgf-lint-row pgf-lint-error">
                      <span className="pgf-lint-badge">blocked</span>
                      <span>{b.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {c.skipped.length > 0 && (
                <p className="pgf-muted" style={{ marginTop: 4 }}>
                  Skipped: {c.skipped.slice(0, 6).map((s) => `${s.name} (${s.reason})`).join('; ')}
                  {c.skipped.length > 6 ? ` …and ${c.skipped.length - 6} more` : ''}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pgf-modal-actions">
          <button className="pgf-btn" onClick={onClose}>Close</button>
          <button
            className="pgf-btn pgf-btn-primary"
            disabled
            title="Deliberately not wired up in this build"
          >
            Apply (not wired up)
          </button>
        </div>
      </div>
    </div>
  );
}
