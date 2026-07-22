// localStorage persistence for TimerTool. Keys are unchanged from the original
// single-file version so existing saved timers/presets aren't wiped on deploy.
const TIMERS_KEY = 'astral_timer_tool_timers';
const PRESETS_KEY = 'astral_timer_tool_presets';

export const DEFAULT_PRESETS = [
  { id: 'preset-beep-single', name: 'Single Beep', type: 'synth', freq: 880, duration: 200, count: 1 },
  { id: 'preset-beep-triple', name: 'Triple Beep', type: 'synth', freq: 1000, duration: 150, count: 3 },
  { id: 'preset-beep-chime', name: 'Melodic Chime', type: 'synth', freq: 587, duration: 300, count: 2, melody: true },
  { id: 'preset-voice-m1', name: 'Voice - Milestone 1', type: 'voice', text: 'Timer {name} milestone one reached' },
  { id: 'preset-voice-m2', name: 'Voice - Milestone 2', type: 'voice', text: 'Timer {name} has finished' },
];

export const DEFAULT_TIMERS = [
  { id: 'timer-1', name: 'Timer 1', phaseOne: 65, phaseTwo: 120, phaseOneLabel: 'Milestone 1', phaseTwoLabel: 'Milestone 2', alarmOneId: 'preset-voice-m1', alarmTwoId: 'preset-voice-m2' },
  { id: 'timer-2', name: 'Timer 2', phaseOne: 45, phaseTwo: 80, phaseOneLabel: 'Milestone 1', phaseTwoLabel: 'Milestone 2', alarmOneId: 'preset-beep-single', alarmTwoId: 'preset-beep-triple' },
  { id: 'timer-3', name: 'Timer 3', phaseOne: 95, phaseTwo: 120, phaseOneLabel: 'Milestone 1', phaseTwoLabel: 'Milestone 2', alarmOneId: 'preset-voice-m1', alarmTwoId: 'preset-beep-triple' },
  { id: 'timer-4', name: 'Timer 4', phaseOne: 125, phaseTwo: 240, phaseOneLabel: 'Milestone 1', phaseTwoLabel: 'Milestone 2', alarmOneId: 'preset-beep-chime', alarmTwoId: 'preset-voice-m2' },
];

// Backfills phaseOneLabel/phaseTwoLabel on timers saved before those fields
// existed, so old localStorage data still renders correctly after this rebuild.
function normalizeTimer(t) {
  return { phaseOneLabel: 'Milestone 1', phaseTwoLabel: 'Milestone 2', ...t };
}

export const TimerToolStorage = {
  getTimers() {
    try {
      const saved = localStorage.getItem(TIMERS_KEY);
      const arr = saved ? JSON.parse(saved) : DEFAULT_TIMERS;
      return arr.map(normalizeTimer);
    } catch {
      return DEFAULT_TIMERS;
    }
  },
  saveTimers(timers) {
    localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
  },
  getPresets() {
    try {
      const saved = localStorage.getItem(PRESETS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  },
  savePresets(presets) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  },
  restoreDefaults() {
    localStorage.removeItem(TIMERS_KEY);
    localStorage.removeItem(PRESETS_KEY);
    return { timers: DEFAULT_TIMERS, presets: DEFAULT_PRESETS };
  },
};
