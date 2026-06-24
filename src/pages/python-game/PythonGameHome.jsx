import { Link } from 'react-router-dom';
import { usePythonGame } from './PythonGameApp';
import tutorialData from './content/tutorial.json';

const MODES = [
  {
    id:       'tutorial',
    path:     '/python-game/tutorial',
    icon:     '📖',
    name:     'Tutorial',
    desc:     'Learn Python one concept at a time. Guided, gated, free hints.',
    levels:   'Levels 1–5',
    feature:  'tutorial',
    always:   true,
  },
  {
    id:       'campaign',
    path:     '/python-game/campaign',
    icon:     '🗺️',
    name:     'Campaign',
    desc:     'Story-driven chapters with real-world Python problems.',
    levels:   'Unlocks at Level 5',
    feature:  'campaign',
  },
  {
    id:       'trials',
    path:     '/python-game/trials',
    icon:     '⚡',
    name:     'Trials',
    desc:     'Replayable arcade challenges. Scored on speed and elegance.',
    levels:   'Unlocks at Level 6',
    feature:  'trials',
  },
  {
    id:       'architecture',
    path:     '#',
    icon:     '🏗️',
    name:     'Architecture Mastery',
    desc:     'Refactoring, design, and code quality challenges.',
    levels:   'Coming soon',
    feature:  'architecture',
  },
];

export default function PythonGameHome() {
  const { player } = usePythonGame();
  const tutorialDone = player.tutorialCompleted.length;
  const tutorialTotal = tutorialData.length;
  const tutorialPct = Math.round((tutorialDone / tutorialTotal) * 100);

  return (
    <div className="pg-home">
      <div className="pg-home-header">
        <h1 className="pg-home-title">Code Trials</h1>
        <p className="pg-home-sub">Learn Python by writing real code. No multiple choice.</p>
      </div>

      <div className="pg-mode-grid">
        {MODES.map(mode => {
          const unlocked = mode.always || player.unlockedFeatures.includes(mode.feature);
          const isLocked = !unlocked;

          const inner = (
            <>
              {isLocked && <span className="pg-mode-lock-label">🔒 Locked</span>}
              <span className="pg-mode-icon">{mode.icon}</span>
              <div className="pg-mode-name">{mode.name}</div>
              <div className="pg-mode-desc">{mode.desc}</div>
              <div className="pg-mode-meta">{mode.levels}</div>
              {mode.id === 'tutorial' && tutorialTotal > 0 && (
                <>
                  <div className="pg-mode-progress">
                    <div className="pg-mode-progress-fill" style={{ width: `${tutorialPct}%` }} />
                  </div>
                  <div className="pg-mode-meta" style={{ marginTop: 6 }}>
                    {tutorialDone}/{tutorialTotal} completed
                  </div>
                </>
              )}
            </>
          );

          if (isLocked || mode.path === '#') {
            return (
              <div key={mode.id} className="pg-mode-card pg-mode-locked">
                {inner}
              </div>
            );
          }

          return (
            <Link key={mode.id} to={mode.path} className="pg-mode-card">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
