import { useState } from 'react';
import { useTimerTool } from './timerToolContext';
import { DEFAULT_PRESETS } from './timerToolStorage';
import PresetFormModal from './PresetFormModal';

// Global preset/sound library only — per-timer config (name, milestones, which
// alarm plays) now lives on each card via its own gear-icon editor, so there's
// no redundant read-only timer list here duplicating what the dashboard already shows live.
export default function SettingsPresets() {
  const { presets, testPreset, removePreset, restoreDefaults } = useTimerTool();
  const [showAddPreset, setShowAddPreset] = useState(false);

  return (
    <section className="tt-settings-section">
      <div className="tt-section-header">
        <h2>Alarm & sound presets</h2>
        <div className="tt-header-actions">
          <button className="tt-btn tt-btn-secondary" onClick={() => setShowAddPreset(true)}>+ Add sound preset</button>
          <button className="tt-btn tt-btn-danger" onClick={restoreDefaults}>Reset to defaults</button>
        </div>
      </div>

      <p className="tt-settings-desc">Manage custom synthesized tones or text-to-speech presets, shared across every timer.</p>

      <div className="tt-presets-list">
        {presets.map((preset) => (
          <div key={preset.id} className="tt-preset-item">
            <div className="tt-preset-info">
              <strong>{preset.name}</strong>
              <span className="tt-preset-badge">{preset.type}</span>
              <span className="tt-preset-details">
                {preset.type === 'synth' ? `${preset.freq}Hz, ${preset.duration}ms (${preset.count}x)` : `"${preset.text}"`}
              </span>
            </div>
            <div className="tt-preset-actions">
              <button className="tt-btn tt-btn-sm tt-btn-secondary" onClick={() => testPreset(preset)}>🔊 Test</button>
              {!DEFAULT_PRESETS.some((p) => p.id === preset.id) && (
                <button className="tt-btn tt-btn-sm tt-btn-danger" onClick={() => removePreset(preset.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddPreset && <PresetFormModal onClose={() => setShowAddPreset(false)} />}
    </section>
  );
}
