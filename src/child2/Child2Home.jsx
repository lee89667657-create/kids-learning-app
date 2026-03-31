import { useState, useRef, useEffect, useCallback } from 'react';
import { speakCute as speak } from '../utils/tts';

const BALLS = [
  { id: 'compare', emoji: '📏', label: '비교 게임', color: '#FFD54F', tts: '비교 게임이 나왔어요!' },
  { id: 'shadow', emoji: '🐾', label: '그림자 맞추기', color: '#A5D6A7', tts: '그림자 맞추기가 나왔어요!' },
  { id: 'path', emoji: '〰️', label: '길 이어주기', color: '#90CAF9', tts: '길 이어주기가 나왔어요!' },
  { id: 'pack', emoji: '🎒', label: '가방 채우기', color: '#CE93D8', tts: '가방 채우기가 나왔어요!' },
];

// Handle pivot in SVG viewBox coordinates
const PIVOT = { x: 175, y: 100 };

function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [600, 800, 1000, 1200].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.05;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  } catch {}
}

function getAngle(cx, cy, ex, ey) {
  return Math.atan2(ey - cy, ex - cx) * (180 / Math.PI);
}

// Normalize angle difference for clockwise detection
function clockwiseDelta(prev, curr) {
  let d = curr - prev;
  // Normalize to -180..180
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  // Positive = clockwise in our coordinate system
  return d > 0 ? d : 0;
}

