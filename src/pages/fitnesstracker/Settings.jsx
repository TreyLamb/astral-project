import { useState } from 'react';
import { useFitness } from './fitnessContext';
import { DEFAULT_ACTIVITY_TYPES } from './fitnessConfig';
import { hrZones } from './calc/hr';
import CalendarSync from './CalendarSync';

const UNIT_OPTIONS = {
  distance: [['mi', 'Miles'], ['km', 'Kilometers']],
  pool: [['yd', 'Yards'], ['m', 'Meters']],
  weight: [['lb', 'Pounds'], ['kg', 'Kilograms']],
};

export default function Settings() {
  const { settings, updateSettings, mode } = useFitness();
  const units = settings.units;
  const customTypes = settings.customTypes || [];
  const profile = settings.profile || {};

  const setUnit = (key, val) => updateSettings({ units: { ...units, [key]: val } });
  const setProfile = (key, val) => {
    const n = val === '' ? null : Number(val);
    updateSettings({ profile: { ...profile, [key]: Number.isNaN(n) ? null : n } });
  };
  const zones = hrZones(profile.maxHr, profile.restHr);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#f472b6');
  const [icon, setIcon] = useState('•');

  function addType() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `type-${Date.now()}`;
    const next = [...customTypes.filter((t) => t.id !== id), { id, name: trimmed, color, icon: icon || '•', kind: 'generic' }];
    updateSettings({ customTypes: next });
    setName('');
    setIcon('•');
  }

  function removeType(id) {
    updateSettings({ customTypes: customTypes.filter((t) => t.id !== id) });
  }

  return (
    <div className="ft-settings">
      <h2>Settings</h2>

      <div className="ft-set-card">
        <h3>Units</h3>
        {Object.entries(UNIT_OPTIONS).map(([key, opts]) => (
          <div key={key} className="ft-set-row">
            <span className="ft-set-label">{key === 'pool' ? 'Pool (swim)' : key[0].toUpperCase() + key.slice(1)}</span>
            <div className="ft-seg">
              {opts.map(([val, label]) => (
                <button key={val} type="button" className={`ft-seg-btn${units[key] === val ? ' active' : ''}`} onClick={() => setUnit(key, val)}>{label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ft-set-card">
        <h3>Heart-rate profile</h3>
        <p className="ft-hint-sm">Your real measured max &amp; resting HR drive the Karvonen zones (not 220−age).</p>
        <div className="ft-two">
          <div className="ft-field">
            <label className="ft-field-label">Max HR (bpm)</label>
            <input className="ft-input" inputMode="numeric" value={profile.maxHr ?? ''} onChange={(e) => setProfile('maxHr', e.target.value)} placeholder="e.g. 190" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Resting HR (bpm)</label>
            <input className="ft-input" inputMode="numeric" value={profile.restHr ?? ''} onChange={(e) => setProfile('restHr', e.target.value)} placeholder="e.g. 50" />
          </div>
        </div>
        {zones.length > 0 && (
          <div className="ft-zone-preview">
            {zones.map((z) => (
              <div key={z.id} className="ft-zone-row">
                <span className="ft-zone-name">{z.name}</span>
                <span className="ft-zone-bpm">{z.loBpm}–{z.hiBpm} bpm</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ft-set-card">
        <h3>Activity types</h3>
        <p className="ft-hint-sm">Built-ins are always available. Add your own — no code change needed.</p>
        <div className="ft-type-chips">
          {DEFAULT_ACTIVITY_TYPES.map((t) => (
            <span key={t.id} className="ft-type-chip" style={{ borderColor: t.color }}>
              <span>{t.icon}</span> {t.name} <span className="ft-type-chip-tag">built-in</span>
            </span>
          ))}
          {customTypes.map((t) => (
            <span key={t.id} className="ft-type-chip" style={{ borderColor: t.color }}>
              <span>{t.icon}</span> {t.name}
              <button type="button" className="ft-type-chip-x" onClick={() => removeType(t.id)} aria-label={`Remove ${t.name}`}>✕</button>
            </span>
          ))}
        </div>
        <div className="ft-add-type">
          <input className="ft-input ft-add-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} aria-label="Icon" />
          <input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New type name (e.g. Rowing)" onKeyDown={(e) => e.key === 'Enter' && addType()} />
          <input className="ft-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Colour" />
          <button type="button" className="ft-btn-primary" onClick={addType} disabled={!name.trim()}>Add</button>
        </div>
      </div>

      <div className="ft-set-card">
        <h3>Sync</h3>
        <p className="ft-hint-sm">
          {mode === 'cloud'
            ? 'Signed in — your workouts sync to Firestore and to any device (incl. your phone).'
            : 'Guest mode — saved on this device (localStorage). Sign in from the top nav to sync across devices.'}
        </p>
      </div>

      <CalendarSync />
    </div>
  );
}
