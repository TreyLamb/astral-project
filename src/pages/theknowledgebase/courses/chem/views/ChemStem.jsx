// Lays a question stem out the way a printed exam would (Trey, 2026-11-02: "you can't just paste
// garbage and expect a human to read it"). Stems stay plain strings in the templates; this reads
// their line breaks and gives each kind of line its own look:
//   - a reaction (has →) sits centred on its own line, with any trailing "ΔH = … kJ" set beside it;
//   - "Label: A 1.0 · B 2.0" becomes a small two-column table;
//   - everything else is a paragraph.
// ΔH°f / ΔH°rxn get a small raised ° and a lowered label, and a hyphen before a number becomes a
// real minus sign.

const MINUS = /(^|[\s(=:,])-(?=\d)/g;
const DH = /ΔH°(rxn|f)|ΔHf°|ΔH_f/g;

export function inline(text, key = 0) {
  const s = String(text).replace(MINUS, '$1−');
  const out = [];
  let last = 0;
  let m;
  DH.lastIndex = 0;
  while ((m = DH.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const sub = m[1] ?? 'f';
    out.push(<span key={`${key}-${m.index}`} className="chq-dh">ΔH<sup>°</sup><sub>{sub}</sub></span>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function dataRows(list) {
  return list.split(' · ').map((item) => {
    const t = item.trim().replace(/\.$/, '');
    const i = t.lastIndexOf(' ');
    return i > 0 ? [t.slice(0, i), t.slice(i + 1)] : [t, ''];
  });
}

export default function ChemStem({ text, className = 'chq-stem' }) {
  const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <div className={className}>
      {lines.map((line, i) => {
        if (line.includes('→')) {
          const [eq, dh] = line.split(/\s{2,}|,\s*(?=ΔH)/);
          return (
            <div key={i} className="chq-eq">
              {/* Reactants and "→ products" each stay whole, so a phone wraps at the arrow. */}
              <span className="chq-eq-side">{inline(eq.split('→')[0].trim(), `${i}a`)}</span>
              <span className="chq-eq-side">→ {inline(eq.split('→').slice(1).join('→').trim(), `${i}b`)}</span>
              {dh && <span className="chq-eq-dh">{inline(dh, `${i}d`)}</span>}
            </div>
          );
        }
        // A short label, then either a "·" list or a single "name value" pair.
        const data = line.match(/^([^:]{1,70}):\s*([^:]+ · [^:]+?|[^:·]+ [−-]?\d[\d.]*)(?:\.\s+(.*))?$/);
        if (data) {
          const [, label, list, rest] = data;
          return (
            <div key={i}>
              <p className="chq-data-label">{inline(label, `${i}l`)}</p>
              <table className="chq-data"><tbody>
                {dataRows(list).map(([k, v], j) => (
                  <tr key={j}><td>{inline(k, `${i}-${j}k`)}</td><td>{inline(v, `${i}-${j}v`)}</td></tr>
                ))}
              </tbody></table>
              {rest && <p>{inline(rest, `${i}r`)}</p>}
            </div>
          );
        }
        return <p key={i}>{inline(line, i)}</p>;
      })}
    </div>
  );
}
