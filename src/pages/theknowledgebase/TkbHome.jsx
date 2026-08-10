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
      <div className="tkb-profile-cards">
        {PROFILES.map(p => (
          <button
            key={p.id}
            className="tkb-btn tkb-btn-primary"
            onClick={() => navigate(`/TKB/review?profile=${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="tkb-settings-section" style={{ marginTop: '2rem', textAlign: 'left' }}>
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
      </div>

      <div className="tkb-settings-section" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
        <h3>Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <ul>
            {sessions.slice(0, 5).map(s => (
              <li key={s.id}>
                {getProfile(s.profileId).name} — {s.correct} correct / {s.wrong} wrong / {s.unsure} unsure
                {' '}({(s.startedAt ?? '').slice(0, 10)})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
