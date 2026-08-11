import { officialArtworkUrl } from '../speciesTable';
import { REFERENCE_LEVELS, STAR_RATINGS } from '../pogofiltersConfig';

// Design C's side panel. Edits apply to the ENTIRE current selection, so it is
// both the single-species editor and the bulk editor — a single species is just
// a selection of one. Where the selection disagrees it says "Mixed" rather than
// showing one arbitrary member's value as if it were shared.

function mixed(rows, get) {
  const vals = [...new Set(rows.map(get))];
  return vals.length === 1 ? vals[0] : undefined; // undefined = mixed
}

export default function SpeciesPanel({ rows, presets, labels, onPatch }) {
  if (!rows.length) {
    return (
      <aside className="pgf-side">
        <p className="pgf-muted" style={{ marginTop: 60, textAlign: 'center', lineHeight: 1.7 }}>
          Click a species to edit it.<br />
          Shift-click for a range, Ctrl-click to add one.<br />
          <span style={{ opacity: 0.7 }}>↑ ↓ moves through the list.</span>
        </p>
      </aside>
    );
  }

  const one = rows.length === 1 ? rows[0] : null;
  const perStar = rows.every((r) => r.ruleMode === 'perStar');
  const tier = mixed(rows, (r) => r.tier);
  const stars = mixed(rows, (r) => r.starThreshold);
  const allNeedCustom = rows.every((r) => r.needsCustom);

  const tierSummary = () => {
    const counts = {};
    for (const r of rows) {
      const k = r.tier === null ? (r.customCp !== null ? `custom ${r.customCp}` : 'unset') : r.tier;
      counts[k] = (counts[k] || 0) + 1;
    }
    return Object.entries(counts).map(([k, v]) => `${v} @ ${k}`).join(', ');
  };

  return (
    <aside className="pgf-side">
      <div className="pgf-side-head">
        {one ? (
          <>
            <img className="pgf-side-art" src={officialArtworkUrl(one.dex)} alt=""
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            <div>
              <div className="pgf-muted">#{String(one.dex).padStart(3, '0')} · {one.types.join(' / ')}</div>
              <h3 className="pgf-side-name">{one.name}</h3>
            </div>
          </>
        ) : (
          <h3 className="pgf-side-name">
            Editing <span className="pgf-side-count">{rows.length}</span> species
          </h3>
        )}
      </div>

      {/* passive reference — same visual language as the table's shaded band */}
      <div className="pgf-side-card pgf-side-ref">
        <div className="pgf-h">Reference — read only · {REFERENCE_LEVELS.map((l) => `L${l}`).join(' / ')}</div>
        {rows.slice(0, 8).map((r) => (
          <div key={r.dex} className="pgf-side-refline">
            <b>{r.name}</b>
            <i>{REFERENCE_LEVELS.map((l) => String(r.cp[l]).padStart(4, ' ')).join(' ')}</i>
          </div>
        ))}
        {rows.length > 8 && <div className="pgf-muted">…and {rows.length - 8} more</div>}
      </div>

      <div className="pgf-side-card" hidden={perStar}>
        <div className="pgf-h">Selection — CP tier</div>
        {allNeedCustom ? (
          <p className="pgf-sub" style={{ margin: '0 0 8px' }}>
            {one ? `${one.name} maxes at ${one.maxCp} CP` : 'These all max out'} below the lowest preset,
            so every preset would silently mean “keep every one”. Use a custom value.
          </p>
        ) : (
          <div className="pgf-side-tiers">
            {presets.map((t) => (
              <button
                key={t}
                className={`pgf-tierbtn pgf-tierbtn-lg${tier === t ? ' on' : ''}`}
                onClick={() => onPatch({ tier: t, customCp: null })}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <input
          className="pgf-input" style={{ width: '100%', marginTop: 8 }}
          type="number" placeholder="custom CP…"
          defaultValue={one?.customCp ?? ''}
          key={rows.map((r) => r.dex).join(',')}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== '') onPatch({ customCp: Number(v), tier: null });
          }}
        />

        {tier === undefined && (
          <div className="pgf-side-mixed">⊘ Mixed — {tierSummary()}. Choosing a tier sets all {rows.length}.</div>
        )}

        <p className="pgf-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          Selecting a tier means <b>keep this species at that tier and above</b>. The apply engine
          writes <code>!name</code> into that tier's filter and every tier above it.
        </p>
      </div>

      <div className="pgf-side-card">
        <div className="pgf-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Rule
          <label className="pgf-switch" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0 }}>
            <input
              type="checkbox"
              checked={perStar}
              onChange={(e) => onPatch({ ruleMode: e.target.checked ? 'perStar' : 'flat' })}
            />
            <span className="pgf-switch-track" />
            Per-star CP
          </label>
        </div>

        {perStar ? (
          <>
            <p className="pgf-sub" style={{ margin: '0 0 10px' }}>
              A different CP bar per star rating — a better specimen earns a lower one.
              Blank means that rating is never kept.
            </p>
            {STAR_RATINGS.slice().reverse().map((n) => {
              const val = mixed(rows, (r) => r.starRules?.[n]);
              return (
                <div key={n} className="pgf-starrule">
                  <span className="pgf-stars">
                    {[1, 2, 3, 4].map((i) => <span key={i} className={n >= i ? '' : 'off'}>★</span>)}
                  </span>
                  <span className="pgf-muted" style={{ width: 28 }}>{n}★</span>
                  <span className="pgf-muted">keep from</span>
                  <input
                    className="pgf-input pgf-starrule-cp"
                    type="number"
                    placeholder={val === undefined ? 'mixed' : 'never'}
                    defaultValue={val ?? ''}
                    key={`${rows.map((r) => r.dex).join(',')}-${n}`}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      onPatch({
                        starRules: {
                          ...(one?.starRules || {}),
                          [n]: v === '' ? null : Number(v),
                        },
                      });
                    }}
                  />
                  <span className="pgf-muted">CP up</span>
                </div>
              );
            })}
            {one && (
              <p className="pgf-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                A trash filter is told to spare {one.name} when its star band contains any rating
                whose bar sits below that filter&apos;s CP tier.
              </p>
            )}
          </>
        ) : (
          <p className="pgf-sub" style={{ margin: 0 }}>
            One CP tier plus one minimum star rating, set below.
          </p>
        )}
      </div>

      <div className="pgf-side-card" hidden={perStar}>
        <div className="pgf-h">Minimum stars to keep</div>
        <div className="pgf-side-tiers">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={`pgf-tierbtn pgf-tierbtn-lg${stars === n ? ' on' : ''}`}
              onClick={() => onPatch({ starThreshold: n })}
            >
              {n}★
            </button>
          ))}
          <button
            className={`pgf-tierbtn pgf-tierbtn-lg${stars === null ? ' on' : ''}`}
            title="Use the default for this species' CP tier"
            onClick={() => onPatch({ starThreshold: null })}
          >
            inherit
          </button>
        </div>
        {stars === undefined && <div className="pgf-side-mixed">⊘ Mixed star minimums across the selection.</div>}
      </div>

      <div className="pgf-side-card">
        <div className="pgf-h">Labels</div>
        <div className="pgf-side-labels">
          {labels.map((l) => {
            const n = rows.filter((r) => r.labels.includes(l.name)).length;
            const state = n === 0 ? 'off' : n === rows.length ? 'on' : 'some';
            return (
              <button
                key={l.id}
                className={`pgf-lab${state === 'off' ? ' off' : ''}`}
                style={{ '--lc': l.color }}
                title={state === 'some' ? `On ${n} of ${rows.length}` : l.notes || l.name}
                onClick={() => {
                  const add = state !== 'on';
                  onPatch({
                    labels: add
                      ? [...new Set([...(one?.labels || []), l.name])]
                      : (one?.labels || []).filter((x) => x !== l.name),
                  });
                }}
              >
                {l.name}{state === 'some' ? ` (${n}/${rows.length})` : ''}
              </button>
            );
          })}
          {labels.length === 0 && <span className="pgf-muted">No labels yet — add them in the Labels tab.</span>}
        </div>
      </div>

      {one && (
        <div className="pgf-side-card">
          <div className="pgf-h">Notes</div>
          <textarea
            className="pgf-textarea" style={{ minHeight: 64, fontFamily: 'inherit' }}
            placeholder="Why this threshold, what you keep it for…"
            defaultValue={one.notes}
            key={one.dex}
            onBlur={(e) => onPatch({ notes: e.target.value })}
          />
        </div>
      )}

      <div className="pgf-side-card">
        <label className="pgf-switch">
          <input
            type="checkbox"
            checked={rows.every((r) => r.tracked)}
            onChange={(e) => onPatch({ tracked: e.target.checked })}
          />
          <span className="pgf-switch-track" />
          Keep — I might want to save {rows.length === 1 ? 'this species' : 'these'}
        </label>
        <p className="pgf-muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          Unchecking hides it from this list and guarantees it is never protected in any filter.
        </p>
      </div>
    </aside>
  );
}
