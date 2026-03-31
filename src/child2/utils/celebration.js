// ─── TTS ───
const PRAISE_LINES = [
  '와! 대단해요! 준우 최고!',
  '완전 잘했어요! 짝짝짝!',
  '우와 천재다! 준우 짱!',
  '야호! 정답이에요! 최고최고!',
  '멋져요! 준우 진짜 잘한다!',
  '와! 역시 준우! 짱이야!',
];

const COMPLETE_LINES = [
  '게임 끝! 준우 짱짱맨!',
  '준우 완전 최고야! 대단해!',
  '다 맞혔어요! 준우 천재!',
];

export function speakPraise() {
  const text = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
  speak(text);
}

export function speakComplete() {
  const text = COMPLETE_LINES[Math.floor(Math.random() * COMPLETE_LINES.length)];
  speak(text);
}

export function speakWrong() {
  speak('괜찮아~ 다시 해봐요!');
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    u.pitch = 1.2;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  }
}

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
