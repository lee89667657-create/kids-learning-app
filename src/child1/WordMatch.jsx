import { useState, useCallback, useEffect } from 'react';
import { categories, getWordsByCategory, getAllWords } from '../data/words';
import { recordWordAttempt, addScore } from '../utils/storage';
import ImageWithEdit from '../components/ImageWithEdit';
import { speak } from '../utils/tts';

function pickChoices(correctWord, pool) {
  const others = pool.filter((w) => w.word !== correctWord.word).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correctWord].sort(() => Math.random() - 0.5);
}

export default function WordMatch({ onBack }) {
  const [category, setCategory] = useState('가족');
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [imgVersion, setImgVersion] = useState(0);

  const startRound = useCallback((cat) => {
    const pool = getWordsByCategory(cat);
    if (pool.length === 0) return;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const allWords = pool.length >= 4 ? pool : getAllWords();
    setCurrent(target);
    setChoices(pickChoices(target, allWords));
    setResult(null);
    setTimeout(() => speak(target.sound), 300);
  }, []);

  useEffect(() => { startRound(category); }, []);

  function handleCategoryChange(cat) {
    setCategory(cat);
    setScore(0);
    setTotal(0);
    startRound(cat);
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
      setTimeout(() => { setResult(null); speak(current.sound); }, 1000);
    }
  }

  function cardBorder(word) {
    if (result && result.word === word.word && result.correct) return '#A5D6A7';
    return 'transparent';
  }
  function cardBg(word) {
    if (result && result.word === word.word && result.correct) return '#E8F5E9';
    return '#FFFFFF';
  }
  function cardTransform(word) {
    if (result && result.word === word.word && result.correct) return 'scale(1.05)';
    if (result && result.word === word.word && !result.correct) return 'translateX(-4px)';
    return 'none';
  }
  function cardAnim(word) {
    if (result && result.word === word.word && !result.correct) return 'shake 0.4s ease-in-out';
    return 'none';
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#FFF9F0',
      padding: '2vh 3vw',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '1vh',
        flexShrink: 0,
      }}>
        <button style={{
          fontSize: 'min(3vw, 28px)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '1vh 1vw',
          borderRadius: 16,
          color: '#5D4E37',
        }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: '5vw', fontWeight: 'bold', color: '#5D4E37' }}>🗣️ 단어 듣기</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Category */}
      <div style={{ display: 'flex', gap: 'min(1vw, 10px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5vh', flexShrink: 0 }}>
        {categories.map((cat) => (
          <button key={cat} style={{
            padding: '0.8vh 1.5vw',
            borderRadius: 20,
            border: '2px solid ' + (category === cat ? '#FFA726' : '#D4C5B0'),
            backgroundColor: category === cat ? '#FFE0B2' : '#FFF3E0',
            fontSize: 'min(2vw, 20px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: '#5D4E37',
          }} onClick={() => handleCategoryChange(cat)}>{cat}</button>
        ))}
      </div>

      {/* Speaker */}
      <button style={{
        width: 'min(12vw, 10vh)',
        height: 'min(12vw, 10vh)',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#BBDEFB',
        fontSize: 'min(6vw, 52px)',
        cursor: 'pointer',
        marginBottom: '2vh',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }} onClick={() => current && speak(current.sound)}>🔊</button>

      {/* Cards */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '2vw',
        width: '88vw',
        maxHeight: '60vh',
      }}>
        {choices.map((w) => (
          <button key={w.word} style={{
            width: '42vw',
            height: '38vh',
            borderRadius: '2vw',
            border: `4px solid ${cardBorder(w)}`,
            backgroundColor: cardBg(w),
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5vh',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            transform: cardTransform(w),
            animation: cardAnim(w),
          }} onClick={() => handlePick(w)}>
            <ImageWithEdit
              imageKey={w.word}
              fallbackEmoji={w.emoji}
              size={80}
              sizeCSS="10vw"
              shape="square"
              label={w.word}
              onImageChange={() => setImgVersion((v) => v + 1)}
              style={{ borderRadius: 12 }}
            />
            <span style={{ fontSize: '2.5vw', fontWeight: 'bold', color: '#5D4E37' }}>{w.word}</span>
          </button>
        ))}
      </div>

      {/* Score */}
      <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D', marginTop: '1.5vh', flexShrink: 0 }}>
        {total > 0 ? `${score} / ${total}` : '소리를 듣고 맞는 그림을 골라봐!'}
      </div>
    </div>
  );
}
