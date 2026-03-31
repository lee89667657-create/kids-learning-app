import { useState, useEffect, useCallback } from 'react';
import { addScore } from '../utils/storage';

const ANIMALS = [
  { name: '강아지', emoji: '🐕', silhouette: 'M25,70 Q30,30 50,25 Q70,30 75,70 Q50,80 25,70Z' },
  { name: '고양이', emoji: '🐱', silhouette: 'M30,75 L25,35 L35,20 L40,35 L60,35 L65,20 L75,35 L70,75Z' },
  { name: '토끼', emoji: '🐰', silhouette: 'M35,80 L30,45 L35,10 L42,35 L58,35 L65,10 L70,45 L65,80Z' },
  { name: '코끼리', emoji: '🐘', silhouette: 'M20,75 L20,35 Q25,20 45,25 L55,25 Q75,20 80,35 L80,75 L65,75 L65,55 Q50,70 35,55 L35,75Z' },
  { name: '기린', emoji: '🦒', silhouette: 'M40,80 L35,50 L38,15 L45,10 L52,15 L55,30 L65,50 L60,80Z' },
  { name: '펭귄', emoji: '🐧', silhouette: 'M35,80 L30,50 Q25,35 35,25 Q50,15 65,25 Q75,35 70,50 L65,80Z' },
  { name: '곰', emoji: '🐻', silhouette: 'M25,75 L22,40 Q20,25 30,20 Q40,15 50,20 Q60,15 70,20 Q80,25 78,40 L75,75Z' },
  { name: '사자', emoji: '🦁', silhouette: 'M20,70 Q15,40 25,25 Q35,10 50,15 Q65,10 75,25 Q85,40 80,70 Q50,85 20,70Z' },
];

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.75; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound(exclude) {
  const pool = ANIMALS.filter((a) => a.name !== exclude);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(ANIMALS.filter((a) => a.name !== answer.name)).slice(0, 2);
  const choices = shuffle([answer, ...others]);
  return { answer, choices };
}

export default function ShadowMatch({ onBack }) {
  const [round, setRound] = useState(() => pickRound(''));
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTimeout(() => speak('어떤 동물의 그림자일까요?'), 400);
  }, []);

  const nextRound = useCallback(() => {
    const r = pickRound(round.answer.name);
    setRound(r);
    setSelected(null);
    setIsCorrect(null);
    setTimeout(() => speak('어떤 동물의 그림자일까요?'), 300);
  }, [round.answer.name]);

  function handlePick(animal) {
    if (selected) return;
    setSelected(animal.name);
    const correct = animal.name === round.answer.name;
    setIsCorrect(correct);
    setTotal((t) => t + 1);

    if (correct) {
      setScore((s) => s + 1);
      addScore('child2', 'shadow', 1);
      speak(`맞았어요! ${animal.name}!`);
      setTimeout(nextRound, 2000);
    } else {
      speak('다시 해봐요!');
      setTimeout(() => { setSelected(null); setIsCorrect(null); }, 1200);
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D' }}>{score} / {total}</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Question */}
      <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '2vh', flexShrink: 0, textAlign: 'center' }}>
        어떤 동물의 그림자일까요? 🤔
      </div>

      {/* Main: shadow + choices */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', minHeight: 0 }}>
        {/* Shadow */}
        <div style={{
          width: 'min(30vw, 30vh)', height: 'min(30vw, 30vh)',
          backgroundColor: '#F5F0E8', borderRadius: 'min(3vw, 28px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
            <path d={round.answer.silhouette} fill="#3E3E3E" />
          </svg>
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          {round.choices.map((animal) => {
            let border = '4px solid transparent';
            let bg = '#FFFFFF';
            let anim = 'none';
            if (selected === animal.name && isCorrect) { border = '4px solid #A5D6A7'; bg = '#E8F5E9'; }
            if (selected === animal.name && isCorrect === false) { anim = 'shake 0.4s ease-in-out'; }

            return (
              <button key={animal.name} style={{
                width: 'min(25vw, 25vh)', height: 'min(12vw, 12vh)',
                borderRadius: 'min(2vw, 20px)', border, backgroundColor: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5vw',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease', animation: anim,
              }} onClick={() => handlePick(animal)}>
                <span style={{ fontSize: 'min(5vw, 44px)' }}>{animal.emoji}</span>
                <span style={{ fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', color: '#5D4E37' }}>{animal.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
