import { useEffect, useMemo, useState } from 'react';
import { useFitness } from './fitnessContext';
import { DEFAULT_ACTIVITY_TYPES, todayISO } from './fitnessConfig';
import { hrZones } from './calc/hr';
import { mifflinStJeorBmr } from './calc/bmr';
import { latestBodyWeightKg } from './calc/calories';
import { cmToHeight, heightToCm, heightUnitLabel, kgToWeight, weightToKg } from './units';
import CalendarSync from './CalendarSync';

const UNIT_OPTIONS = {
  distance: [['mi', 'Miles'], ['km', 'Kilometers']],
  pool: [['yd', 'Yards'], ['m', 'Meters']],
  weight: [['lb', 'Pounds'], ['kg', 'Kilograms']],
};

function isEmpty(v) { return v === null || v === undefined || v === ''; }
function round1(n) { return n == null ? null : Math.round(n * 10) / 10; }

// Chunks a list of already-key'd field nodes into ft-two two-column rows,
// leaving a trailing odd one out as a standalone full-width field — so
// hiding individual empty rows (the "View detailed" toggle) degrades the
// grid gracefully instead of leaving blank grid cells.
function pairRows(fields) {
  const rows = [];
  for (let i = 0; i < fields.length; i += 2) {
    const pair = fields.slice(i, i + 2);
    rows.push(pair.length === 2 ? <div className="ft-two" key={`row-${i}`}>{pair}</div> : pair[0]);
  }
  return rows;
}

