import { useState, useEffect, useCallback } from 'react';
import { addScore } from '../utils/storage';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, playFanfare } from './utils/celebration';

const ANIMALS = [
  { name: '강아지', emoji: '🐕' },
  { name: '고양이', emoji: '🐱' },
  { name: '토끼', emoji: '🐰' },
  { name: '코끼리', emoji: '🐘' },
  { name: '기린', emoji: '🦒' },
  { name: '펭귄', emoji: '🐧' },
  { name: '곰', emoji: '🐻' },
  { name: '사자', emoji: '🦁' },
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
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function pickRound(exclude) {
  const pool = ANIMALS.filter((a) => a.name !== exclude);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(ANIMALS.filter((a) => a.name !== answer.name)).slice(0, 2);
  return { answer, choices: shuffle([answer, ...others]) };
}

export default function ShadowMatch({ onBack }) {
  const [round, setRound] = useState(() => pickRound(''));
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [celebMode, setCelebMode] = useState(null);

  useEffect(() => { setTimeout(() => speak('어떤 동물의 그림자일까요?'), 400); }, []);

  const nextRound = useCallback(() => {
    const r = pickRound(round.answer.name);
    setRound(r); setSelected(null); setIsCorrect(null);
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
      playFanfare();
      speakPraise();
      setCelebMode('big');
    } else {
      speakWrong();
      setTimeout(() => { setSelected(null); setIsCorrect(null); }, 1200);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden' }}>
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => { setCelebMode(null); nextRound(); }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D' }}>⭐ {score * 10}점 ({score}/{total})</div>
        <div style={{ width: '8vw' }} />
      </div>

      <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '2vh', flexShrink: 0, textAlign: 'center' }}>
        어떤 동물의 그림자일까요? 🤔
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', minHeight: 0 }}>
        <div style={{ width: 'min(35vw, 35vh)', height: 'min(35vw, 35vh)', backgroundColor: '#F5F0E8', borderRadius: 'min(3vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: 'min(20vw, 20vh)', filter: 'brightness(0)', opacity: 0.8, lineHeight: 1, userSelect: 'none' }}>{round.answer.emoji}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          {round.choices.map((animal) => (
            <button key={animal.name} style={{
              width: 'min(28vw, 28vh)', height: 'min(14vw, 14vh)', borderRadius: 'min(2vw, 20px)',
              border: selected === animal.name && isCorrect ? '4px solid #A5D6A7' : '4px solid transparent',
              backgroundColor: selected === animal.name && isCorrect ? '#E8F5E9' : '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2vw',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', transition: 'all 0.3s ease',
              animation: selected === animal.name && isCorrect === false ? 'shake 0.4s ease-in-out' : 'none',
            }} onClick={() => handlePick(animal)}>
              <span style={{ fontSize: 'min(8vw, 64px)', lineHeight: 1 }}>{animal.emoji}</span>
              <span style={{ fontSize: 'min(3vw, 26px)', fontWeight: 'bold', color: '#5D4E37' }}>{animal.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
