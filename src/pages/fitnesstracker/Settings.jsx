import { useEffect, useMemo, useState } from 'react';
import { useFitness } from './fitnessContext';
import { DEFAULT_ACTIVITY_TYPES, todayISO } from './fitnessConfig';
import { hrZones } from './calc/hr';
import { mifflinStJeorBmr } from './calc/bmr';
import { latestBodyWeightKg } from './calc/calories';
import { KCAL_PER_G_PROTEIN, KCAL_PER_G_CARB, KCAL_PER_G_FAT, gramsToCalPct, calPctToGrams } from './calc/nutrition';
import { cmToHeight, heightToCm, heightUnitLabel, kgToWeight, weightToKg } from './units';
import CalendarSync from './CalendarSync';

const UNIT_OPTIONS = {
  distance: [['mi', 'Miles'], ['km', 'Kilometers']],
  pool: [['yd', 'Yards'], ['m', 'Meters']],
  weight: [['lb', 'Pounds'], ['kg', 'Kilograms']],
  macros: [['g', 'Grams'], ['pct', '% of calories']],
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

// The core of "View detailed": in detailed mode a field is ALWAYS the live
// editable control, filled or not. Out of detailed mode there is no entry
// affordance at all — a filled field renders as plain static "hard data"
// text (never the <input> itself), and an empty one renders nothing. `show`
// still gates whether the field appears in the layout at all (hide-when-
// empty-and-not-detailed), independent of which of the two it renders as.
function fieldRow(detailed, show, key, label, input, staticText, hint) {
  if (!show) return null;
  return (
    <div className="ft-field" key={key}>
      <label className="ft-field-label">{label}</label>
      {detailed ? input : <p className="ft-field-static">{staticText}</p>}
      {hint || null}
    </div>
  );
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
  function weightDisplayFor(unit) {
    return currentWeightKg != null ? String(round1(kgToWeight(currentWeightKg, unit))) : '';
  }
  const [weightDraft, setWeightDraft] = useState(() => weightDisplayFor(units.weight));
  // Resync the draft when the unit toggle itself changes (lb<->kg) — adjusting
  // state during render (React's documented pattern for "reset state when a
  // dependency changes") rather than a setState-in-useEffect round trip.
  const [prevWeightUnit, setPrevWeightUnit] = useState(units.weight);
  if (units.weight !== prevWeightUnit) {
    setPrevWeightUnit(units.weight);
    setWeightDraft(weightDisplayFor(units.weight));
  }
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

  // ---- Macro goals: grams (canonical, always what's persisted) or % of the
  // daily calorie goal (settings.units.macros — a display/entry preference
  // only, same pattern as distance/weight units). % needs a calorie goal to
  // convert against; without one the field is disabled with an explanatory
  // hint rather than silently doing wrong math.
  const macroUnit = units.macros || 'g';
  const macroLabel = macroUnit === 'pct' ? '% of calories' : 'g';
  const macroPctBlocked = macroUnit === 'pct' && isEmpty(nutritionTarget.calories);
  function macroInputValue(grams, kcalPerG) {
    if (macroUnit === 'pct') {
      const pct = gramsToCalPct(grams, kcalPerG, nutritionTarget.calories);
      return pct != null ? String(round1(pct)) : '';
    }
    return grams != null ? String(round1(grams)) : '';
  }
  function macroStaticText(grams, kcalPerG) {
    if (grams == null) return '';
    if (macroUnit === 'pct') {
      const pct = gramsToCalPct(grams, kcalPerG, nutritionTarget.calories);
      return pct != null ? `${round1(pct)}%` : `${round1(grams)} g`;
    }
    return `${round1(grams)} g`;
  }
  function setMacro(field, kcalPerG, val) {
    const n = val === '' ? null : Number(val);
    if (n != null && Number.isNaN(n)) return;
    if (macroUnit === 'pct') {
      if (macroPctBlocked) return;
      const grams = n == null ? null : calPctToGrams(n, kcalPerG, nutritionTarget.calories);
      updateSettings({ nutritionTarget: { ...nutritionTarget, [field]: grams != null ? round1(grams) : null } });
    } else {
      updateSettings({ nutritionTarget: { ...nutritionTarget, [field]: n } });
    }
  }

  // ---- "View detailed" gating — OFF hides genuinely empty data-entry input
  // rows entirely, and renders filled ones as static text instead of a live
  // input (fieldRow above); ON shows every row as its normal editable
  // control, populated or not.
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
          title="On: every field below is live and editable, filled or not. Off: only values you've actually entered show, as plain static text — no entry boxes anywhere."
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
              fieldRow(
                detailed, showHeight, 'height', `Height (${heightUnit})`,
                <input
                  className="ft-input"
                  inputMode="decimal"
                  value={profile.heightCm != null ? round1(cmToHeight(profile.heightCm, units.weight)) : ''}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={heightUnit === 'cm' ? 'e.g. 178' : 'e.g. 70'}
                />,
                profile.heightCm != null ? `${round1(cmToHeight(profile.heightCm, units.weight))} ${heightUnit}` : '',
              ),
              fieldRow(
                detailed, showWeight, 'weight', `Weight (${units.weight})`,
                <>
                  <input
                    className="ft-input"
                    inputMode="decimal"
                    value={weightDraft}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={units.weight === 'kg' ? 'e.g. 70' : 'e.g. 154'}
                  />
                  <p className="ft-hint-sm">Updates today's weigh-in log</p>
                </>,
                currentWeightKg != null ? `${round1(kgToWeight(currentWeightKg, units.weight))} ${units.weight}` : '',
              ),
              fieldRow(
                detailed, showAge, 'age', 'Age (years)',
                <input className="ft-input" inputMode="numeric" value={profile.age ?? ''} onChange={(e) => setProfile('age', e.target.value)} placeholder="e.g. 34" />,
                profile.age != null ? `${profile.age} years` : '',
              ),
              fieldRow(
                detailed, showSex, 'sex', 'Sex',
                <div className="ft-seg">
                  <button type="button" className={`ft-seg-btn${profile.sex === 'male' ? ' active' : ''}`} onClick={() => setSex('male')}>Male</button>
                  <button type="button" className={`ft-seg-btn${profile.sex === 'female' ? ' active' : ''}`} onClick={() => setSex('female')}>Female</button>
                </div>,
                profile.sex === 'male' ? 'Male' : profile.sex === 'female' ? 'Female' : '',
                <p className="ft-hint-sm">Used only for the BMR formula below — Mifflin-St Jeor has no other variant</p>,
              ),
            ].filter(Boolean))}
            {fieldRow(
              detailed, showNotes, 'notes', 'Notes',
              <textarea
                className="ft-input ft-textarea"
                value={profile.notes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Injuries, PRs, anything else worth tracking here"
                rows={3}
              />,
              profile.notes || '',
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
            fieldRow(
              detailed, showMaxHr, 'maxHr', 'Max HR (bpm)',
              <input className="ft-input" inputMode="numeric" value={profile.maxHr ?? ''} onChange={(e) => setProfile('maxHr', e.target.value)} placeholder="e.g. 190" />,
              profile.maxHr != null ? `${profile.maxHr} bpm` : '',
            ),
            fieldRow(
              detailed, showRestHr, 'restHr', 'Resting HR (bpm)',
              <input className="ft-input" inputMode="numeric" value={profile.restHr ?? ''} onChange={(e) => setProfile('restHr', e.target.value)} placeholder="e.g. 50" />,
              profile.restHr != null ? `${profile.restHr} bpm` : '',
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
            fieldRow(
              detailed, showBmr, 'bmr', 'BMR (kcal/day)',
              <>
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
              </>,
              profile.bmr != null ? `${profile.bmr} kcal/day` : '',
            ),
            fieldRow(
              detailed, showCalGoal, 'calGoal', 'Daily calorie goal',
              <input className="ft-input" inputMode="numeric" value={nutritionTarget.calories ?? ''} onChange={(e) => setNutritionTarget('calories', e.target.value)} placeholder="e.g. 1400" />,
              nutritionTarget.calories != null ? `${nutritionTarget.calories} kcal` : '',
            ),
            fieldRow(
              detailed, showProtein, 'protein', `Protein goal (${macroLabel})`,
              <>
                <input
                  className="ft-input"
                  inputMode="decimal"
                  value={macroInputValue(nutritionTarget.proteinG, KCAL_PER_G_PROTEIN)}
                  onChange={(e) => setMacro('proteinG', KCAL_PER_G_PROTEIN, e.target.value)}
                  placeholder={macroUnit === 'pct' ? 'e.g. 30' : 'optional'}
                  disabled={macroPctBlocked}
                />
                {macroPctBlocked && <p className="ft-hint-sm">Set a daily calorie goal above to enter as %</p>}
              </>,
              macroStaticText(nutritionTarget.proteinG, KCAL_PER_G_PROTEIN),
            ),
            fieldRow(
              detailed, showCarbs, 'carbs', `Carbs goal (${macroLabel})`,
              <>
                <input
                  className="ft-input"
                  inputMode="decimal"
                  value={macroInputValue(nutritionTarget.carbsG, KCAL_PER_G_CARB)}
                  onChange={(e) => setMacro('carbsG', KCAL_PER_G_CARB, e.target.value)}
                  placeholder={macroUnit === 'pct' ? 'e.g. 40' : 'optional'}
                  disabled={macroPctBlocked}
                />
                {macroPctBlocked && <p className="ft-hint-sm">Set a daily calorie goal above to enter as %</p>}
              </>,
              macroStaticText(nutritionTarget.carbsG, KCAL_PER_G_CARB),
            ),
            fieldRow(
              detailed, showFat, 'fat', `Fat goal (${macroLabel})`,
              <>
                <input
                  className="ft-input"
                  inputMode="decimal"
                  value={macroInputValue(nutritionTarget.fatG, KCAL_PER_G_FAT)}
                  onChange={(e) => setMacro('fatG', KCAL_PER_G_FAT, e.target.value)}
                  placeholder={macroUnit === 'pct' ? 'e.g. 30' : 'optional'}
                  disabled={macroPctBlocked}
                />
                {macroPctBlocked && <p className="ft-hint-sm">Set a daily calorie goal above to enter as %</p>}
              </>,
              macroStaticText(nutritionTarget.fatG, KCAL_PER_G_FAT),
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