export default function Settings() {
  const { settings, updateSettings, mode, bodyWeightLogs, addBodyWeightLog, updateBodyWeightLog } = useFitness();
  const units = settings.units;
  const customTypes = settings.customTypes || [];
  const profile = settings.profile || {};
  const detailed = !!settings.detailedView;

  const setUnit = (key, val) => updateSettings({ units: { ...units, [key]: val } });
  const setProfile = (key, val) => {
    const n = val === '' ? null : Number(val);
    updateSettings({ profile: { ...profile, [key]: Number.isNaN(n) ? null : n } });
  };
  const nutritionTarget = settings.nutritionTarget || {};
  const setNutritionTarget = (key, val) => {
    const n = val === '' ? null : Number(val);
    updateSettings({ nutritionTarget: { ...nutritionTarget, [key]: Number.isNaN(n) ? null : n } });
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

  // ---- Profile card: height / weight / age / sex / notes. Weight is NOT a
  // settings field — it reads/writes the same bodyWeightLogs system that
  // already powers goal checkpoints and calorie-burn estimates, upserting
  // today's log entry rather than spamming a new one per keystroke.
  const heightUnit = heightUnitLabel(units.weight);
  const setHeight = (val) => updateSettings({ profile: { ...profile, heightCm: heightToCm(val, units.weight) } });
  const setSex = (val) => updateSettings({ profile: { ...profile, sex: val } });
  const setNotes = (val) => updateSettings({ profile: { ...profile, notes: val } });

  const currentWeightKg = latestBodyWeightKg(bodyWeightLogs);
  // Local draft text for the weight input — it can't be a plain controlled
  // value derived from currentWeightKg, because clearing the field to retype
  // (kg resolves to null mid-edit) would otherwise snap straight back to the
  // last logged number on every keystroke that passes through empty. Only
  // resynced from the log on a units switch (lb<->kg); typing itself just
  // upserts today's log entry whenever it resolves to a real number.
  const [weightDraft, setWeightDraft] = useState(
    () => (currentWeightKg != null ? String(round1(kgToWeight(currentWeightKg, units.weight))) : ''),
  );
  useEffect(() => {
    setWeightDraft(currentWeightKg != null ? String(round1(kgToWeight(currentWeightKg, units.weight))) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units.weight]);
  const setWeight = (val) => {
    setWeightDraft(val);
    const kg = weightToKg(val, units.weight);
    if (kg == null) return;
    const today = todayISO();
    const existing = bodyWeightLogs.find((l) => l.date === today);
    if (existing) updateBodyWeightLog(existing.id, { weightKg: kg });
    else addBodyWeightLog({ date: today, weightKg: kg });
  };

  // ---- BMR: auto-calculated (Mifflin-St Jeor) from the profile fields above
  // unless the user has directly typed a BMR value (profile.bmrManual).
  // Only writes when the computed value actually differs from what's
  // currently stored, so this can never update-loop.
  const computedBmr = useMemo(
    () => mifflinStJeorBmr(currentWeightKg, profile.heightCm, profile.age, profile.sex),
    [currentWeightKg, profile.heightCm, profile.age, profile.sex],
  );
  useEffect(() => {
    if (profile.bmrManual || computedBmr == null || profile.bmr === computedBmr) return;
    updateSettings({ profile: { ...profile, bmr: computedBmr } });
  }, [profile, computedBmr, updateSettings]);

  const setBmr = (val) => {
    const n = val === '' ? null : Number(val);
    updateSettings({ profile: { ...profile, bmr: Number.isNaN(n) ? null : n, bmrManual: true } });
  };
  const useCalculatedBmr = () => updateSettings({ profile: { ...profile, bmrManual: false } });

  // ---- "View detailed" gating — OFF hides genuinely empty data-entry input
  // rows so the page reads as populated hard data only; ON shows every row
  // exactly as it renders today, populated or not.
  const showMaxHr = detailed || !isEmpty(profile.maxHr);
  const showRestHr = detailed || !isEmpty(profile.restHr);
  const hrCardEmpty = !detailed && isEmpty(profile.maxHr) && isEmpty(profile.restHr);

  const showHeight = detailed || !isEmpty(profile.heightCm);
  const showWeight = detailed || !isEmpty(currentWeightKg);
  const showAge = detailed || !isEmpty(profile.age);
  const showSex = detailed || !isEmpty(profile.sex);
  const showNotes = detailed || !isEmpty(profile.notes);
  const profileCardEmpty = !detailed && isEmpty(profile.heightCm) && isEmpty(currentWeightKg)
    && isEmpty(profile.age) && isEmpty(profile.sex) && isEmpty(profile.notes);

  const showBmr = detailed || !isEmpty(profile.bmr);
  const showCalGoal = detailed || !isEmpty(nutritionTarget.calories);
  const showProtein = detailed || !isEmpty(nutritionTarget.proteinG);
  const showCarbs = detailed || !isEmpty(nutritionTarget.carbsG);
  const showFat = detailed || !isEmpty(nutritionTarget.fatG);
  const nutritionCardEmpty = !detailed && isEmpty(profile.bmr) && isEmpty(nutritionTarget.calories)
    && isEmpty(nutritionTarget.proteinG) && isEmpty(nutritionTarget.carbsG) && isEmpty(nutritionTarget.fatG);

  return (
    <div className="ft-settings">
      <h2>Settings</h2>

      <div className="ft-detail-toggle-row">
        <button
          type="button"
          className={`ft-toggle-btn${detailed ? ' active' : ''}`}
          onClick={() => updateSettings({ detailedView: !detailed })}
          title="Show every field below, including ones you haven't filled in yet"
        >
          👁 View detailed
        </button>
      </div>

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
        <h3>Profile</h3>
        <p className="ft-hint-sm">Height, weight, age &amp; sex feed the auto-calculated BMR in the Nutrition profile card below.</p>
        {profileCardEmpty ? (
          <p className="ft-hint-sm">No data yet — turn on "View detailed" above to add it.</p>
        ) : (
          <>
            {pairRows([
              showHeight && (
                <div className="ft-field" key="height">
                  <label className="ft-field-label">Height ({heightUnit})</label>
                  <input
                    className="ft-input"
                    inputMode="decimal"
                    value={profile.heightCm != null ? round1(cmToHeight(profile.heightCm, units.weight)) : ''}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={heightUnit === 'cm' ? 'e.g. 178' : 'e.g. 70'}
                  />
                </div>
              ),
              showWeight && (
                <div className="ft-field" key="weight">
                  <label className="ft-field-label">Weight ({units.weight})</label>
                  <input
                    className="ft-input"
                    inputMode="decimal"
                    value={weightDraft}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={units.weight === 'kg' ? 'e.g. 70' : 'e.g. 154'}
                  />
                  <p className="ft-hint-sm">Updates today's weigh-in log</p>
                </div>
              ),
              showAge && (
                <div className="ft-field" key="age">
                  <label className="ft-field-label">Age (years)</label>
                  <input className="ft-input" inputMode="numeric" value={profile.age ?? ''} onChange={(e) => setProfile('age', e.target.value)} placeholder="e.g. 34" />
                </div>
              ),
              showSex && (
                <div className="ft-field" key="sex">
                  <label className="ft-field-label">Sex</label>
                  <div className="ft-seg">
                    <button type="button" className={`ft-seg-btn${profile.sex === 'male' ? ' active' : ''}`} onClick={() => setSex('male')}>Male</button>
                    <button type="button" className={`ft-seg-btn${profile.sex === 'female' ? ' active' : ''}`} onClick={() => setSex('female')}>Female</button>
                  </div>
                  <p className="ft-hint-sm">Used only for the BMR formula below — Mifflin-St Jeor has no other variant</p>
                </div>
              ),
            ].filter(Boolean))}
            {showNotes && (
              <div className="ft-field">
                <label className="ft-field-label">Notes</label>
                <textarea
                  className="ft-input ft-textarea"
                  value={profile.notes ?? ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Injuries, PRs, anything else worth tracking here"
                  rows={3}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="ft-set-card">
        <h3>Heart-rate profile</h3>
        <p className="ft-hint-sm">Your real measured max &amp; resting HR drive the Karvonen zones (not 220−age).</p>
        {hrCardEmpty ? (
          <p className="ft-hint-sm">No data yet — turn on "View detailed" above to add it.</p>
        ) : (
          pairRows([
            showMaxHr && (
              <div className="ft-field" key="maxHr">
                <label className="ft-field-label">Max HR (bpm)</label>
                <input className="ft-input" inputMode="numeric" value={profile.maxHr ?? ''} onChange={(e) => setProfile('maxHr', e.target.value)} placeholder="e.g. 190" />
              </div>
            ),
            showRestHr && (
              <div className="ft-field" key="restHr">
                <label className="ft-field-label">Resting HR (bpm)</label>
                <input className="ft-input" inputMode="numeric" value={profile.restHr ?? ''} onChange={(e) => setProfile('restHr', e.target.value)} placeholder="e.g. 50" />
              </div>
            ),
          ].filter(Boolean))
        )}
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
        <h3>Nutrition profile</h3>
        <p className="ft-hint-sm">BMR + a daily calorie goal drive the net-calories badge on every calendar day (food − BMR − workout burn).</p>
        {nutritionCardEmpty ? (
          <p className="ft-hint-sm">No data yet — turn on "View detailed" above to add it.</p>
        ) : (
          pairRows([
            showBmr && (
              <div className="ft-field" key="bmr">
                <label className="ft-field-label">BMR (kcal/day)</label>
                <div className="ft-bmr-row">
                  <input className="ft-input" inputMode="numeric" value={profile.bmr ?? ''} onChange={(e) => setBmr(e.target.value)} placeholder="e.g. 1700" />
                  {profile.bmrManual && computedBmr != null && (
                    <button
                      type="button"
                      className="ft-btn-ghost ft-bmr-use-calc"
                      onClick={useCalculatedBmr}
                      title="Reset to the value calculated from your Profile card above"
                    >
                      ↺ Use calculated
                    </button>
                  )}
                </div>
                <p className="ft-hint-sm">
                  {profile.bmrManual
                    ? 'Manual override — using the value you entered, not the calculated one.'
                    : 'Auto-calculated from your profile (Mifflin-St Jeor) below — type here to override with a measured value.'}
                </p>
              </div>
            ),
            showCalGoal && (
              <div className="ft-field" key="calGoal">
                <label className="ft-field-label">Daily calorie goal</label>
                <input className="ft-input" inputMode="numeric" value={nutritionTarget.calories ?? ''} onChange={(e) => setNutritionTarget('calories', e.target.value)} placeholder="e.g. 1400" />
              </div>
            ),
            showProtein && (
              <div className="ft-field" key="protein">
                <label className="ft-field-label">Protein goal (g)</label>
                <input className="ft-input" inputMode="numeric" value={nutritionTarget.proteinG ?? ''} onChange={(e) => setNutritionTarget('proteinG', e.target.value)} placeholder="optional" />
              </div>
            ),
            showCarbs && (
              <div className="ft-field" key="carbs">
                <label className="ft-field-label">Carbs goal (g)</label>
                <input className="ft-input" inputMode="numeric" value={nutritionTarget.carbsG ?? ''} onChange={(e) => setNutritionTarget('carbsG', e.target.value)} placeholder="optional" />
              </div>
            ),
            showFat && (
              <div className="ft-field" key="fat">
                <label className="ft-field-label">Fat goal (g)</label>
                <input className="ft-input" inputMode="numeric" value={nutritionTarget.fatG ?? ''} onChange={(e) => setNutritionTarget('fatG', e.target.value)} placeholder="optional" />
              </div>
            ),
          ].filter(Boolean))
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
        {detailed && (
          <div className="ft-add-type">
            <input className="ft-input ft-add-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} aria-label="Icon" />
            <input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New type name (e.g. Rowing)" onKeyDown={(e) => e.key === 'Enter' && addType()} />
            <input className="ft-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Colour" />
            <button type="button" className="ft-btn-primary" onClick={addType} disabled={!name.trim()}>Add</button>
          </div>
        )}
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
