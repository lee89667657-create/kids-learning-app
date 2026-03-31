import { useState, useCallback, useEffect } from 'react';
import { categories, getWordsByCategory, getAllWords } from '../data/words';
import { recordWordAttempt, addScore, getAllCustomImages } from '../utils/storage';
import ImageWithEdit from '../components/ImageWithEdit';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#FFF9F0',
    padding: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
  },
  backBtn: {
    fontSize: 28,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 12,
    borderRadius: 16,
    color: '#5D4E37',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  catRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  catBtn: {
    padding: '10px 20px',
    borderRadius: 20,
    border: '2px solid #D4C5B0',
    backgroundColor: '#FFF3E0',
    fontSize: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#5D4E37',
    transition: 'all 0.2s ease',
  },
  catBtnActive: {
    backgroundColor: '#FFE0B2',
    borderColor: '#FFA726',
  },
  speakBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    border: 'none',
    backgroundColor: '#BBDEFB',
    fontSize: 52,
    cursor: 'pointer',
    marginBottom: 28,
    transition: 'transform 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    maxWidth: 400,
  },
  card: {
    width: 160,
    height: 160,
    borderRadius: 28,
    border: '4px solid transparent',
    backgroundColor: '#FFFFFF',
    fontSize: 64,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  scoreText: {
    fontSize: 22,
    color: '#7A6B5D',
    marginTop: 20,
  },
};

function speak(text, onEnd) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.75;
    u.pitch = 1.1;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }
}

function pickChoices(correctWord, pool) {
  const others = pool
    .filter((w) => w.word !== correctWord.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const choices = [...others, correctWord].sort(() => Math.random() - 0.5);
  return choices;
}

export default function WordMatch({ onBack }) {
  const [category, setCategory] = useState('가족');
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [imgVersion, setImgVersion] = useState(0);

  const startRound = useCallback(
    (cat) => {
      const pool = getWordsByCategory(cat);
      if (pool.length === 0) return;
      const target = pool[Math.floor(Math.random() * pool.length)];
      const allWords = pool.length >= 4 ? pool : getAllWords();
      const ch = pickChoices(target, allWords);
      setCurrent(target);
      setChoices(ch);
      setResult(null);
      setTimeout(() => speak(target.sound), 300);
    },
    [],
  );

  useEffect(() => {
    startRound(category);
  }, []);

  function handleCategoryChange(cat) {
    setCategory(cat);
    setScore(0);
    setTotal(0);
    startRound(cat);
  }

  function handleSpeak() {
    if (current) speak(current.sound);
  }

  function handlePick(word) {
    if (result) return;
    const correct = word.word === current.word;
    setResult({ word: word.word, correct });
    setTotal((t) => t + 1);

    recordWordAttempt('child1', current.word, correct);

    if (correct) {
      setScore((s) => s + 1);
      addScore('child1', 'wordMatch', 1);
      speak('맞았어!');
      setTimeout(() => startRound(category), 1500);
    } else {
      setTimeout(() => {
        setResult(null);
        speak(current.sound);
      }, 1000);
    }
  }

  function cardStyle(word) {
    const base = { ...styles.card };
    if (result && result.word === word.word && result.correct) {
      base.borderColor = '#A5D6A7';
      base.backgroundColor = '#E8F5E9';
      base.transform = 'scale(1.05)';
    } else if (result && result.word === word.word && !result.correct) {
      base.transform = 'translateX(-4px)';
      base.animation = 'shake 0.4s ease-in-out';
    }
    return base;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={styles.title}>🗣️ 단어 듣기</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.catRow}>
        {categories.map((cat) => (
          <button
            key={cat}
            style={{
              ...styles.catBtn,
              ...(category === cat ? styles.catBtnActive : {}),
            }}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <button style={styles.speakBtn} onClick={handleSpeak}>
        🔊
      </button>

      <div style={styles.cardsGrid}>
        {choices.map((w) => (
          <button
            key={w.word}
            style={cardStyle(w)}
            onClick={() => handlePick(w)}
          >
            <ImageWithEdit
              imageKey={w.word}
              fallbackEmoji={w.emoji}
              size={80}
              shape="square"
              label={w.word}
              onImageChange={() => setImgVersion((v) => v + 1)}
              style={{ borderRadius: 12 }}
            />
            <span style={styles.cardLabel}>{w.word}</span>
          </button>
        ))}
      </div>

      <div style={styles.scoreText}>
        {total > 0 ? `${score} / ${total}` : '소리를 듣고 맞는 그림을 골라봐!'}
      </div>
    </div>
  );
}
