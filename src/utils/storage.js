const STORAGE_KEY = 'kids-learning-app';
const IMAGES_KEY = 'kids-learning-images';
const CUSTOM_WORDS_KEY = 'kids-learning-custom-words';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getProfile(profileId) {
  const data = loadAll();
  if (!data[profileId]) {
    data[profileId] = {
      scores: {},
      wordStats: {},
      lastPlayed: null,
      strokeLetters: [],
    };
    saveAll(data);
  }
  return data[profileId];
}

export function getScore(profileId, game) {
  const profile = getProfile(profileId);
  return profile.scores[game] || 0;
}

export function addScore(profileId, game, points) {
  const data = loadAll();
  const profile = getProfile(profileId);
  profile.scores[game] = (profile.scores[game] || 0) + points;
  profile.lastPlayed = new Date().toISOString().slice(0, 10);
  data[profileId] = profile;
  saveAll(data);
}

export function recordWordAttempt(profileId, word, correct) {
  const data = loadAll();
  const profile = getProfile(profileId);
  if (!profile.wordStats[word]) {
    profile.wordStats[word] = { correct: 0, wrong: 0 };
  }
  if (correct) {
    profile.wordStats[word].correct += 1;
  } else {
    profile.wordStats[word].wrong += 1;
  }
  profile.lastPlayed = new Date().toISOString().slice(0, 10);
  data[profileId] = profile;
  saveAll(data);
}

export function getWordStats(profileId) {
  return getProfile(profileId).wordStats;
}

export function recordStrokeLetter(profileId, letter) {
  const data = loadAll();
  const profile = getProfile(profileId);
  if (!profile.strokeLetters.includes(letter)) {
    profile.strokeLetters.push(letter);
  }
  profile.lastPlayed = new Date().toISOString().slice(0, 10);
  data[profileId] = profile;
  saveAll(data);
}

export function getStrokeLetters(profileId) {
  return getProfile(profileId).strokeLetters;
}

export function getLastPlayed(profileId) {
  return getProfile(profileId).lastPlayed;
}

// --- Custom image management ---

function loadImages() {
  try {
    const raw = localStorage.getItem(IMAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveImages(data) {
  localStorage.setItem(IMAGES_KEY, JSON.stringify(data));
}

export function saveCustomImage(wordId, base64) {
  const images = loadImages();
  images[wordId] = base64;
  saveImages(images);
}

export function getCustomImage(wordId) {
  const images = loadImages();
  return images[wordId] || null;
}

export function deleteCustomImage(wordId) {
  const images = loadImages();
  delete images[wordId];
  saveImages(images);
}

export function getAllCustomImages() {
  return loadImages();
}

// --- Custom word management ---

function loadCustomWords() {
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomWordsData(data) {
  localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(data));
}

export function addCustomWord(category, wordData) {
  const custom = loadCustomWords();
  custom.push({ ...wordData, category, _custom: true });
  saveCustomWordsData(custom);
}

export function deleteCustomWord(wordId) {
  const custom = loadCustomWords();
  const filtered = custom.filter((w) => w.word !== wordId);
  saveCustomWordsData(filtered);
  deleteCustomImage(wordId);
}

export function updateCustomWord(oldWord, newData) {
  const custom = loadCustomWords();
  const idx = custom.findIndex((w) => w.word === oldWord);
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...newData };
    saveCustomWordsData(custom);
  }
}

export function getCustomWords() {
  return loadCustomWords();
}
