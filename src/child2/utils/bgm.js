// ─── 준우 전용 BGM 시스템 (Web Audio API) ───

let ctx = null;
let mainGain = null;
let bgmInterval = null;
let isPlaying = false;
let muted = false;

const NORMAL_VOL = 0.35;
const TTS_VOL = 0.12;
const BPM = 120;
const NOTE_DUR = 60 / BPM; // 0.5s per beat

// C4=261.63 기준 음계
const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26,
  G5: 783.99,
};

// 귀여운 동요풍 멜로디 (반복 루프)
const MELODY = [
  'C4', 'E4', 'G4', 'E4',
  'C4', 'E4', 'G4', 'E4',
  'D4', 'F4', 'A4', 'F4',
  'C4', 'E4', 'G4', 'C5',
  'E4', 'G4', 'C5', 'G4',
  'D4', 'F4', 'A4', 'F4',
  'E4', 'D4', 'C4', 'E4',
  'C4', 'E4', 'G4', 'C4',
];

// 정답 팡파레
const FANFARE = [
  'G4', 'G4', 'G4', 'C5',
  'E5', 'E5', 'E5', 'G5',
  'C5', 'E5', 'G5', 'C5',
];

// Load mute state
try {
  muted = localStorage.getItem('junwoo-bgm-muted') === 'true';
} catch {}

function getCtx() {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    mainGain = ctx.createGain();
    mainGain.connect(ctx.destination);
    mainGain.gain.value = muted ? 0 : NORMAL_VOL;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playNote(freq, startTime, duration, type = 'sine') {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(mainGain);

  osc.type = type;
  osc.frequency.value = freq;

  const attack = 0.02;
  const release = duration * 0.3;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.6, startTime + attack);
  gain.gain.setValueAtTime(0.6, startTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduleLoop() {
  if (!isPlaying) return;
  const c = getCtx();
  const now = c.currentTime;
  const beatLen = NOTE_DUR * 0.45; // Staccato feel

  MELODY.forEach((note, i) => {
    const freq = NOTES[note];
    if (freq) {
      // Alternate sine and triangle for xylophone feel
      playNote(freq, now + i * NOTE_DUR * 0.5, beatLen, i % 2 === 0 ? 'sine' : 'triangle');
    }
  });

  // Schedule next loop
  const loopDuration = MELODY.length * NOTE_DUR * 0.5;
  bgmInterval = setTimeout(scheduleLoop, (loopDuration - 0.5) * 1000);
}

// ─── Public API ───

export function startBGM() {
  if (isPlaying) return;
  isPlaying = true;
  getCtx();
  scheduleLoop();
}

export function stopBGM() {
  isPlaying = false;
  if (bgmInterval) { clearTimeout(bgmInterval); bgmInterval = null; }
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('junwoo-bgm-muted', String(muted)); } catch {}
  if (mainGain) mainGain.gain.value = muted ? 0 : NORMAL_VOL;
  return muted;
}

export function isMuted() {
  return muted;
}

// TTS ducking: lower BGM while speech plays
export function duckForTTS() {
  if (mainGain && !muted) {
    mainGain.gain.linearRampToValueAtTime(TTS_VOL, getCtx().currentTime + 0.1);
  }
}

export function unduckForTTS() {
  if (mainGain && !muted) {
    mainGain.gain.linearRampToValueAtTime(NORMAL_VOL, getCtx().currentTime + 0.3);
  }
}

// 정답 팡파레 (BGM 위에 겹쳐서 재생)
export function playCorrectFanfare() {
  const c = getCtx();
  const now = c.currentTime;
  const fanGain = c.createGain();
  fanGain.connect(c.destination);
  fanGain.gain.value = muted ? 0 : 0.4;

  FANFARE.forEach((note, i) => {
    const freq = NOTES[note]; if (!freq) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(fanGain);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  });
}

// 가챠 두구두구 드럼롤
export function playDrumroll(duration = 1.2) {
  const c = getCtx();
  const now = c.currentTime;
  const steps = Math.floor(duration / 0.06);

  for (let i = 0; i < steps; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(mainGain);
    osc.type = 'square';
    osc.frequency.value = 150 + (i / steps) * 200; // Rising pitch
    const t = now + i * 0.06;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(muted ? 0 : 0.08 + (i / steps) * 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  }
}
