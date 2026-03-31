import { useState, useRef, useCallback, useEffect } from 'react';

const COLORS = [
  { bg: '#BBDEFB', active: '#64B5F6', tone: 261.63 },
  { bg: '#C8E6C9', active: '#66BB6A', tone: 329.63 },
  { bg: '#FFE0B2', active: '#FFA726', tone: 392.0 },
  { bg: '#E1BEE7', active: '#AB47BC', tone: 523.25 },
];

function playTone(frequency, duration = 300) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch { /* AudioContext not available */ }
}

export default function SoundPattern({ onBack }) {
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [level, setLevel] = useState(1);
  const timeouts = useRef([]);

  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout);
  }, []);

  function clearTimeouts() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  function addTimeout(fn, ms) {
    timeouts.current.push(setTimeout(fn, ms));
  }

  const startRound = useCallback((lvl) => {
    clearTimeouts();
    const newSeq = lvl === 1
      ? [Math.floor(Math.random() * 4)]
      : [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSeq);
    setPlayerInput([]);
    setPhase('showing');
    newSeq.forEach((colorIdx, i) => {
      addTimeout(() => { setActiveIdx(colorIdx); playTone(COLORS[colorIdx].tone); }, i * 700 + 400);
      addTimeout(() => { setActiveIdx(null); }, i * 700 + 700);
    });
    addTimeout(() => { setPhase('input'); }, newSeq.length * 700 + 500);
  }, [sequence]);

  function handlePadClick(idx) {
    if (phase !== 'input') return;
    playTone(COLORS[idx].tone);
    setActiveIdx(idx);
    setTimeout(() => setActiveIdx(null), 200);
    const newInput = [...playerInput, idx];
    setPlayerInput(newInput);
    const step = newInput.length - 1;
    if (newInput[step] !== sequence[step]) {
      setPhase('idle');
      setSequence([]);
      return;
    }
    if (newInput.length === sequence.length) {
      setPhase('success');
      const nextLvl = level + 1;
      setLevel(nextLvl);
      addTimeout(() => { startRound(nextLvl); }, 1200);
    }
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
        marginBottom: '1.5vh',
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
        <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37' }}>🎵 소리패턴</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Info */}
      <div style={{
        fontSize: 'min(2.8vw, 24px)',
        color: '#7A6B5D',
        marginBottom: '2vh',
        flexShrink: 0,
      }}>
        {phase === 'idle' && '시작 버튼을 눌러봐!'}
        {phase === 'showing' && '잘 들어봐...'}
        {phase === 'input' && '따라해 봐!'}
        {phase === 'success' && `잘했어! 단계 ${level} 🌟`}
      </div>

      {/* Pads */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 'min(2.5vw, 20px)',
        width: 'min(70vh, 80vw)',
        maxHeight: '60vh',
        aspectRatio: '1',
        margin: '0 auto',
      }}>
        {COLORS.map((c, idx) => (
          <button key={idx} style={{
            borderRadius: 'min(3vw, 28px)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: activeIdx === idx ? c.active : c.bg,
            transform: activeIdx === idx ? 'scale(1.06)' : 'scale(1)',
            opacity: phase === 'showing' ? 0.9 : 1,
          }} onClick={() => handlePadClick(idx)} disabled={phase !== 'input'} />
        ))}
      </div>

      {/* Start button */}
      {phase === 'idle' && (
        <button style={{
          padding: '2vh 5vw',
          fontSize: 'min(3vw, 28px)',
          fontWeight: 'bold',
          borderRadius: 24,
          border: 'none',
          backgroundColor: '#C8E6C9',
          color: '#2E7D32',
          cursor: 'pointer',
          marginTop: '2vh',
          flexShrink: 0,
        }} onClick={() => { setLevel(1); startRound(1); }}>
          시작!
        </button>
      )}
    </div>
  );
}
