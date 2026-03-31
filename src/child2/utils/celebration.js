// ─── Fanfare (Web Audio API) ───
export function playFanfare() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = i < 8 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch { /* no audio */ }
}

export function playMegaFanfare() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Chord burst
    [523, 659, 784, 1047].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    });
    // Rising sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 1.5);
  } catch { /* no audio */ }
}
