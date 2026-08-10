import { useMemo } from 'react';
import { addTerm, removeTerm, validateQuery } from '../applyEngine';
import { terms } from '../filterSyntax';

// "Add !fire to one filter and it goes on the end of the others too."
//
// Deliberately reuses addTerm/removeTerm from applyEngine rather than doing its
// own string surgery, so there is exactly one implementation of "change a query
// without breaking it" in this app. Every bulk change is previewed here and
// committed through commitFilters, which snapshots first so undo always works.

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export default function BulkTermModal({ pending, filters, onCancel, onConfirm }) {
  const { term, action, scope } = pending;

  const targets = useMemo(() => (
    scope === 'managed' ? filters.filter((f) => f.managed) : filters
  ), [filters, scope]);

  const plan = useMemo(() => targets.map((f) => {
    const present = terms(f.query).find((t) => norm(t.text) === norm(term.replace(/^!/, '')));
    let after = f.query;
    let note = null;

    if (action === 'add') {
      if (present) {
        note = `already present as "${present.raw.trim()}"`;
      } else {
        after = addTerm(f.query, term);
      }
    } else {
      if (!present) note = 'not in this filter';
      else after = removeTerm(f.query, term);
    }

    return { filter: f, before: f.query, after, note, invalid: after === f.query ? null : validateQuery(after) };
  }), [targets, term, action]);

  const changing = plan.filter((p) => p.after !== p.before && !p.invalid);
  const broken = plan.filter((p) => p.invalid);

  return (
    <div className="pgf-modal-back" onClick={onCancel}>
      <div className="pgf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="pgf-modal-title">
          {action === 'add' ? 'Add' : 'Remove'} <code>{term}</code>
          {' '}{action === 'add' ? 'to' : 'from'} {changing.length} filter{changing.length === 1 ? '' : 's'}
        </h3>
        <p className="pgf-sub">
          Scope: {scope === 'managed' ? 'managed filters only' : 'every filter'} ({targets.length}).
          This is undoable from the toolbar afterwards.
        </p>

        {broken.length > 0 && (
          <div className="pgf-lint-row pgf-lint-error" style={{ marginBottom: 12 }}>
            <span className="pgf-lint-badge">blocked</span>
            <span>
              {broken.length} filter{broken.length === 1 ? '' : 's'} would end up malformed and will
              be left untouched: {broken.map((p) => `${p.filter.name} (${p.invalid})`).join('; ')}
            </span>
          </div>
        )}

        {changing.length === 0 && (
          <div className="pgf-lint-row pgf-lint-info">
            <span className="pgf-lint-badge">nothing to do</span>
            <span>
              {action === 'add'
                ? 'Every filter in scope already has this term.'
                : 'No filter in scope contains this term.'}
            </span>
          </div>
        )}

        <div className="pgf-diff">
          {changing.map((p) => (
            <div key={p.filter.id}>
              <div className="pgf-diff-file">{p.filter.name}</div>
              <span className="pgf-diff-del">− {p.before}</span>
              <span className="pgf-diff-add">+ {p.after}</span>
            </div>
          ))}
        </div>

        {plan.some((p) => p.note) && (
          <p className="pgf-muted" style={{ marginTop: 10 }}>
            Unchanged: {plan.filter((p) => p.note).slice(0, 8).map((p) => `${p.filter.name} (${p.note})`).join('; ')}
            {plan.filter((p) => p.note).length > 8 ? ' …' : ''}
          </p>
        )}

        <div className="pgf-modal-actions">
          <button className="pgf-btn" onClick={onCancel}>Cancel</button>
          <button
            className="pgf-btn pgf-btn-primary"
            disabled={!changing.length}
            onClick={() => {
              const byId = new Map(changing.map((p) => [p.filter.id, p.after]));
              onConfirm(
                filters.map((f) => (byId.has(f.id) ? { ...f, query: byId.get(f.id), updatedAt: Date.now() } : f)),
                `${action === 'add' ? 'Add' : 'Remove'} "${term}" ${action === 'add' ? 'to' : 'from'} ${changing.length} filters`,
              );
            }}
          >
            Apply to {changing.length}
          </button>
        </div>
      </div>
    </div>
  );
}
