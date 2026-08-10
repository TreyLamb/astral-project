import { analyze, TOKEN_KINDS } from '../filterSyntax';

// Renders a filter query as coloured tokens, with the user's labels as chips in
// their own colour. Purely a view of the string — the raw text in the editor
// below it stays the source of truth, so nothing here can corrupt a query.
const KIND_CLASS = {
  [TOKEN_KINDS.STAR]: 'pgf-tok-star',
  [TOKEN_KINDS.NUMERIC]: 'pgf-tok-num',
  [TOKEN_KINDS.DEX]: 'pgf-tok-num',
  [TOKEN_KINDS.KEYWORD]: 'pgf-tok-kw',
  [TOKEN_KINDS.TYPE]: 'pgf-tok-kw',
  [TOKEN_KINDS.SPECIES]: 'pgf-tok-species',
  [TOKEN_KINDS.MOVE]: 'pgf-tok-kw',
  [TOKEN_KINDS.UNKNOWN]: 'pgf-tok-unknown',
};

export default function QueryText({ query, vocab }) {
  const tokens = analyze(query, vocab);

  if (!query?.trim()) {
    return <div className="pgf-query"><span className="pgf-tok-op">empty query</span></div>;
  }

  return (
    <div className="pgf-query">
      {tokens.map((t, i) => {
        if (t.type === 'op') return <span key={i} className="pgf-tok-op">{t.raw}</span>;
        if (t.kind === TOKEN_KINDS.BLANK) return <span key={i}>{t.raw}</span>;

        const neg = t.negated ? <span className="pgf-tok-neg">!</span> : null;

        if (t.kind === TOKEN_KINDS.LABEL) {
          return (
            <span key={i}>
              {neg}
              <span
                className="pgf-tok pgf-tok-label"
                style={{ '--lc': t.label.color }}
                title={t.exact ? t.label.notes || t.label.name
                  : `Written as "${t.text}" but your label is "${t.label.name}" — caps and spaces matter in game`}
              >
                {t.text}
              </span>
            </span>
          );
        }

        const title = t.kind === TOKEN_KINDS.DEX && t.species
          ? `#${t.dex} ${t.species.name}`
          : t.kind === TOKEN_KINDS.UNKNOWN
            ? 'Matches no label, species, type or game keyword'
            : undefined;

        return (
          <span key={i}>
            {neg}
            <span className={`pgf-tok ${KIND_CLASS[t.kind] || ''}`} title={title}>{t.text}</span>
          </span>
        );
      })}
    </div>
  );
}
