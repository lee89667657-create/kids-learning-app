import { useState, useEffect, useRef } from 'react';

const EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🌈', '🎈', '🎀', '💖', '🏆', '👏'];
const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C084FC', '#FFA726', '#26C6DA'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

// Generate confetti particles
function makeConfetti(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(0, 100),
    y: randomBetween(-20, -5),
    size: randomBetween(6, 14),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: randomBetween(0, 1.5),
    duration: randomBetween(1.5, 3),
    wobble: randomBetween(-30, 30),
  }));
}

function makeStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: randomBetween(5, 95),
    y: randomBetween(10, 90),
    size: randomBetween(20, 50),
    delay: randomBetween(0, 1),
    duration: randomBetween(0.6, 1.5),
  }));
}

/**
 * CelebrationOverlay
 * mode: 'big' (정답) | 'mega' (완료) | null (숨김)
 * onDone: 애니메이션 끝나면 호출
 * score: +10 표시용
 */
export default function CelebrationOverlay({ mode, onDone, score }) {
  const [confetti, setConfetti] = useState([]);
  const [stars, setStars] = useState([]);
  const [showRainbow, setShowRainbow] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!mode) {
      setConfetti([]);
      setStars([]);
      setShowRainbow(false);
      setShowScore(false);
      setShowTrophy(false);
      return;
    }

    if (mode === 'big') {
      setConfetti(makeConfetti(200));
      setStars(makeStars(60));
      setShowRainbow(true);
      setShowScore(true);
      setTimeout(() => setShowRainbow(false), 500);
      timer.current = setTimeout(() => {
        setConfetti([]);
        setStars([]);
        setShowScore(false);
        onDone?.();
      }, 2200);
    }

    if (mode === 'mega') {
      setConfetti(makeConfetti(300));
      setStars(makeStars(100));
      setShowRainbow(true);
      setShowTrophy(true);
      setTimeout(() => setShowRainbow(false), 800);
      timer.current = setTimeout(() => {
        setConfetti([]);
        setStars([]);
        setShowTrophy(false);
        onDone?.();
      }, 3500);
    }

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [mode, onDone]);

  if (!mode) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 500, overflow: 'hidden',
    }}>
      {/* Rainbow flash */}
      {showRainbow && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,217,61,0.15), rgba(107,203,119,0.15), rgba(77,150,255,0.15), rgba(192,132,252,0.15))',
          animation: 'rainbowFlash 0.5s ease-out',
        }} />
      )}

      {/* Confetti */}
      {confetti.map((c) => (
        <div key={c.id} style={{
          position: 'absolute',
          left: `${c.x}%`,
          top: `${c.y}%`,
          width: c.size,
          height: c.size * 0.6,
          backgroundColor: c.color,
          borderRadius: 2,
          animation: `confettiFall ${c.duration}s ${c.delay}s ease-in forwards`,
          transform: `rotate(${c.wobble}deg)`,
          opacity: 0.9,
        }} />
      ))}

      {/* Stars / emojis popping */}
      {stars.map((s) => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          fontSize: s.size,
          animation: `starBurst ${s.duration}s ${s.delay}s ease-out forwards`,
          opacity: 0,
        }}>{s.emoji}</div>
      ))}

      {/* Score popup */}
      {showScore && score != null && (
        <div style={{
          position: 'absolute',
          top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'min(8vw, 60px)',
          fontWeight: 'bold',
          color: '#FFA726',
          textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          animation: 'scoreFloat 1.5s ease-out forwards',
        }}>⭐ +10</div>
      )}

      {/* Trophy (mega only) */}
      {showTrophy && (
        <div style={{
          position: 'absolute',
          top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'min(15vw, 120px)',
          animation: 'trophySpin 3s ease-in-out',
        }}>🏆</div>
      )}

      {/* Mega text */}
      {mode === 'mega' && showTrophy && (
        <div style={{
          position: 'absolute',
          top: '58%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'min(5vw, 40px)',
          fontWeight: 'bold',
          color: '#5D4E37',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(255,255,255,0.8)',
          animation: 'scoreFloat 2s 0.5s ease-out forwards',
          opacity: 0,
        }}>준우 완전 최고야!!! 🎉🎊🌟</div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
        @keyframes starBurst {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.8) translateY(-40px); }
        }
        @keyframes scoreFloat {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          70% { opacity: 1; transform: translate(-50%, -60%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
        }
        @keyframes trophySpin {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          20% { transform: translate(-50%, -50%) scale(1.3) rotate(15deg); }
          40% { transform: translate(-50%, -50%) scale(1) rotate(-10deg); }
          60% { transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
          80% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.5; }
        }
        @keyframes rainbowFlash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
