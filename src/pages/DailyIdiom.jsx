import { useState, useEffect, useRef } from 'react';
import './DailyIdiom.css';

const IDIOM_INDEX_KEY = 'chineseIdiomIndex';
const IDIOM_DATE_KEY  = 'chineseIdiomDate';

function getDayLabel() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h === 0 && m < 1) {
    return new Date(now.getTime() - 86_400_000).toDateString();
  }
  return now.toDateString();
}

function resolveIndex(total) {
  const today   = getDayLabel();
  const lastDay = localStorage.getItem(IDIOM_DATE_KEY);
  let   idx     = parseInt(localStorage.getItem(IDIOM_INDEX_KEY) ?? '0', 10);
  if (lastDay !== today) {
    if (lastDay === null) {
      idx = 0;
    } else {
      idx = (idx + 1) % total;
    }
    localStorage.setItem(IDIOM_INDEX_KEY, String(idx));
    localStorage.setItem(IDIOM_DATE_KEY, today);
  }
  return idx;
}

function DailyIdiom() {
  const [idiom, setIdiom]       = useState(null);
  const [idx, setIdx]           = useState(0);
  const [total, setTotal]       = useState(0);
  const [countdown, setCountdown] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const todayRef = useRef(getDayLabel());

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/chinese-idioms/idioms.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const resolvedIdx = resolveIndex(data.length);
        setTotal(data.length);
        setIdx(resolvedIdx);
        setIdiom(data[resolvedIdx]);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function tick() {
      const now  = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + (now.getHours() >= 0 && now.getMinutes() >= 1 ? 1 : 0));
      next.setHours(0, 1, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const diffMs = next - now;
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      const s = Math.floor((diffMs % 60_000) / 1_000);
      setCountdown(`Next idiom in ${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
      if (getDayLabel() !== todayRef.current) {
        window.location.reload();
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tags = idiom ? [
    { label: idiom.register },
    { label: idiom.mandarin_usage?.replace(/_/g, ' ') },
    idiom.mandarin_only ? { label: 'MANDARIN ONLY' } : null,
    { label: idiom.confidence, cls: idiom.confidence },
  ].filter(Boolean).filter(t => t.label) : [];

  return (
    <div className="ci-page">
      <div className="ci-grid-overlay" aria-hidden="true" />

      <div className="ci-counter-bar">
        <span className="ci-counter-label">IDIOMS REMAINING</span>
        <span className="ci-counter-value">{loading ? '—' : total - idx - 1}</span>
      </div>

      <main className="ci-main">
        <div className={`ci-card${loading ? ' loading' : ''}`}>
          <div className="ci-day-badge">
            {loading ? 'DAY — OF —' : `DAY ${idx + 1} OF ${total}`}
          </div>

          {idiom?.characters ? (
            <div className="ci-char-grid">
              {idiom.characters.map((c, i) => (
                <div key={i} className="ci-char-unit">
                  <div className="ci-char-han" lang="zh-Hant">{c.char}</div>
                  <div className="ci-char-meaning">{c.meaning}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ci-char" lang="zh-Hant">
              {error ? '⚠' : (idiom?.idiom ?? '—')}
            </div>
          )}

          {error && (
            <p className="ci-meaning">Could not load idioms — {error}</p>
          )}

          {!error && (
            <>
              <div className="ci-rom-row">
                <span className="ci-rom-label">Mandarin</span>
                <span className="ci-rom-value ci-mono">{idiom?.pinyin ?? '—'}</span>
                <span className="ci-rom-sep"></span>
                </div>
                <div className="ci-rom-row">
                <span className="ci-rom-label">Cantonese</span>
                <span className="ci-rom-value ci-mono">{idiom?.yale ?? '—'}</span>
              </div>

              <div className="ci-meaning">{idiom?.meaning_en ?? '—'}</div>

              <div className="ci-divider" />

              <div className="ci-examples-block">
                <div className="ci-examples-title">例句 EXAMPLE</div>
                <p className="ci-ex-line ci-ex-simplified" lang="zh-Hans">
                  {idiom?.example_simplified ?? ''}
                </p>
                <p className="ci-ex-line ci-ex-traditional" lang="zh-Hant">
                  {idiom?.example_traditional ?? ''}
                </p>
                </div>
                <div className="ci-examples-block">
                <p className="ci-ex-line ci-ex-en">{idiom?.example_en ?? ''}</p>
              </div>

              <div className="ci-tags-row">
                {tags.map((t, i) => (
                  <span key={i} className={`ci-tag${t.cls ? ` ${t.cls}` : ''}`}>
                    {t.label.toUpperCase()}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="ci-next-note">{countdown || 'Next idiom at 12:01 AM'}</p>
      </main>
    </div>
  );
}

export default DailyIdiom;
