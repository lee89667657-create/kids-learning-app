import { useState, useEffect, useCallback, useRef } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, speakComplete, playFanfare, playMegaFanfare } from './utils/celebration';

// ─── Problem Data ───
// Each category has: question, attribute, pairs with SVG renderers
// difficulty 1 = big difference, 2 = medium, 3 = subtle

const CATEGORIES = [
  {
    id: 'length',
    question: '어떤 게 더 길까요?',
    attribute: '길어요',
    wrongAttr: '짧아요',
    pairs: [
      { a: { label: '긴 연필', len: 0.9 }, b: { label: '짧은 연필', len: 0.35 }, diff: 1 },
      { a: { label: '긴 연필', len: 0.85 }, b: { label: '짧은 연필', len: 0.5 }, diff: 2 },
      { a: { label: '긴 연필', len: 0.8 }, b: { label: '짧은 연필', len: 0.6 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const pencilW = w * 0.8 * item.len;
      const pencilH = h * 0.12;
      const x = (w - pencilW) / 2;
      const y = (h - pencilH) / 2;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={x} y={y} width={pencilW} height={pencilH} rx={pencilH / 2} fill="#FFD54F" />
          <polygon points={`${x + pencilW},${y} ${x + pencilW + 16},${y + pencilH / 2} ${x + pencilW},${y + pencilH}`} fill="#E8A723" />
          <rect x={x} y={y} width={pencilH * 0.8} height={pencilH} rx={4} fill="#FF8A80" />
        </svg>
      );
    },
  },
  {
    id: 'size',
    question: '어떤 게 더 클까요?',
    attribute: '커요',
    wrongAttr: '작아요',
    pairs: [
      { a: { label: '큰 공', r: 0.38 }, b: { label: '작은 공', r: 0.15 }, diff: 1 },
      { a: { label: '큰 공', r: 0.35 }, b: { label: '작은 공', r: 0.2 }, diff: 2 },
      { a: { label: '큰 공', r: 0.32 }, b: { label: '작은 공', r: 0.25 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const r = Math.min(w, h) * item.r;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <circle cx={w / 2} cy={h / 2} r={r} fill="#EF9A9A" />
          <ellipse cx={w / 2 - r * 0.3} cy={h / 2 - r * 0.3} rx={r * 0.15} ry={r * 0.1} fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    },
  },
  {
    id: 'width',
    question: '어떤 게 더 넓을까요?',
    attribute: '넓어요',
    wrongAttr: '좁아요',
    pairs: [
      { a: { label: '넓은 길', roadW: 0.7 }, b: { label: '좁은 길', roadW: 0.25 }, diff: 1 },
      { a: { label: '넓은 길', roadW: 0.6 }, b: { label: '좁은 길', roadW: 0.3 }, diff: 2 },
      { a: { label: '넓은 길', roadW: 0.55 }, b: { label: '좁은 길', roadW: 0.38 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const rw = w * item.roadW;
      const x = (w - rw) / 2;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={x} y={h * 0.1} width={rw} height={h * 0.8} rx={8} fill="#A5D6A7" />
          <line x1={w / 2} y1={h * 0.15} x2={w / 2} y2={h * 0.85} stroke="#FFF" strokeWidth={3} strokeDasharray="10,8" />
        </svg>
      );
    },
  },
  {
    id: 'quantity',
    question: '어떤 게 더 많을까요?',
    attribute: '많아요',
    wrongAttr: '적어요',
    pairs: [
      { a: { label: '많은 사탕', count: 8 }, b: { label: '적은 사탕', count: 2 }, diff: 1 },
      { a: { label: '많은 사탕', count: 7 }, b: { label: '적은 사탕', count: 3 }, diff: 2 },
      { a: { label: '많은 사탕', count: 6 }, b: { label: '적은 사탕', count: 4 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const candies = [];
      const cols = Math.ceil(Math.sqrt(item.count));
      const rows = Math.ceil(item.count / cols);
      const gapX = w / (cols + 1);
      const gapY = h / (rows + 1);
      const r = Math.min(gapX, gapY) * 0.35;
      const colors = ['#EF9A9A', '#CE93D8', '#90CAF9', '#A5D6A7', '#FFE082', '#FFAB91'];
      for (let i = 0; i < item.count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        candies.push(
          <circle key={i} cx={gapX * (col + 1)} cy={gapY * (row + 1)} r={r} fill={colors[i % colors.length]} />
        );
      }
      return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{candies}</svg>;
    },
  },
  {
    id: 'weight',
    question: '어떤 게 더 무거울까요?',
    attribute: '무거워요',
    wrongAttr: '가벼워요',
    pairs: [
      { a: { label: '코끼리', emoji: '🐘', s: 1.0 }, b: { label: '새', emoji: '🐦', s: 0.4 }, diff: 1 },
      { a: { label: '곰', emoji: '🐻', s: 0.9 }, b: { label: '고양이', emoji: '🐱', s: 0.5 }, diff: 2 },
      { a: { label: '강아지', emoji: '🐕', s: 0.8 }, b: { label: '햄스터', emoji: '🐹', s: 0.55 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const fs = Math.min(w, h) * item.s * 0.6;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central" fontSize={fs}>{item.emoji}</text>
        </svg>
      );
    },
  },
  {
    id: 'speed',
    question: '어떤 게 더 빠를까요?',
    attribute: '빨라요',
    wrongAttr: '느려요',
    pairs: [
      { a: { label: '치타', emoji: '🐆', s: 1.0 }, b: { label: '거북이', emoji: '🐢', s: 0.4 }, diff: 1 },
      { a: { label: '토끼', emoji: '🐇', s: 0.9 }, b: { label: '달팽이', emoji: '🐌', s: 0.45 }, diff: 2 },
      { a: { label: '말', emoji: '🐎', s: 0.85 }, b: { label: '오리', emoji: '🦆', s: 0.55 }, diff: 3 },
    ],
    render: (item, w, h) => {
      const fs = Math.min(w, h) * item.s * 0.6;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central" fontSize={fs}>{item.emoji}</text>
        </svg>
      );
    },
  },
];

function pickProblem(difficulty) {
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  // Find pair matching difficulty, fallback to any
  const matching = cat.pairs.filter((p) => p.diff <= difficulty);
  const pair = matching.length > 0 ? matching[matching.length - 1] : cat.pairs[0];
  // Randomize left/right placement
  const flip = Math.random() > 0.5;
  return {
    category: cat,
    left: flip ? pair.b : pair.a,
    right: flip ? pair.a : pair.b,
    correctSide: flip ? 'right' : 'left',
  };
}

const TOTAL_QUESTIONS = 10;

export default function CompareGame({ onBack }) {
  const [difficulty, setDifficulty] = useState(1);
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState(() => pickProblem(1));
  const [selected, setSelected] = useState(null); // 'left' | 'right'
  const [isCorrect, setIsCorrect] = useState(null);
  const [stars, setStars] = useState(0);
  const [questionNum, setQuestionNum] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const [showStarAnim, setShowStarAnim] = useState(false);
  const [celebMode, setCelebMode] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setTimeout(() => speak(problem.category.question), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const nextProblem = useCallback((newDiff) => {
    if (questionNum >= TOTAL_QUESTIONS) {
      setShowComplete(true);
      setCelebMode('mega');
      playMegaFanfare();
      speakComplete();
      return;
    }
    const p = pickProblem(newDiff);
    setProblem(p);
    setSelected(null);
    setIsCorrect(null);
    setQuestionNum((n) => n + 1);
    setTimeout(() => speak(p.category.question), 400);
  }, [questionNum]);

  function handleSelect(side) {
    if (selected) return;
    setSelected(side);
    const correct = side === problem.correctSide;
    setIsCorrect(correct);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setStars((s) => s + 1);
      addScore('child2', 'compare', 1);
      playFanfare();
      speakPraise();
      setCelebMode('big');

      let newDiff = difficulty;
      if (newStreak >= 3 && difficulty < 3) {
        newDiff = difficulty + 1;
        setDifficulty(newDiff);
        setStreak(0);
      }

      timerRef.current = setTimeout(() => { setCelebMode(null); nextProblem(newDiff); }, 2200);
    } else {
      setStreak(0);
      speakWrong();
      timerRef.current = setTimeout(() => { setSelected(null); setIsCorrect(null); }, 1500);
    }
  }

  if (showComplete) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden', gap: '3vh',
      }}>
        <CelebrationOverlay mode={celebMode} score={stars} onDone={() => setCelebMode(null)} />
        <div style={{ fontSize: 'min(8vw, 60px)' }}>🎉</div>
        <div style={{ fontSize: 'min(5vw, 44px)', fontWeight: 'bold', color: '#5D4E37' }}>준우 완전 최고야!!!</div>
        <div style={{ fontSize: 'min(3vw, 28px)', color: '#7A6B5D' }}>
          {'⭐'.repeat(stars)} ({stars}/{TOTAL_QUESTIONS})
        </div>
        <button style={{
          padding: '2vh 5vw', fontSize: 'min(3vw, 28px)', fontWeight: 'bold', borderRadius: 24,
          border: 'none', backgroundColor: '#BBDEFB', color: '#1565C0', cursor: 'pointer',
        }} onClick={() => {
          setStars(0); setQuestionNum(1); setDifficulty(1); setStreak(0); setShowComplete(false);
          const p = pickProblem(1); setProblem(p); setSelected(null); setIsCorrect(null);
          setTimeout(() => speak(p.category.question), 400);
        }}>다시 하기</button>
        <button style={{
          padding: '1.5vh 3vw', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', borderRadius: 20,
          border: '2px solid #D4C5B0', backgroundColor: '#FFF3E0', color: '#5D4E37', cursor: 'pointer',
        }} onClick={onBack}>뒤로</button>
      </div>
    );
  }

  const cardW = 'min(35vw, 35vh)';
  const cardH = 'min(35vw, 35vh)';

  function cardStyle(side) {
    let border = '4px solid transparent';
    let bg = '#FFFFFF';
    let transform = 'scale(1)';
    let anim = 'none';
    let shadow = '0 4px 16px rgba(0,0,0,0.08)';

    if (selected === side && isCorrect === true) {
      border = '6px solid #A5D6A7';
      bg = '#E8F5E9';
      transform = 'scale(1.05)';
      shadow = '0 8px 32px rgba(76,175,80,0.3)';
    } else if (selected === side && isCorrect === false) {
      anim = 'shake 0.4s ease-in-out';
    } else if (selected && selected !== side && isCorrect === false) {
      // Hint: glow the correct one
      if (side === problem.correctSide) {
        border = '4px solid #FFE082';
        shadow = '0 0 20px rgba(255,224,130,0.6)';
      }
    }

    return {
      width: cardW,
      height: cardH,
      borderRadius: 'min(3vw, 28px)',
      border,
      backgroundColor: bg,
      cursor: selected ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: shadow,
      transform,
      animation: anim,
      padding: 0,
      overflow: 'hidden',
    };
  }

  // Calculate SVG render size in px (approximate for vw/vh)
  const svgSize = 200;

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      <CelebrationOverlay mode={celebMode} score={stars} onDone={() => setCelebMode(null)} />
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', marginBottom: '1vh', flexShrink: 0,
      }}>
        <button style={{
          fontSize: 'min(3vw, 28px)', background: 'none', border: 'none',
          cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37',
        }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D' }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(TOTAL_QUESTIONS - stars)} {questionNum}/{TOTAL_QUESTIONS}
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Question */}
      <div style={{
        fontSize: 'min(4.5vw, 40px)', fontWeight: 'bold', color: '#5D4E37',
        marginBottom: '2vh', textAlign: 'center', flexShrink: 0,
        position: 'relative',
      }}>
        {problem.category.question}
        {showStarAnim && (
          <span style={{
            position: 'absolute', right: '-4vw', top: '-1vh',
            fontSize: 'min(5vw, 44px)', animation: 'starPop 0.8s ease-out forwards',
          }}>⭐</span>
        )}
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'min(4vw, 40px)', minHeight: 0,
      }}>
        <button style={cardStyle('left')} onClick={() => handleSelect('left')}>
          {problem.category.render(problem.left, svgSize, svgSize)}
        </button>
        <button style={cardStyle('right')} onClick={() => handleSelect('right')}>
          {problem.category.render(problem.right, svgSize, svgSize)}
        </button>
      </div>

      {/* Feedback */}
      <div style={{
        fontSize: 'min(3vw, 28px)', fontWeight: 'bold', marginTop: '1vh',
        height: '5vh', display: 'flex', alignItems: 'center', flexShrink: 0,
        color: isCorrect === true ? '#4CAF50' : isCorrect === false ? '#7A6B5D' : 'transparent',
        transition: 'color 0.3s ease',
      }}>
        {isCorrect === true && '맞았어요! 🌟'}
        {isCorrect === false && '다시 해봐요!'}
        {isCorrect === null && '\u00A0'}
      </div>
    </div>
  );
}
