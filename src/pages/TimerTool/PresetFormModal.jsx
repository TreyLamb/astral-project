import { useState } from 'react';
import { useTimerTool } from './timerToolContext';

export default function PresetFormModal({ onClose }) {
  const { addPreset } = useTimerTool();
  const [name, setName] = useState('');
  const [type, setType] = useState('synth'); // synth | voice
  const [freq, setFreq] = useState(880);
  const [duration, setDuration] = useState(200);
  const [count, setCount] = useState(1);
  const [melody, setMelody] = useState(false);
  const [text, setText] = useState('Timer {name} alert');

  function save(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addPreset({
      name: name.trim(),
      type,
      freq: Number(freq),
      duration: Number(duration),
      count: Number(count),
      melody,
      text: text.trim(),
    });
    onClose();
  }

  return (
    <div className="tt-modal-overlay" onClick={onClose}>
      <div className="tt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tt-modal-header">
          <h3>Create sound preset</h3>
          <button className="tt-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save}>
          <div className="tt-form-group">
            <label>Preset name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Extreme Beep" required />
          </div>
          <div className="tt-form-group">
            <label>Alarm type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="synth">Synthesizer (beep tone)</option>
              <option value="voice">Speech synthesis (voice spoken)</option>
            </select>
          </div>

          {type === 'synth' ? (
            <>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label>Frequency (Hz)</label>
                  <input type="number" value={freq} onChange={(e) => setFreq(e.target.value)} min="200" max="3000" required />
                </div>
                <div className="tt-form-group">
                  <label>Duration (ms)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="50" max="2000" required />
                </div>
              </div>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label>Beep count</label>
                  <input type="number" value={count} onChange={(e) => setCount(e.target.value)} min="1" max="10" required />
                </div>
                <div className="tt-form-group tt-form-checkbox">
                  <label>
                    <input type="checkbox" checked={melody} onChange={(e) => setMelody(e.target.checked)} />
                    Enable chime melody
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="tt-form-group">
              <label>Spoken text phrase (use <em>{'{name}'}</em> for the timer's name)</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} required />
            </div>
          )}

          <div className="tt-modal-actions">
            <button type="button" className="tt-btn tt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="tt-btn tt-btn-primary">Save preset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
