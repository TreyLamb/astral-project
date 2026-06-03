import { useState, useEffect, useRef } from 'react';
import './DailyIdiomWidget.css';

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

function DailyIdiomWidget() {
  const [idiom, setIdiom] = useState(null);
  const [idx, setIdx]     = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
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
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (getDayLabel() !== todayRef.current) window.location.reload();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="wg-page">
      <div className="wg-card">



        {idiom?.characters ? (
          <div className="wg-char-grid">
            {idiom.characters.map((c, i) => (
              <div key={i} className="wg-char-unit">
                <div className="wg-char-han" lang="zh-Hant">{c.char}</div>
                <div className="wg-char-meaning">{c.meaning}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wg-char" lang="zh-Hant">
            {error ? '⚠' : (idiom?.idiom ?? '—')}
          </div>
        )}

        <div className="wg-pinyin">
          <span className="wg-rom-label"></span> {idiom?.pinyin ?? '—'}
        </div>
        <div className="wg-pinyin">
          <span className="wg-rom-label"></span> {idiom?.yale ?? '—'}
        </div>

        <div className="wg-meaning">{idiom?.meaning_en ?? '—'}</div>

        <div className="wg-tags-row">
          {idiom && [
            { label: idiom.register },
            { label: idiom.mandarin_usage?.replace(/_/g, ' ') },
            idiom.mandarin_only ? { label: 'MANDARIN ONLY' } : null,
            { label: idiom.confidence, cls: idiom.confidence },
          ].filter(Boolean).filter(t => t.label).map((t, i) => (
            <span key={i} className={`wg-tag${t.cls ? ` ${t.cls}` : ''}`}>
              {t.label.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="wg-top-row">
          <span className="wg-day" lang="zh-Hans">{idiom?.idiom ?? '—'}</span>
          <span className="wg-day">{idiom ? `${idx + 1} OF ${total}` : '—'}</span>
        </div>

      </div>
    </div>
  );
}

export default DailyIdiomWidget;
