import { useState, useRef, useEffect } from 'react';

const BALLS = [
  { id: 'compare', emoji: '📏', label: '비교 게임', color: '#FFD54F', tts: '비교 게임이 나왔어요!' },
  { id: 'shadow', emoji: '🐾', label: '그림자 맞추기', color: '#A5D6A7', tts: '그림자 맞추기가 나왔어요!' },
  { id: 'path', emoji: '〰️', label: '길 이어주기', color: '#90CAF9', tts: '길 이어주기가 나왔어요!' },
  { id: 'pack', emoji: '🎒', label: '가방 채우기', color: '#CE93D8', tts: '가방 채우기가 나왔어요!' },
];

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.8; u.pitch = 1.2;
    window.speechSynthesis.speak(u);
  }
}

function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [600, 800, 1000].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  } catch {}
}

export default function Child2Home({ onNavigate, onBack }) {
  const [phase, setPhase] = useState('idle'); // idle | cranking | mixing | dispensed
  const [dispensedBall, setDispensedBall] = useState(null);
  const [lastBallId, setLastBallId] = useState(null);
  const [handleAngle, setHandleAngle] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const dragging = useRef(false);
  const dragStartY = useRef(0);

  // Pick a random ball (not same as last)
  function pickBall() {
    const pool = BALLS.filter((b) => b.id !== lastBallId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function handlePointerDown(e) {
    if (phase !== 'idle') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStartY.current = e.clientY;
    setHandleAngle(0);
  }

  function handlePointerMove(e) {
    if (!dragging.current) return;
    e.preventDefault();
    const delta = e.clientY - dragStartY.current;
    const angle = Math.min(180, Math.max(0, delta * 1.5));
    setHandleAngle(angle);

    if (angle >= 160) {
      dragging.current = false;
      startDispense();
    }
  }

  function handlePointerUp() {
    if (dragging.current) {
      dragging.current = false;
      if (handleAngle < 160) {
        setHandleAngle(0);
      }
    }
  }

  function startDispense() {
    setPhase('cranking');
    setHandleAngle(180);

    setTimeout(() => {
      setPhase('mixing');
    }, 400);

    setTimeout(() => {
      const ball = pickBall();
      setDispensedBall(ball);
      setLastBallId(ball.id);
      setPhase('dispensed');
      playPop();
      speak(`짠! ${ball.tts}`);
      // Sparkles
      const sp = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 70 + (Math.random() - 0.5) * 20,
        emoji: ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)],
      }));
      setSparkles(sp);
      setTimeout(() => setSparkles([]), 1500);
    }, 1200);
  }

  function handleBallClick() {
    if (!dispensedBall) return;
    onNavigate(dispensedBall.id);
  }

  function reset() {
    setPhase('idle');
    setDispensedBall(null);
    setHandleAngle(0);
    setSparkles([]);
  }

  // Internal ball animation positions
  const [ballPositions, setBallPositions] = useState(() =>
    BALLS.map((b, i) => ({ ...b, cx: 30 + (i % 2) * 40, cy: 30 + Math.floor(i / 2) * 25 }))
  );

  useEffect(() => {
    if (phase !== 'mixing') return;
    const iv = setInterval(() => {
      setBallPositions((prev) =>
        prev.map((b) => ({
          ...b,
          cx: 20 + Math.random() * 60,
          cy: 20 + Math.random() * 40,
        }))
      );
    }, 150);
    return () => clearInterval(iv);
  }, [phase]);

  const machineW = 'min(50vw, 50vh)';
  const machineH = 'min(65vw, 65vh)';

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#5D4E37' }}>
          {phase === 'idle' ? '돌려봐요! 🎰' : phase === 'mixing' ? '섞이는 중...' : phase === 'dispensed' ? '짠! 🎉' : ''}
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Machine */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, position: 'relative' }}>
        <svg viewBox="0 0 200 280" style={{ width: machineW, height: machineH, maxHeight: '75vh' }}>
          {/* Machine body */}
          <rect x="30" y="20" width="140" height="240" rx="20" fill="#FFE0EC" stroke="#E8A0B8" strokeWidth="3" />
          {/* Top decoration */}
          <rect x="50" y="10" width="100" height="20" rx="10" fill="#FF9EB5" />
          <text x="100" y="24" textAnchor="middle" fontSize="11" fill="#FFF" fontWeight="bold">GACHA</text>
          {/* Stars decoration */}
          <text x="42" y="35" fontSize="12">⭐</text>
          <text x="150" y="35" fontSize="12">⭐</text>
          <text x="38" y="130" fontSize="10">💖</text>
          <text x="158" y="130" fontSize="10">💖</text>

          {/* Glass dome */}
          <ellipse cx="100" cy="100" rx="55" ry="55" fill="#E3F2FD" fillOpacity="0.4" stroke="#90CAF9" strokeWidth="2" />
          <ellipse cx="100" cy="100" rx="53" ry="53" fill="none" stroke="#BBDEFB" strokeWidth="1" strokeDasharray="4,4" />
          {/* Glass shine */}
          <ellipse cx="78" cy="78" rx="15" ry="8" fill="rgba(255,255,255,0.5)" transform="rotate(-30,78,78)" />

          {/* Balls inside dome */}
          {ballPositions.map((b, i) => (
            <g key={i}>
              <circle cx={b.cx + 50} cy={b.cy + 55} r="14"
                fill={b.color}
                style={{ transition: phase === 'mixing' ? 'cx 0.15s, cy 0.15s' : 'none' }}
              />
              <text x={b.cx + 50} y={b.cy + 60} textAnchor="middle" fontSize="14">{b.emoji}</text>
            </g>
          ))}

          {/* Chute / dispenser */}
          <rect x="80" y="160" width="40" height="30" rx="5" fill="#F8BBD0" stroke="#E8A0B8" strokeWidth="2" />
          <rect x="85" y="190" width="30" height="25" rx="8" fill="#FCE4EC" stroke="#E8A0B8" strokeWidth="1.5" />
          {/* Dispensed ball */}
          {phase === 'dispensed' && dispensedBall && (
            <g style={{ animation: 'ballDrop 0.5s ease-out forwards' }}>
              <circle cx="100" cy="225" r="18" fill={dispensedBall.color} stroke="#FFF" strokeWidth="2" />
              <text x="100" y="230" textAnchor="middle" fontSize="18">{dispensedBall.emoji}</text>
            </g>
          )}

          {/* Base / tray */}
          <rect x="55" y="240" width="90" height="15" rx="7" fill="#CE93D8" stroke="#AB47BC" strokeWidth="2" />

          {/* Handle */}
          <g transform={`rotate(${handleAngle}, 175, 100)`}
            style={{ cursor: 'pointer', transition: phase === 'cranking' ? 'transform 0.4s ease' : 'none' }}>
            <line x1="170" y1="100" x2="170" y2="60" stroke="#E57373" strokeWidth="5" strokeLinecap="round" />
            <circle cx="170" cy="55" r="12" fill="#EF5350" stroke="#C62828" strokeWidth="2" />
          </g>
          {/* Handle touch area (invisible, larger) */}
          <rect x="148" y="40" width="44" height="80" fill="transparent"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none', cursor: phase === 'idle' ? 'grab' : 'default' }}
          />
        </svg>

        {/* Sparkles */}
        {sparkles.map((s) => (
          <div key={s.id} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            fontSize: 'min(4vw, 30px)',
            animation: 'starBurst 1s ease-out forwards',
            pointerEvents: 'none',
          }}>{s.emoji}</div>
        ))}
      </div>

      {/* Dispensed ball button */}
      {phase === 'dispensed' && dispensedBall && (
        <button style={{
          padding: '2vh 4vw', borderRadius: 'min(3vw, 24px)', border: 'none',
          backgroundColor: dispensedBall.color, fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold',
          color: '#3E3E3E', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '1.5vw',
          animation: 'scoreFloat 0.6s ease-out',
          marginBottom: '2vh', flexShrink: 0,
        }} onClick={handleBallClick}>
          <span style={{ fontSize: 'min(5vw, 40px)' }}>{dispensedBall.emoji}</span>
          {dispensedBall.label} 하러 가자!
        </button>
      )}

      {/* Reset after dispensed */}
      {phase === 'dispensed' && (
        <button style={{
          padding: '1vh 2vw', borderRadius: 16, border: '2px solid #D4C5B0',
          backgroundColor: '#FFF3E0', fontSize: 'min(2vw, 16px)', color: '#7A6B5D',
          cursor: 'pointer', flexShrink: 0, marginBottom: '1vh',
        }} onClick={reset}>다시 돌리기</button>
      )}

      {/* Hint for idle */}
      {phase === 'idle' && (
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D', marginBottom: '2vh', flexShrink: 0, textAlign: 'center' }}>
          ↓ 손잡이를 아래로 끌어당겨요!
        </div>
      )}

      <style>{`
        @keyframes ballDrop {
          0% { transform: translateY(-30px) scale(0.5); opacity: 0; }
          60% { transform: translateY(5px) scale(1.2); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes starBurst {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.8) translateY(-30px); }
        }
        @keyframes scoreFloat {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { opacity: 1; transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
