let cachedVoice = null;
let voicesLoaded = false;
let lastText = '';
let lastTime = 0;
let resumeTimer = null;
let cancelled = false;

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

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

// Split long text into chunks at punctuation/space boundaries
function splitText(text) {
  if (text.length <= 10) return [text];

  const parts = text.split(/([,!?~\s]+)/);
  const chunks = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const last = chunks[chunks.length - 1];
    if (last && last.length + trimmed.length < 12) {
      chunks[chunks.length - 1] = last + ' ' + trimmed;
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

// Play chunks sequentially
function playChunks(chunks, options, index) {
  if (cancelled || index >= chunks.length) {
    if (resumeTimer) { clearInterval(resumeTimer); resumeTimer = null; }
    if (index >= chunks.length) options.onEnd?.();
    return;
  }

  const u = new SpeechSynthesisUtterance(chunks[index]);
  const voice = getBestKoreanVoice();
  if (voice) u.voice = voice;
  u.lang = 'ko-KR';
  u.rate = options.rate ?? 0.85;
  u.pitch = options.pitch ?? 1.1;
  u.volume = 1;

  u.onend = () => playChunks(chunks, options, index + 1);
  u.onerror = () => playChunks(chunks, options, index + 1);

  speechSynthesis.speak(u);
}

/**
 * speak for 형 (child1)
 */
export function speak(text, options = {}) {
  if (!('speechSynthesis' in window)) return;

  // Prevent duplicate calls with same text within 300ms
  const now = Date.now();
  if (text === lastText && now - lastTime < 300) return;
  lastText = text;
  lastTime = now;

  // Cancel previous
  speechSynthesis.cancel();
  cancelled = false;
  if (resumeTimer) { clearInterval(resumeTimer); resumeTimer = null; }

  // Delay after cancel to avoid Chrome stuttering
  setTimeout(() => {
    if (cancelled) return;

    const chunks = splitText(text);

    // Chrome 15s pause bug: resume timer
    resumeTimer = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(resumeTimer);
        resumeTimer = null;
        return;
      }
      if (speechSynthesis.paused) speechSynthesis.resume();
    }, 10000);

    playChunks(chunks, options, 0);
  }, 150);
}

// BGM ducking callbacks — set by bgm.js to avoid circular imports
let _duckFn = null;
let _unduckFn = null;

export function setBGMDuckCallbacks(duck, unduck) {
  _duckFn = duck;
  _unduckFn = unduck;
}

/**
 * speak for 준우 (child2) — higher pitch, slower, cuter
 * Ducks BGM while speaking
 */
export function speakCute(text, options = {}) {
  _duckFn?.();
  speak(text, {
    rate: 0.8,
    pitch: 1.3,
    ...options,
    onEnd: () => {
      _unduckFn?.();
      options.onEnd?.();
    },
  });
}

/**
 * Stop all speech — call in useEffect cleanup
 */
export function stopSpeech() {
  cancelled = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (resumeTimer) { clearInterval(resumeTimer); resumeTimer = null; }
}
