import { useState, useEffect, useCallback, useRef } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, speakComplete, playFanfare, playMegaFanfare } from './utils/celebration';

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

function playHonk() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [300, 400].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.25;
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  } catch {}
}

// ──────────────── Stage 1: Shadow drag match ────────────────

function pickRound(exclude) {
  const pool = ANIMALS.filter((a) => a.name !== exclude);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(ANIMALS.filter((a) => a.name !== answer.name)).slice(0, 2);
  return { answer, choices: shuffle([answer, ...others]) };
}

function Stage1({ onComplete, score, total, setScore, setTotal }) {
  const [round, setRound] = useState(() => pickRound(''));
  const [celebMode, setCelebMode] = useState(null);
  const [matched, setMatched] = useState(false);
  const [wrongSnap, setWrongSnap] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [nearShadow, setNearShadow] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const cardOrigins = useRef({});
  const shadowRef = useRef(null);

  useEffect(() => { setTimeout(() => speak('동물을 그림자에 올려봐요!'), 400); }, []);

  const nextRound = useCallback(() => {
    const newCount = roundCount + 1;
    setRoundCount(newCount);
    if (newCount >= 3) {
      speak('잘했어요! 이제 버스 게임 해봐요!');
      setTimeout(() => onComplete(), 1500);
      return;
    }
    const r = pickRound(round.answer.name);
    setRound(r); setMatched(false); setWrongSnap(null); setDragging(null); setNearShadow(false);
    setTimeout(() => speak('동물을 그림자에 올려봐요!'), 300);
  }, [round.answer.name, roundCount, onComplete]);

  function isOverShadow(x, y) {
    if (!shadowRef.current) return false;
    const r = shadowRef.current.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function handlePointerDown(e, animal) {
    if (matched || wrongSnap) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    cardOrigins.current[animal.name] = { x: r.left, y: r.top };
    setDragging(animal.name); setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e) {
    if (!dragging) return; e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    setNearShadow(isOverShadow(e.clientX, e.clientY));
  }

  function handlePointerUp(e) {
    if (!dragging) return; e.preventDefault();
    const over = isOverShadow(e.clientX, e.clientY);
    const animal = round.choices.find((a) => a.name === dragging);
    if (over && animal) {
      setTotal((t) => t + 1);
      if (animal.name === round.answer.name) {
        setMatched(true); setScore((s) => s + 1);
        addScore('child2', 'shadow', 1); playFanfare(); speakPraise();
        setCelebMode('big');
      } else {
        setWrongSnap(animal.name); speakWrong();
        setTimeout(() => setWrongSnap(null), 600);
      }
    }
    setDragging(null); setNearShadow(false);
  }

  function cardStyle(animal) {
    const s = {
      width: 'min(24vw, 24vh)', height: 'min(13vw, 13vh)', borderRadius: 'min(2.5vw, 20px)',
      border: '4px solid transparent', backgroundColor: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5vw',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)', cursor: 'grab', touchAction: 'none',
      userSelect: 'none', WebkitUserSelect: 'none', position: 'relative',
      transition: dragging === animal.name ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      zIndex: dragging === animal.name ? 100 : 1,
    };
    if (dragging === animal.name) {
      const o = cardOrigins.current[animal.name];
      if (o) { s.transform = `translate(${dragPos.x - o.x - 60}px, ${dragPos.y - o.y - 40}px) scale(1.1)`; s.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'; s.cursor = 'grabbing'; }
    }
    if (wrongSnap === animal.name) s.animation = 'shake 0.4s ease-in-out';
    if (matched && animal.name === round.answer.name) s.opacity = 0.3;
    return s;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}
      onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => { setCelebMode(null); nextRound(); }} />
      <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh', flexShrink: 0 }}>
        {matched ? '맞았어요! 🎉' : '동물을 그림자에 올려봐요!'}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', minHeight: 0 }}>
        <div ref={shadowRef} style={{
          width: 'min(35vw, 35vh)', height: 'min(35vw, 35vh)',
          backgroundColor: nearShadow ? '#FFF8E1' : '#F5F0E8', borderRadius: 'min(3vw, 28px)',
          border: nearShadow ? '4px dashed #FFA726' : matched ? '4px solid #A5D6A7' : '4px dashed #D4C5B0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: nearShadow ? '0 0 30px rgba(255,224,130,0.7)' : '0 4px 16px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}>
          {matched
            ? <span style={{ fontSize: 'min(20vw, 20vh)', lineHeight: 1, animation: 'snapIn 0.4s ease-out' }}>{round.answer.emoji}</span>
            : <><span style={{ fontSize: 'min(20vw, 20vh)', filter: 'brightness(0)', opacity: nearShadow ? 0.4 : 0.8, lineHeight: 1, transition: 'opacity 0.2s ease' }}>{round.answer.emoji}</span>
              <div style={{ fontSize: 'min(1.8vw, 14px)', color: '#B0A090', marginTop: '1vh' }}>여기에 올려봐요!</div></>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          {round.choices.map((a) => (
            <div key={a.name} style={cardStyle(a)} onPointerDown={(e) => handlePointerDown(e, a)}>
              <span style={{ fontSize: 'min(7vw, 56px)', lineHeight: 1, pointerEvents: 'none' }}>{a.emoji}</span>
              <span style={{ fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────── Stage 2: Bus game ────────────────

function pickBusRound(seatCount) {
  const picked = shuffle(ANIMALS).slice(0, seatCount);
  const extra = shuffle(ANIMALS.filter((a) => !picked.find((p) => p.name === a.name))).slice(0, 2);
  return { seats: picked, cards: shuffle([...picked, ...extra]) };
}

function Stage2({ score, total, setScore, setTotal }) {
  const [seatCount] = useState(3);
  const [busRound, setBusRound] = useState(() => pickBusRound(3));
  const [filled, setFilled] = useState([]); // indices of filled seats
  const [celebMode, setCelebMode] = useState(null);
  const [busDriving, setBusDriving] = useState(false);
  const [wrongSnap, setWrongSnap] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [nearSeat, setNearSeat] = useState(-1);
  const cardOrigins = useRef({});
  const seatRefs = useRef([]);

  const nextSeatIdx = filled.length;
  const allFilled = filled.length === busRound.seats.length;

  useEffect(() => { setTimeout(() => speak('버스에 동물을 태워봐요! 1번부터!'), 400); }, []);

  function newBusRound() {
    const r = pickBusRound(seatCount);
    setBusRound(r); setFilled([]); setBusDriving(false);
    setWrongSnap(null); setDragging(null); setNearSeat(-1);
    setTimeout(() => speak('새 버스가 왔어요! 1번부터 태워봐요!'), 500);
  }

  function isOverSeat(x, y, idx) {
    const el = seatRefs.current[idx];
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function handlePointerDown(e, animal) {
    if (allFilled || busDriving || wrongSnap) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    cardOrigins.current[animal.name] = { x: r.left, y: r.top };
    setDragging(animal.name); setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e) {
    if (!dragging) return; e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    // Check which seat we're near
    let found = -1;
    for (let i = 0; i < busRound.seats.length; i++) {
      if (isOverSeat(e.clientX, e.clientY, i)) { found = i; break; }
    }
    setNearSeat(found);
  }

  function handlePointerUp(e) {
    if (!dragging) return; e.preventDefault();
    const animal = busRound.cards.find((a) => a.name === dragging);

    if (nearSeat >= 0 && animal) {
      // Must fill in order
      if (nearSeat !== nextSeatIdx) {
        speak(`${nextSeatIdx + 1}번부터 채워봐요!`);
        setDragging(null); setNearSeat(-1);
        return;
      }

      setTotal((t) => t + 1);
      const expected = busRound.seats[nearSeat];
      if (animal.name === expected.name) {
        const newFilled = [...filled, nearSeat];
        setFilled(newFilled);
        setScore((s) => s + 1);
        addScore('child2', 'shadow', 1);

        if (newFilled.length === busRound.seats.length) {
          // All filled - bus departs!
          playHonk();
          setCelebMode('mega');
          speakComplete();
          setTimeout(() => {
            setBusDriving(true);
            speak('출발~! 모두 탔어요!');
          }, 1000);
          setTimeout(() => { setCelebMode(null); newBusRound(); }, 4000);
        } else {
          playFanfare(); speakPraise();
          setCelebMode('big');
          setTimeout(() => setCelebMode(null), 2000);
        }
      } else {
        setWrongSnap(animal.name); speakWrong();
        setTimeout(() => setWrongSnap(null), 600);
      }
    }

    setDragging(null); setNearSeat(-1);
  }

  function cardStyle(animal) {
    const isPlaced = filled.some((fi) => busRound.seats[fi]?.name === animal.name);
    const s = {
      width: 'min(14vw, 14vh)', height: 'min(14vw, 14vh)', borderRadius: 'min(2vw, 16px)',
      border: '3px solid transparent', backgroundColor: '#FFFFFF',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3vh',
      boxShadow: '0 3px 10px rgba(0,0,0,0.06)', cursor: isPlaced ? 'default' : 'grab', touchAction: 'none',
      userSelect: 'none', WebkitUserSelect: 'none', position: 'relative',
      transition: dragging === animal.name ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      zIndex: dragging === animal.name ? 100 : 1,
      opacity: isPlaced ? 0.3 : 1,
    };
    if (dragging === animal.name) {
      const o = cardOrigins.current[animal.name];
      if (o) { s.transform = `translate(${dragPos.x - o.x - 40}px, ${dragPos.y - o.y - 40}px) scale(1.1)`; s.boxShadow = '0 10px 28px rgba(0,0,0,0.2)'; }
    }
    if (wrongSnap === animal.name) s.animation = 'shake 0.4s ease-in-out';
    return s;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}
      onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => {}} />

      <div style={{ fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1vh', flexShrink: 0 }}>
        {allFilled ? '출발~! 🚌💨' : `${nextSeatIdx + 1}번 자리에 동물을 태워봐요!`}
      </div>

      {/* Bus */}
      <div style={{
        flexShrink: 0, position: 'relative', marginBottom: '1.5vh',
        transition: 'transform 2s ease-in',
        transform: busDriving ? 'translateX(120vw)' : 'translateX(0)',
      }}>
        <svg viewBox="0 0 300 120" style={{ width: 'min(70vw, 70vh)', height: 'min(28vw, 28vh)' }}>
          {/* Bus body */}
          <rect x="20" y="20" width="260" height="70" rx="15" fill="#FFB74D" stroke="#F57C00" strokeWidth="3" />
          {/* Roof */}
          <rect x="30" y="15" width="240" height="10" rx="5" fill="#FFA726" />
          {/* Front */}
          <rect x="250" y="30" width="25" height="50" rx="8" fill="#FFE0B2" stroke="#F57C00" strokeWidth="2" />
          {/* Driver */}
          <text x="262" y="62" textAnchor="middle" fontSize="20">🧑‍✈️</text>
          {/* Headlight */}
          <circle cx="278" cy="75" r="5" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="1.5" />
          {/* Wheels */}
          <circle cx="70" cy="95" r="14" fill="#5D4037" stroke="#3E2723" strokeWidth="3">
            {busDriving && <animateTransform attributeName="transform" type="rotate" values="0 70 95;360 70 95" dur="0.5s" repeatCount="indefinite" />}
          </circle>
          <circle cx="220" cy="95" r="14" fill="#5D4037" stroke="#3E2723" strokeWidth="3">
            {busDriving && <animateTransform attributeName="transform" type="rotate" values="0 220 95;360 220 95" dur="0.5s" repeatCount="indefinite" />}
          </circle>

          {/* Windows / seats */}
          {busRound.seats.map((animal, i) => {
            const wx = 45 + i * 60;
            const isFilled = filled.includes(i);
            const isNext = i === nextSeatIdx && !allFilled;
            return (
              <g key={i}>
                <rect x={wx} y="30" width="45" height="40" rx="8"
                  fill={isFilled ? '#E8F5E9' : isNext ? '#FFF8E1' : '#E3F2FD'}
                  stroke={isFilled ? '#A5D6A7' : isNext ? '#FFA726' : '#90CAF9'}
                  strokeWidth={isNext ? 3 : 2}
                  strokeDasharray={isFilled ? 'none' : '4,3'}
                  ref={(el) => { seatRefs.current[i] = el; }}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {isFilled ? (
                  <text x={wx + 22} y="56" textAnchor="middle" fontSize="24"
                    style={{ animation: 'snapIn 0.4s ease-out' }}>{animal.emoji}</text>
                ) : (
                  <text x={wx + 22} y="56" textAnchor="middle" fontSize="24"
                    style={{ filter: 'brightness(0)', opacity: nearSeat === i ? 0.4 : 0.15 }}>{animal.emoji}</text>
                )}
                <text x={wx + 22} y="78" textAnchor="middle" fontSize="10" fill="#7A6B5D" fontWeight="bold">{i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Animal cards */}
      <div style={{ display: 'flex', gap: 'min(1.5vw, 12px)', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
        {busRound.cards.map((animal) => {
          const isPlaced = filled.some((fi) => busRound.seats[fi]?.name === animal.name);
          return (
            <div key={animal.name} style={cardStyle(animal)}
              onPointerDown={(e) => !isPlaced && handlePointerDown(e, animal)}>
              <span style={{ fontSize: 'min(5vw, 40px)', lineHeight: 1, pointerEvents: 'none' }}>{animal.emoji}</span>
              <span style={{ fontSize: 'min(1.6vw, 14px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{animal.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────── Main ShadowMatch ────────────────

export default function ShadowMatch({ onBack }) {
  const [stage, setStage] = useState(1); // 1 or 2
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
          <button style={{
            padding: '0.5vh 1.5vw', borderRadius: 14, fontSize: 'min(1.8vw, 16px)', fontWeight: 'bold', cursor: 'pointer',
            border: '2px solid ' + (stage === 1 ? '#FFA726' : '#D4C5B0'),
            backgroundColor: stage === 1 ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37',
          }} onClick={() => setStage(1)}>그림자</button>
          <button style={{
            padding: '0.5vh 1.5vw', borderRadius: 14, fontSize: 'min(1.8vw, 16px)', fontWeight: 'bold', cursor: 'pointer',
            border: '2px solid ' + (stage === 2 ? '#FFA726' : '#D4C5B0'),
            backgroundColor: stage === 2 ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37',
          }} onClick={() => setStage(2)}>🚌 버스</button>
          <span style={{ fontSize: 'min(2vw, 18px)', color: '#7A6B5D' }}>⭐{score * 10}점</span>
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      {stage === 1 && <Stage1 onComplete={() => setStage(2)} score={score} total={total} setScore={setScore} setTotal={setTotal} />}
      {stage === 2 && <Stage2 score={score} total={total} setScore={setScore} setTotal={setTotal} />}

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