export default function Child2Home({ onNavigate, onBack }) {
  const [phase, setPhase] = useState('idle'); // idle | cranking | mixing | dispensed
  const [dispensedBall, setDispensedBall] = useState(null);
  const [lastBallId, setLastBallId] = useState(null);
  const [handleAngle, setHandleAngle] = useState(0);
  const [progress, setProgress] = useState(0); // 0~1 rotation progress
  const [sparkles, setSparkles] = useState([]);
  const [hintSpoken, setHintSpoken] = useState(false);

  const isDragging = useRef(false);
  const prevAngle = useRef(0);
  const accumulated = useRef(0);
  const svgRef = useRef(null);

  function pickBall() {
    const pool = BALLS.filter((b) => b.id !== lastBallId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Convert screen coords to SVG viewBox coords
  function screenToSVG(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = 200 / rect.width;
    const scaleY = 280 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(e) {
    if (phase !== 'idle') return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    isDragging.current = true;
    accumulated.current = 0;
    setHintSpoken(false);

    const pt = screenToSVG(e.clientX, e.clientY);
    prevAngle.current = getAngle(PIVOT.x, PIVOT.y, pt.x, pt.y);
  }

  function handlePointerMove(e) {
    if (!isDragging.current || phase !== 'idle') return;
    e.preventDefault();

    const pt = screenToSVG(e.clientX, e.clientY);
    const currAngle = getAngle(PIVOT.x, PIVOT.y, pt.x, pt.y);
    const delta = clockwiseDelta(prevAngle.current, currAngle);
    prevAngle.current = currAngle;

    accumulated.current += delta;
    const totalProgress = Math.min(1, accumulated.current / 360);
    setProgress(totalProgress);
    setHandleAngle(accumulated.current % 360);

    // Hint at 70%
    if (totalProgress > 0.7 && !hintSpoken) {
      speak('조금만 더!');
      setHintSpoken(true);
    }

    // Complete at 100%
    if (totalProgress >= 1) {
      isDragging.current = false;
      startDispense();
    }
  }

  function handlePointerUp(e) {
    if (!isDragging.current) return;
    e.preventDefault();
    isDragging.current = false;
    if (progress < 1) {
      // Spring back
      setHandleAngle(0);
      setProgress(0);
      accumulated.current = 0;
    }
  }

  const startDispense = useCallback(() => {
    setPhase('cranking');

    setTimeout(() => setPhase('mixing'), 400);

    setTimeout(() => {
      const ball = pickBall();
      setDispensedBall(ball);
      setLastBallId(ball.id);
      setPhase('dispensed');
      setHandleAngle(0);
      setProgress(0);
      accumulated.current = 0;
      playPop();
      speak(`짠! ${ball.tts}`);
      const sp = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 70 + (Math.random() - 0.5) * 20,
        emoji: ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)],
      }));
      setSparkles(sp);
      setTimeout(() => setSparkles([]), 1500);
    }, 1200);
  }, [lastBallId]);

  function handleBallClick() {
    if (!dispensedBall) return;
    onNavigate(dispensedBall.id);
  }

  function reset() {
    setPhase('idle');
    setDispensedBall(null);
    setHandleAngle(0);
    setProgress(0);
    accumulated.current = 0;
    setSparkles([]);
    setHintSpoken(false);
  }

  // Ball mixing animation
  const [ballPositions, setBallPositions] = useState(() =>
    BALLS.map((b, i) => ({ ...b, cx: 30 + (i % 2) * 40, cy: 30 + Math.floor(i / 2) * 25 }))
  );

  useEffect(() => {
    if (phase === 'mixing' || (phase === 'idle' && progress > 0)) {
      const iv = setInterval(() => {
        setBallPositions((prev) =>
          prev.map((b) => ({ ...b, cx: 20 + Math.random() * 60, cy: 20 + Math.random() * 40 }))
        );
      }, 150);
      return () => clearInterval(iv);
    }
  }, [phase, progress]);

  const machineW = 'min(50vw, 50vh)';
  const machineH = 'min(65vw, 65vh)';

  // Progress arc for circular indicator
  const arcRadius = 22;
  const arcProgress = progress * 360;
  const arcRad = (arcProgress * Math.PI) / 180;
  const arcX = PIVOT.x + arcRadius * Math.sin(arcRad);
  const arcY = PIVOT.y - arcRadius * Math.cos(arcRad);
  const largeArc = arcProgress > 180 ? 1 : 0;

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
        <svg ref={svgRef} viewBox="0 0 200 280" style={{ width: machineW, height: machineH, maxHeight: '75vh', touchAction: 'none' }}>
          {/* Machine body */}
          <rect x="30" y="20" width="140" height="240" rx="20" fill="#FFE0EC" stroke="#E8A0B8" strokeWidth="3" />
          <rect x="50" y="10" width="100" height="20" rx="10" fill="#FF9EB5" />
          <text x="100" y="24" textAnchor="middle" fontSize="11" fill="#FFF" fontWeight="bold">GACHA</text>
          <text x="42" y="35" fontSize="12">⭐</text>
          <text x="150" y="35" fontSize="12">⭐</text>
          <text x="38" y="130" fontSize="10">💖</text>
          <text x="158" y="130" fontSize="10">💖</text>

          {/* Glass dome */}
          <ellipse cx="100" cy="100" rx="55" ry="55" fill="#E3F2FD" fillOpacity="0.4" stroke="#90CAF9" strokeWidth="2" />
          <ellipse cx="100" cy="100" rx="53" ry="53" fill="none" stroke="#BBDEFB" strokeWidth="1" strokeDasharray="4,4" />
          <ellipse cx="78" cy="78" rx="15" ry="8" fill="rgba(255,255,255,0.5)" transform="rotate(-30,78,78)" />

          {/* Balls inside dome */}
          {ballPositions.map((b, i) => (
            <g key={i}>
              <circle cx={b.cx + 50} cy={b.cy + 55} r="14" fill={b.color}
                style={{ transition: (phase === 'mixing' || progress > 0) ? 'cx 0.15s, cy 0.15s' : 'none' }} />
              <text x={b.cx + 50} y={b.cy + 60} textAnchor="middle" fontSize="14">{b.emoji}</text>
            </g>
          ))}

          {/* Chute */}
          <rect x="80" y="160" width="40" height="30" rx="5" fill="#F8BBD0" stroke="#E8A0B8" strokeWidth="2" />
          <rect x="85" y="190" width="30" height="25" rx="8" fill="#FCE4EC" stroke="#E8A0B8" strokeWidth="1.5" />

          {/* Dispensed ball */}
          {phase === 'dispensed' && dispensedBall && (
            <g style={{ animation: 'ballDrop 0.5s ease-out forwards' }}>
              <circle cx="100" cy="225" r="18" fill={dispensedBall.color} stroke="#FFF" strokeWidth="2" />
              <text x="100" y="230" textAnchor="middle" fontSize="18">{dispensedBall.emoji}</text>
            </g>
          )}

          <rect x="55" y="240" width="90" height="15" rx="7" fill="#CE93D8" stroke="#AB47BC" strokeWidth="2" />

          {/* Circular progress ring */}
          {progress > 0 && progress < 1 && (
            <path
              d={`M ${PIVOT.x} ${PIVOT.y - arcRadius} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${arcX} ${arcY}`}
              fill="none" stroke="#FFA726" strokeWidth="3" strokeLinecap="round" opacity="0.8"
            />
          )}
          {/* Background ring */}
          {phase === 'idle' && (
            <circle cx={PIVOT.x} cy={PIVOT.y} r={arcRadius} fill="none" stroke="#F0E0D0" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
          )}

          {/* Handle (rotates around pivot) */}
          <g transform={`rotate(${handleAngle}, ${PIVOT.x}, ${PIVOT.y})`}
            style={{ transition: phase === 'cranking' ? 'transform 0.4s ease' : isDragging.current ? 'none' : 'transform 0.3s ease' }}>
            <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y - 35} stroke="#E57373" strokeWidth="5" strokeLinecap="round" />
            <circle cx={PIVOT.x} cy={PIVOT.y - 40} r="12" fill="#EF5350" stroke="#C62828" strokeWidth="2" />
          </g>

          {/* Handle touch area (larger, transparent) */}
          <circle cx={PIVOT.x} cy={PIVOT.y} r="50" fill="transparent"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: phase === 'idle' ? 'grab' : 'default' }}
          />
        </svg>

        {/* Sparkles */}
        {sparkles.map((s) => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            fontSize: 'min(4vw, 30px)', animation: 'starBurst 1s ease-out forwards', pointerEvents: 'none',
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
          animation: 'scoreFloat 0.6s ease-out', marginBottom: '2vh', flexShrink: 0,
        }} onClick={handleBallClick}>
          <span style={{ fontSize: 'min(5vw, 40px)' }}>{dispensedBall.emoji}</span>
          {dispensedBall.label} 하러 가자!
        </button>
      )}

      {phase === 'dispensed' && (
        <button style={{
          padding: '1vh 2vw', borderRadius: 16, border: '2px solid #D4C5B0',
          backgroundColor: '#FFF3E0', fontSize: 'min(2vw, 16px)', color: '#7A6B5D',
          cursor: 'pointer', flexShrink: 0, marginBottom: '1vh',
        }} onClick={reset}>다시 돌리기</button>
      )}

      {phase === 'idle' && (
        <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D', marginBottom: '2vh', flexShrink: 0, textAlign: 'center' }}>
          🔄 손잡이를 빙글빙글 돌려봐요!
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
