// Pure Web Audio / SpeechSynthesis helpers — no React, no state. Used by both
// the running tick engine (timerToolContext.js) and a preset's "Test" button.
export function playSynthBeep(freq, duration, count, melody = false) {
  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;
    const audioCtx = new AudioCtxClass();
    let time = audioCtx.currentTime;

    if (melody) {
      const notes = [freq, freq * 1.25, freq * 1.5];
      notes.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, time + idx * 0.2);
        gain.gain.setValueAtTime(0.08, time + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.2 + duration / 1000);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time + idx * 0.2);
        osc.stop(time + idx * 0.2 + duration / 1000);
      });
    } else {
      for (let i = 0; i < count; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration / 1000);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration / 1000);
        time += (duration + 100) / 1000;
      }
    }
  } catch (err) {
    console.warn('AudioContext error', err);
  }
}

export function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}
