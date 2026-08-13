import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import {
  Panel, Stat, Seg, EditableLines, fmtAgo,
} from '../EftBits';
import { exportAll, importAll, resetAll } from '../eftStorage';
import { SEED_HIDEOUT_NEEDS } from '../data/eftSeeds';

const LL_OPTIONS = [
  { value: 1, label: 'I' },
  { value: 2, label: 'II' },
  { value: 3, label: 'III' },
  { value: 4, label: 'IV' },
];

export default function SettingsView() {
  const {
    profile, sights, traders, stations, status, update, reloadStore, showToast,
  } = useEft();

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Only skills that actually gate a hideout upgrade matter for the Build
  // Order view's blocker calculation — no point asking for every game skill.
  const skillNames = useMemo(() => {
    const set = new Set();
    for (const st of stations) {
      for (const lv of st.levels) {
        for (const req of lv.skillRequirements) {
          if (req.name) set.add(req.name);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [stations]);

  const setPlayerLevel = (n) => update('profile', (p) => ({ ...p, playerLevel: n }));
  const setTraderLL = (normalizedName, ll) => update('profile', (p) => ({
    ...p, traders: { ...p.traders, [normalizedName]: ll },
  }));
  const setSkillLevel = (name, lvl) => update('profile', (p) => ({
    ...p, skills: { ...p.skills, [name]: lvl },
  }));

  const doExport = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eft-shopping-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.');
  };

  const doImportText = (text) => {
    const result = importAll(text);
    if (result.ok) {
      reloadStore();
      setImportError(null);
      setImportText('');
      showToast(`Imported ${result.keys.length} section${result.keys.length === 1 ? '' : 's'}.`);
    } else {
      setImportError(result.error);
      showToast(result.error);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => doImportText(String(reader.result || ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const doReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetAll();
    reloadStore();
    setConfirmReset(false);
    showToast('Everything reset to defaults.');
  };

  return (
    <>
      <Panel title="Data Source">
        <div className="eft-stats">
          <Stat label="Hideout data" value="game files" sub={fmtAgo(status.generatedAt)} />
          <Stat label="Prices" value={status.pricesFetchedAt ? fmtAgo(status.pricesFetchedAt) : "none"} />
          <Stat label="Last price error" value={status.priceError || 'none'} tone={status.priceError ? 'red' : 'green'} />
        </div>
      </Panel>

      <Panel title="Profile">
        <div className="eft-field" style={{ maxWidth: 160, marginBottom: 16 }}>
          <label htmlFor="player-level">Player level</label>
          <input
            id="player-level"
            type="number"
            className="eft-input eft-num"
            min={1}
            value={profile.playerLevel}
            onChange={(e) => setPlayerLevel(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <h3 style={{
          margin: '0 0 8px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--eft-text-faint)',
        }}
        >
          Trader loyalty levels
        </h3>
        {!traders.length ? (
          <div className="eft-empty">Trader list unavailable until the API loads.</div>
        ) : (
          <div className="eft-cols" style={{ marginBottom: 18 }}>
            {traders.map((t) => (
              <div className="eft-card" key={t.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t.imageLink ? (
                    <img src={t.imageLink} alt="" style={{
                      width: 26, height: 26, objectFit: 'contain', border: '1px solid var(--eft-line-bright)', background: '#0f0f0c',
                    }}
                    />
                  ) : null}
                  <h4 style={{ margin: 0 }}>{t.name}</h4>
                </div>
                <Seg
                  options={LL_OPTIONS}
                  value={profile.traders[t.normalizedName] || 1}
                  onChange={(v) => setTraderLL(t.normalizedName, v)}
                />
              </div>
            ))}
          </div>
        )}

        <h3 style={{
          margin: '0 0 8px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--eft-text-faint)',
        }}
        >
          Skill levels
        </h3>
        {!skillNames.length ? (
          <div className="eft-empty">No skill-gated upgrades found in the current hideout data.</div>
        ) : (
          <div className="eft-cols">
            {skillNames.map((name) => (
              <div className="eft-card" key={name}>
                <h4>{name}</h4>
                <input
                  type="number"
                  className="eft-input eft-num"
                  min={0}
                  max={51}
                  value={profile.skills[name] ?? 0}
                  onChange={(e) => setSkillLevel(name, Math.max(0, Math.min(51, Number(e.target.value) || 0)))}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Sights">
        <div className="eft-cols">
          <div className="eft-card">
            <h4>Like</h4>
            <EditableLines
              lines={sights.like}
              onChange={(lines) => update('sights', (s) => ({ ...s, like: lines }))}
              placeholder="Add a sight…"
            />
          </div>
          <div className="eft-card">
            <h4>Meh</h4>
            <EditableLines
              lines={sights.meh}
              onChange={(lines) => update('sights', (s) => ({ ...s, meh: lines }))}
              placeholder="Add a sight…"
            />
          </div>
          <div className="eft-card">
            <h4>Dogshit</h4>
            <EditableLines
              lines={sights.dogshit}
              onChange={(lines) => update('sights', (s) => ({ ...s, dogshit: lines }))}
              placeholder="Add a sight…"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Original sheet notes — hideout needs (reference only)">
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead><tr><th>Item</th><th>Amount</th></tr></thead>
            <tbody>
              {SEED_HIDEOUT_NEEDS.map(([name, qty]) => (
                <tr key={name}><td>{name}</td><td>{qty}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Backup">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button type="button" className="eft-btn eft-is-primary" onClick={doExport}>Export JSON</button>
          <label className="eft-btn eft-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            Import file…
            <input type="file" accept="application/json" onChange={onFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="eft-field">
          <label htmlFor="import-paste">Or paste backup JSON</label>
          <textarea
            id="import-paste"
            className="eft-textarea"
            value={importText}
            placeholder="Paste exported JSON here…"
            onChange={(e) => setImportText(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="eft-btn eft-btn-sm"
            disabled={!importText.trim()}
            onClick={() => doImportText(importText)}
          >
            Import pasted JSON
          </button>
        </div>

        {importError ? <div className="eft-banner eft-is-error" style={{ marginTop: 12 }}>{importError}</div> : null}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--eft-line)' }}>
          <button
            type="button"
            className={`eft-btn eft-btn-sm eft-is-danger${confirmReset ? ' eft-is-on' : ''}`}
            onClick={doReset}
          >
            {confirmReset ? 'Click again to confirm — this cannot be undone' : 'Reset everything'}
          </button>
          {confirmReset ? (
            <button type="button" className="eft-btn eft-btn-sm" style={{ marginLeft: 8 }} onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
