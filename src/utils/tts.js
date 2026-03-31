let cachedVoice = null;
let voicesLoaded = false;

function loadVoices() {
  if (voicesLoaded) return;
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    voicesLoaded = true;
  };
}

function getBestKoreanVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const priority = [
    'Google 한국의',
    'Microsoft Heami',
    'Microsoft SunHi',
    'Yuna',
    'Siri',
  ];

  for (const name of priority) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith('ko'));
    if (v) { cachedVoice = v; return v; }
  }

  const koVoice = voices.find((v) => v.lang === 'ko-KR' || v.lang === 'ko_KR' || v.lang.startsWith('ko'));
  if (koVoice) { cachedVoice = koVoice; return koVoice; }
  return null;
}

// Init voice loading
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

/**
 * speak for 형 (child1) — slightly high pitch, moderate speed
 */
export function speak(text, options = {}) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = getBestKoreanVoice();
  if (voice) u.voice = voice;
  u.lang = 'ko-KR';
  u.rate = options.rate ?? 0.85;
  u.pitch = options.pitch ?? 1.1;
  u.volume = 1;
  if (options.onEnd) u.onend = options.onEnd;
  speechSynthesis.speak(u);
}

/**
 * speak for 준우 (child2) — higher pitch, slower, cuter
 */
export function speakCute(text, options = {}) {
  speak(text, { rate: 0.8, pitch: 1.3, ...options });
}
