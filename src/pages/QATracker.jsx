import { useState, useEffect } from 'react';
import trackerData from '../data/qa_skills_tracker.json';
import './QATracker.css';

const LS_KEY = 'qa-tracker-comfort-levels';

const COMFORT_LABELS = {
  0: 'Never touched',
  1: 'Read/watched only',
  2: 'Tried once',
  3: 'Used in real work',
  4: 'Comfortable',
  5: 'Test-ready',
  6: 'Could teach',
};

const COMFORT_COLORS = {
  0: '#4b5563',
  1: '#b91c1c',
  2: '#c2410c',
  3: '#b45309',
  4: '#1d4ed8',
  5: '#15803d',
  6: '#166534',
};

const SELECT_OPTIONS = [
  '0 – never',
  '1 – aware',
  '2 – tried',
  '3 – real use, gaps',
  '4 – comfortable',
  '5 – test ready',
  '6 – could teach',
];

function getDefaultComfort() {
  const defaults = {};
  trackerData.categories.forEach(cat =>
    cat.items.forEach(item => { defaults[item.tool] = item.comfort; })
  );
  return defaults;
}

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (input.trim().toLowerCase() === 'trogdor') {
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="qa-gate">
      <div className="qa-gate-box">
        <p className="qa-gate-label">enter the secret password</p>
        <input
          className={`qa-gate-input${error ? ' qa-gate-error' : ''}`}
          type="password"
          value={input}
          placeholder="enter the secret password"
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        {error && <p className="qa-gate-hint">incorrect</p>}
        <button className="qa-gate-btn" onClick={attempt}>Enter</button>
      </div>
    </div>
  );
}

function TrackerContent() {
  const [comfort, setComfortLevels] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? { ...getDefaultComfort(), ...JSON.parse(saved) } : getDefaultComfort();
    } catch {
      return getDefaultComfort();
    }
  });

  const [collapsedCats, setCollapsedCats] = useState({});
  const [openPaths, setOpenPaths] = useState({});

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(comfort));
  }, [comfort]);

  const setSkillComfort = (tool, val) =>
    setComfortLevels(prev => ({ ...prev, [tool]: parseInt(val) }));

  const toggleCat = cat =>
    setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  const togglePath = tool =>
    setOpenPaths(prev => ({ ...prev, [tool]: !prev[tool] }));

  const reset = () => {
    setComfortLevels(getDefaultComfort());
    localStorage.removeItem(LS_KEY);
  };

  const allItems = trackerData.categories.flatMap(c => c.items);
  const allComforts = allItems.map(item => comfort[item.tool] ?? item.comfort);
  const total = allItems.length;
  const avgComfort = (allComforts.reduce((a, b) => a + b, 0) / total).toFixed(1);
  const testReady = allComforts.filter(c => c >= 5).length;
  const gaps = allComforts.filter(c => c < 3).length;
  const progressPct = Math.round((allComforts.reduce((a, b) => a + b, 0) / (total * 6)) * 100);

  return (
    <div className="qa-page">
      <div className="qa-container">

        <div className="qa-top-bar">
          <h1 className="qa-title">QA Skills Tracker</h1>
          <button className="qa-reset-btn" onClick={reset}>Reset</button>
        </div>

        <div className="qa-summary">
          <div className="qa-stat">
            <span className="qa-stat-num">{avgComfort}</span>
            <span className="qa-stat-label">Avg Comfort</span>
          </div>
          <div className="qa-stat">
            <span className="qa-stat-num" style={{ color: '#4ade80' }}>{testReady}</span>
            <span className="qa-stat-label">Test-Ready</span>
          </div>
          <div className="qa-stat">
            <span className="qa-stat-num" style={{ color: '#f87171' }}>{gaps}</span>
            <span className="qa-stat-label">Gaps</span>
          </div>
          <div className="qa-stat">
            <span className="qa-stat-num">{total}</span>
            <span className="qa-stat-label">Total Skills</span>
          </div>
          <div className="qa-progress-group">
            <div className="qa-progress-track">
              <div className="qa-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="qa-progress-pct">{progressPct}%</span>
          </div>
        </div>

        {trackerData.categories.map(cat => {
          const isOpen = !collapsedCats[cat.category];
          const readyCount = cat.items.filter(item =>
            (comfort[item.tool] ?? item.comfort) >= 5
          ).length;

          return (
            <div key={cat.category} className="qa-cat">
              <div className="qa-cat-header" onClick={() => toggleCat(cat.category)}>
                <span className="qa-cat-name">{cat.category}</span>
                <div className="qa-cat-meta">
                  <span className="qa-cat-ready">{readyCount}/{cat.items.length} ready</span>
                  <span className="qa-cat-chevron">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="qa-skills">
                  {cat.items.map(item => {
                    const level = comfort[item.tool] ?? item.comfort;
                    const pathOpen = openPaths[item.tool];

                    return (
                      <div key={item.tool} className="qa-row">
                        <div className="qa-row-main">
                          <div className="qa-row-info">
                            <span className="qa-tool-name">{item.tool}</span>
                            <span className="qa-tool-notes">{item.notes}</span>
                          </div>
                          <div className="qa-row-controls">
                            <select
                              className="qa-select"
                              value={level}
                              onChange={e => setSkillComfort(item.tool, e.target.value)}
                            >
                              {SELECT_OPTIONS.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                              ))}
                            </select>
                            <span
                              className="qa-badge"
                              style={{ background: COMFORT_COLORS[level] }}
                            >
                              {COMFORT_LABELS[level]}
                            </span>
                            <button
                              className={`qa-path-btn${pathOpen ? ' active' : ''}`}
                              onClick={() => togglePath(item.tool)}
                            >
                              study path
                            </button>
                          </div>
                        </div>

                        {pathOpen && (
                          <div className="qa-path">
                            <ul>
                              {item.study_path.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QATracker() {
  const [verified, setVerified] = useState(() =>
    sessionStorage.getItem('qa-unlocked') === '1'
  );

  useEffect(() => {
    document.body.classList.add('qa-tracker-mode');
    return () => document.body.classList.remove('qa-tracker-mode');
  }, []);

  const unlock = () => {
    sessionStorage.setItem('qa-unlocked', '1');
    setVerified(true);
  };

  return verified ? <TrackerContent /> : <PasswordGate onUnlock={unlock} />;
}
