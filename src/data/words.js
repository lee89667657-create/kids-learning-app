import { getCustomWords } from '../utils/storage';

const builtinWords = [
  // 가족
  { word: '엄마', category: '가족', emoji: '👩', sound: '엄마', image: null },
  { word: '아빠', category: '가족', emoji: '👨', sound: '아빠', image: null },
  { word: '형', category: '가족', emoji: '👦', sound: '형', image: null },
  { word: '동생', category: '가족', emoji: '👶', sound: '동생', image: null },
  { word: '할머니', category: '가족', emoji: '👵', sound: '할머니', image: null },
  { word: '할아버지', category: '가족', emoji: '👴', sound: '할아버지', image: null },

  // 신체
  { word: '눈', category: '신체', emoji: '👁️', sound: '눈', image: null },
  { word: '코', category: '신체', emoji: '👃', sound: '코', image: null },
  { word: '입', category: '신체', emoji: '👄', sound: '입', image: null },
  { word: '귀', category: '신체', emoji: '👂', sound: '귀', image: null },
  { word: '손', category: '신체', emoji: '🖐️', sound: '손', image: null },
  { word: '발', category: '신체', emoji: '🦶', sound: '발', image: null },
  { word: '배', category: '신체', emoji: '🫃', sound: '배', image: null },

  // 음식
  { word: '밥', category: '음식', emoji: '🍚', sound: '밥', image: null },
  { word: '물', category: '음식', emoji: '💧', sound: '물', image: null },
  { word: '우유', category: '음식', emoji: '🥛', sound: '우유', image: null },
  { word: '빵', category: '음식', emoji: '🍞', sound: '빵', image: null },
  { word: '사과', category: '음식', emoji: '🍎', sound: '사과', image: null },
  { word: '바나나', category: '음식', emoji: '🍌', sound: '바나나', image: null },

  // 일상용품
  { word: '컵', category: '일상용품', emoji: '🥤', sound: '컵', image: null },
  { word: '의자', category: '일상용품', emoji: '🪑', sound: '의자', image: null },
  { word: '침대', category: '일상용품', emoji: '🛏️', sound: '침대', image: null },
  { word: '신발', category: '일상용품', emoji: '👟', sound: '신발', image: null },
  { word: '가방', category: '일상용품', emoji: '🎒', sound: '가방', image: null },
  { word: '책', category: '일상용품', emoji: '📖', sound: '책', image: null },

  // 장소
  { word: '집', category: '장소', emoji: '🏠', sound: '집', image: null },
  { word: '학교', category: '장소', emoji: '🏫', sound: '학교', image: null },
  { word: '화장실', category: '장소', emoji: '🚽', sound: '화장실', image: null },
  { word: '방', category: '장소', emoji: '🚪', sound: '방', image: null },
  { word: '부엌', category: '장소', emoji: '🍳', sound: '부엌', image: null },
];

export const categories = ['가족', '신체', '음식', '일상용품', '장소'];

export function getAllWords() {
  const custom = getCustomWords();
  // Merge: custom words override builtins with same word
  const map = new Map();
  builtinWords.forEach((w) => map.set(w.word, w));
  custom.forEach((w) => map.set(w.word, w));
  return Array.from(map.values());
}

export function getWordsByCategory(category) {
  return getAllWords().filter((w) => w.category === category);
}

export function getRandomWords(count, category) {
  const pool = category ? getWordsByCategory(category) : getAllWords();
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default builtinWords;
