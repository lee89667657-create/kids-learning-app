import { useState, useEffect, useCallback, useRef } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
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
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [celebMode, setCelebMode] = useState(null);
  const [matched, setMatched] = useState(false); // correct placed on shadow
  const [wrongSnap, setWrongSnap] = useState(null); // name of card snapping back

  // Drag state
  const [dragging, setDragging] = useState(null); // animal name being dragged
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 }); // current drag position
  const [nearShadow, setNearShadow] = useState(false); // card is over shadow zone
  const cardOrigins = useRef({}); // original positions of cards
  const shadowRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { setTimeout(() => speak('동물을 그림자에 올려봐요!'), 400); }, []);

  const nextRound = useCallback(() => {
    const r = pickRound(round.answer.name);
    setRound(r);
    setMatched(false);
    setWrongSnap(null);
    setDragging(null);
    setNearShadow(false);
    setTimeout(() => speak('동물을 그림자에 올려봐요!'), 300);
  }, [round.answer.name]);

  function isOverShadow(x, y) {
    if (!shadowRef.current) return false;
    const rect = shadowRef.current.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function handlePointerDown(e, animal) {
    if (matched || wrongSnap) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // Store origin
    const rect = e.currentTarget.getBoundingClientRect();
    cardOrigins.current[animal.name] = { x: rect.left, y: rect.top };
    setDragging(animal.name);
    setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    setNearShadow(isOverShadow(e.clientX, e.clientY));
  }

  function handlePointerUp(e) {
    if (!dragging) return;
    e.preventDefault();
    const overShadow = isOverShadow(e.clientX, e.clientY);
    const animal = round.choices.find((a) => a.name === dragging);

    if (overShadow && animal) {
      const correct = animal.name === round.answer.name;
      setTotal((t) => t + 1);

      if (correct) {
        setMatched(true);
        setScore((s) => s + 1);
        addScore('child2', 'shadow', 1);
        playFanfare();
        speakPraise();
        setCelebMode('big');
      } else {
        setWrongSnap(animal.name);
        speakWrong();
        setTimeout(() => { setWrongSnap(null); }, 600);
      }
    }

    setDragging(null);
    setNearShadow(false);
  }

  // Card style: dragging offset or snap-back
  function getCardStyle(animal) {
    const base = {
      width: 'min(24vw, 24vh)',
      height: 'min(13vw, 13vh)',
      borderRadius: 'min(2.5vw, 20px)',
      border: '4px solid transparent',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5vw',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      cursor: 'grab',
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      transition: dragging === animal.name ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      position: 'relative',
      zIndex: dragging === animal.name ? 100 : 1,
    };

    if (dragging === animal.name) {
      const origin = cardOrigins.current[animal.name];
      if (origin) {
        const dx = dragPos.x - origin.x - 60; // offset to center under finger
        const dy = dragPos.y - origin.y - 40;
        base.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
        base.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
        base.cursor = 'grabbing';
      }
    }

    if (wrongSnap === animal.name) {
      base.animation = 'shake 0.4s ease-in-out';
    }

    if (matched && animal.name === round.answer.name) {
      base.opacity = 0.3;
    }

    return base;
  }

  // Shadow glow intensity
  const shadowGlow = nearShadow ? '0 0 30px rgba(255,224,130,0.7), 0 0 60px rgba(255,183,77,0.3)' : '0 4px 16px rgba(0,0,0,0.08)';
  const shadowBorder = nearShadow ? '4px dashed #FFA726' : matched ? '4px solid #A5D6A7' : '4px dashed #D4C5B0';

  return (
    <div ref={containerRef} style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => { setCelebMode(null); nextRound(); }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D' }}>⭐ {score * 10}점 ({score}/{total})</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Question */}
      <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh', flexShrink: 0, textAlign: 'center' }}>
        {matched ? '맞았어요! 🎉' : '동물을 그림자에 올려봐요!'}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', minHeight: 0 }}>
        {/* Shadow drop zone */}
        <div ref={shadowRef} style={{
          width: 'min(35vw, 35vh)', height: 'min(35vw, 35vh)',
          backgroundColor: nearShadow ? '#FFF8E1' : '#F5F0E8',
          borderRadius: 'min(3vw, 28px)',
          border: shadowBorder,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: shadowGlow,
          transition: 'all 0.3s ease',
          position: 'relative',
        }}>
          {matched ? (
            <span style={{ fontSize: 'min(20vw, 20vh)', lineHeight: 1, animation: 'snapIn 0.4s ease-out' }}>
              {round.answer.emoji}
            </span>
          ) : (
            <>
              <span style={{ fontSize: 'min(20vw, 20vh)', filter: 'brightness(0)', opacity: nearShadow ? 0.4 : 0.8, lineHeight: 1, userSelect: 'none', transition: 'opacity 0.2s ease' }}>
                {round.answer.emoji}
              </span>
              <div style={{ fontSize: 'min(1.8vw, 14px)', color: '#B0A090', marginTop: '1vh', textAlign: 'center' }}>
                여기에 올려봐요!
              </div>
            </>
          )}
        </div>

        {/* Draggable cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          {round.choices.map((animal) => (
            <div
              key={animal.name}
              style={getCardStyle(animal)}
              onPointerDown={(e) => handlePointerDown(e, animal)}
            >
              <span style={{ fontSize: 'min(7vw, 56px)', lineHeight: 1, pointerEvents: 'none' }}>{animal.emoji}</span>
              <span style={{ fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{animal.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes snapIn {
          0% { transform: scale(0.5); opacity: 0.5; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
