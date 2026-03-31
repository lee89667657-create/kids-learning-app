import { useState, useRef, useEffect, useCallback } from 'react';
import { categories, getWordsByCategory, getAllWords } from '../data/words';
import { getCustomImage, addScore, recordWordAttempt } from '../utils/storage';
import { speak } from '../utils/tts';

function pickChoices(answer, pool, count) {
  const others = pool.filter((w) => w.word !== answer.word).sort(() => Math.random() - 0.5).slice(0, count - 1);
  return [...others, answer].sort(() => Math.random() - 0.5);
}

// Load MediaPipe scripts dynamically from CDN
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initMediaPipe(videoEl, onResults) {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);

    const camera = new window.Camera(videoEl, {
      onFrame: async () => { try { await hands.send({ image: videoEl }); } catch {} },
      width: 640,
      height: 480,
    });
    await camera.start();
    return { hands, camera };
  } catch {
    return null;
  }
}

export default function HandPointGame({ onBack }) {
  const videoRef = useRef(null);
  const mpRef = useRef(null); // { hands, camera }

  const [category, setCategory] = useState('가족');
  const [difficulty, setDifficulty] = useState(2);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [handPos, setHandPos] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const hoverStart = useRef(null);
  const hoverIdxRef = useRef(null);
  const animRef = useRef(null);
  const resultRef = useRef(null);

  const startRound = useCallback((cat, diff) => {
    const pool = getWordsByCategory(cat);
    if (pool.length < 2) return;
    const allPool = pool.length >= diff ? pool : getAllWords();
    const answer = pool[Math.floor(Math.random() * pool.length)];
    const ch = pickChoices(answer, allPool, diff);
    setCurrent(answer);
    setChoices(ch);
    setResult(null);
    resultRef.current = null;
    setHoverIdx(null);
    setHoverProgress(0);
    hoverStart.current = null;
    hoverIdxRef.current = null;
    setTimeout(() => speak(answer.sound), 500);
  }, []);

  useEffect(() => { startRound(category, difficulty); }, [category, difficulty, startRound]);

  // Init MediaPipe
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let mounted = true;

    initMediaPipe(video, (results) => {
      if (!mounted) return;
      if (results.multiHandLandmarks?.length > 0) {
        const lm = results.multiHandLandmarks[0][9];
        setHandPos({ x: 1 - lm.x, y: lm.y });
      } else {
        setHandPos(null);
      }
    }).then((mp) => {
      if (!mounted) return;
      if (mp) { mpRef.current = mp; setCameraReady(true); }
      else setCameraError(true);
    });

    return () => {
      mounted = false;
      if (mpRef.current) {
        mpRef.current.camera.stop();
        mpRef.current.hands.close();
      }
    };
  }, []);

  // Hover detection loop
  useEffect(() => {
    function tick() {
      if (resultRef.current || cooldown) { animRef.current = requestAnimationFrame(tick); return; }

      if (handPos && choices.length > 0) {
        const slotWidth = 1 / choices.length;
        const idx = Math.min(choices.length - 1, Math.floor(handPos.x / slotWidth));

        if (idx !== hoverIdxRef.current) {
          hoverIdxRef.current = idx;
          hoverStart.current = Date.now();
          setHoverIdx(idx);
          setHoverProgress(0);
        } else if (hoverStart.current) {
          const progress = Math.min(1, (Date.now() - hoverStart.current) / 1000);
          setHoverProgress(progress);

          if (progress >= 1 && !resultRef.current) {
            const correct = choices[idx]?.word === current?.word;
            const res = { idx, correct };
            setResult(res);
            resultRef.current = res;
            setTotal((t) => t + 1);
            setCooldown(true);

            if (correct) {
              setScore((s) => s + 1);
              addScore('child1', 'handPoint', 1);
              recordWordAttempt('child1', current.word, true);
              speak(current.word);
              setTimeout(() => { setCooldown(false); startRound(category, difficulty); }, 2000);
            } else {
              recordWordAttempt('child1', current.word, false);
              setTimeout(() => {
                setCooldown(false); setResult(null); resultRef.current = null;
                setHoverIdx(null); setHoverProgress(0);
                hoverStart.current = null; hoverIdxRef.current = null;
                speak(current.sound);
              }, 2000);
            }
          }
        }
      } else {
        if (hoverIdxRef.current !== null) {
          hoverIdxRef.current = null; hoverStart.current = null;
          setHoverIdx(null); setHoverProgress(0);
        }
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [handPos, choices, current, category, difficulty, cooldown, startRound]);

  // Touch fallback
  function handleTouchSelect(idx) {
    if (result || cooldown) return;
    const correct = choices[idx]?.word === current?.word;
    const res = { idx, correct };
    setResult(res); resultRef.current = res;
    setTotal((t) => t + 1); setCooldown(true);

    if (correct) {
      setScore((s) => s + 1);
      addScore('child1', 'handPoint', 1);
      speak(current.word);
      setTimeout(() => { setCooldown(false); startRound(category, difficulty); }, 1800);
    } else {
      setTimeout(() => {
        setCooldown(false); setResult(null); resultRef.current = null;
        speak(current.sound);
      }, 1500);
    }
  }

  function cardBorder(idx) {
    if (result?.idx === idx && result.correct) return '6px solid #A5D6A7';
    if (result?.idx === idx && !result.correct) return '6px solid #FFCDD2';
    if (!result && hoverIdx === idx && hoverProgress > 0) return `6px solid rgba(100,181,246,${0.4 + hoverProgress * 0.6})`;
    if (result && !result.correct && choices[idx]?.word === current?.word) return '4px solid #FFE082';
    return '4px solid transparent';
  }

  function cardBg(idx) {
    if (result?.idx === idx && result.correct) return '#E8F5E9';
    return '#FFFFFF';
  }

  function cardAnim(idx) {
    if (result?.idx === idx && !result.correct) return 'shake 0.4s ease-in-out';
    return 'none';
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0', overflow: 'hidden', position: 'relative',
    }}>
      {/* Hidden video */}
      <video ref={videoRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} playsInline muted />

      {/* UI */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '2vh 3vw' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1vh', flexShrink: 0 }}>
          <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }}
            onClick={() => { if (mpRef.current) mpRef.current.camera.stop(); onBack(); }}>← 뒤로</button>
          <div style={{ fontSize: 'min(2.5vw, 22px)', color: '#7A6B5D' }}>
            {cameraReady ? '✋ 손으로 맞추기' : cameraError ? '📱 터치 모드' : '준비 중...'} | {score}/{total}
          </div>
          <div style={{ width: '8vw' }} />
        </div>

        {/* Category + difficulty */}
        <div style={{ display: 'flex', gap: 'min(0.8vw, 6px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1vh', flexShrink: 0 }}>
          {categories.map((cat) => (
            <button key={cat} style={{
              padding: '0.5vh 1.2vw', borderRadius: 14, fontSize: 'min(1.8vw, 16px)', fontWeight: 'bold', cursor: 'pointer',
              border: '2px solid ' + (category === cat ? '#FFA726' : '#D4C5B0'),
              backgroundColor: category === cat ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37',
            }} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
          <span style={{ margin: '0 0.3vw', color: '#D4C5B0' }}>|</span>
          {[2, 3, 4].map((d) => (
            <button key={d} style={{
              padding: '0.5vh 1vw', borderRadius: 14, fontSize: 'min(1.8vw, 16px)', fontWeight: 'bold', cursor: 'pointer',
              border: '2px solid ' + (difficulty === d ? '#FFA726' : '#D4C5B0'),
              backgroundColor: difficulty === d ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37',
            }} onClick={() => setDifficulty(d)}>{d}개</button>
          ))}
        </div>

        {/* Question + speaker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2vw', marginBottom: '1.5vh', flexShrink: 0 }}>
          <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#5D4E37' }}>
            {current ? `"${current.word}" 를 찾아봐!` : ''}
          </div>
          <button style={{
            width: 'min(6vw, 48px)', height: 'min(6vw, 48px)', borderRadius: '50%',
            border: 'none', backgroundColor: '#BBDEFB', fontSize: 'min(3vw, 28px)', cursor: 'pointer',
          }} onClick={() => current && speak(current.sound)}>🔊</button>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'min(3vw, 24px)', minHeight: 0 }}>
          {choices.map((w, idx) => {
            const customImg = getCustomImage(w.word);
            return (
              <button key={w.word + idx} style={{
                width: `${Math.floor(80 / choices.length)}vw`, maxWidth: 'min(35vh, 300px)',
                height: 'min(45vh, 320px)', borderRadius: 'min(3vw, 28px)',
                border: cardBorder(idx), backgroundColor: cardBg(idx),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1vh',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'border 0.2s ease, background 0.2s ease',
                animation: cardAnim(idx), position: 'relative', overflow: 'hidden',
              }} onClick={() => (cameraError || !cameraReady) && handleTouchSelect(idx)}>
                {hoverIdx === idx && hoverProgress > 0 && !result && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: `${hoverProgress * 100}%`, height: 'min(1vh, 6px)',
                    backgroundColor: '#64B5F6', borderRadius: 3,
                  }} />
                )}
                {customImg ? (
                  <img src={customImg} alt={w.word} style={{ width: '55%', height: '50%', objectFit: 'contain', borderRadius: 16 }} />
                ) : (
                  <span style={{ fontSize: 'min(10vw, 80px)' }}>{w.emoji}</span>
                )}
                <span style={{ fontSize: 'min(3vw, 26px)', fontWeight: 'bold', color: '#5D4E37' }}>{w.word}</span>
              </button>
            );
          })}
        </div>

        {/* Hand cursor */}
        {handPos && cameraReady && (
          <div style={{
            position: 'fixed', left: `${handPos.x * 100}vw`, top: `${handPos.y * 100}vh`,
            width: 'min(5vw, 40px)', height: 'min(5vw, 40px)',
            borderRadius: '50%', border: '3px solid #64B5F6', backgroundColor: 'rgba(100,181,246,0.25)',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10,
            transition: 'left 0.05s linear, top 0.05s linear',
          }} />
        )}

        {/* Celebration */}
        {result?.correct && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 'min(8vw, 60px)', zIndex: 20, pointerEvents: 'none',
            animation: 'starPop 0.8s ease-out forwards',
          }}>⭐⭐⭐</div>
        )}
      </div>
    </div>
  );
}
