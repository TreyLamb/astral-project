import { useNavigate } from 'react-router-dom';
import { PROFILES, getProfile } from './tkbPresets';
import { useTkbData } from './TkbApp';

export default function TkbHome() {
  const navigate = useNavigate();
  const { settings, updateSettings, sessions } = useTkbData();

  return (
    <div className="tkb-home">
      <h1>TheKnowledgeBase</h1>
      <p>Pick a profile to start a rapid-review session.</p>
      {/* Five buttons that used to ship as bare names ("Auto-Adjust (Scoped)"?) with nothing
          explaining what any of them actually pull - a different question pipeline, a different
          subject filter, a different weighting scheme, all invisible from the label. Each card's
          description comes straight from tkbPresets.js, which is the single place that has to
          stay honest about what buildSessionQueue() does with that profile. */}
      <div className="tkb-profile-cards">
        {PROFILES.map(p => (
          <button
            key={p.id}
            className="tkb-profile-card"
            onClick={() => navigate(`/TKB/review?profile=${p.id}`)}
          >
            <strong>{p.name}</strong>
            <span>{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="tkb-home-grid">
        <div className="tkb-settings-section">
          <h3>Session Size</h3>
          <div className="tkb-slider-row">
            <label htmlFor="tkb-default-n">Questions per session</label>
            <input
              id="tkb-default-n"
              type="number"
              min={10}
              max={500}
              value={settings.defaultN}
              onChange={(e) => updateSettings({ defaultN: Number(e.target.value) })}
            />
          </div>
          <p className="tkb-home-note">
            Applies to Main Recall, Quick Facts and Auto-Adjust (All). The two scoped profiles
            (Auto-Adjust Scoped, Focused Review) always pull the whole ASVAB deck instead.
          </p>
        </div>

        <div className="tkb-settings-section">
          <h3>Recent Sessions</h3>
          {sessions.length === 0 ? (
            <p>No sessions yet.</p>
          ) : (
            <ul className="tkb-home-sessions">
              {sessions.slice(0, 5).map(s => (
                <li key={s.id}>
                  <strong>{getProfile(s.profileId).name}</strong>
                  <span>{s.correct} correct / {s.wrong} wrong / {s.unsure} unsure</span>
                  <small>{(s.startedAt ?? '').slice(0, 10)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
