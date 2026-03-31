import { useState, useRef, useEffect, useCallback } from 'react';
import { addScore } from '../utils/storage';
import { speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { playFanfare, playMegaFanfare } from './utils/celebration';
import { startBGM, stopBGM } from './utils/bgm';
import MuteButton from './utils/MuteButton';

const STORIES = [
  { baby: '🐣', mom: '🐔', title: '아기 병아리가 엄마 닭을 찾아요!', bgColor: '#E8F5E9', lineColor: '#FBC02D' },
  { baby: '🐥', mom: '🦆', title: '아기 오리가 엄마 오리를 찾아요!', bgColor: '#E3F2FD', lineColor: '#42A5F5' },
  { baby: '🐻', mom: '🐼', title: '아기 곰이 엄마 곰을 찾아요!', bgColor: '#F1F8E9', lineColor: '#8D6E63' },
  { baby: '🐰', mom: '🐇', title: '아기 토끼가 엄마 토끼를 찾아요!', bgColor: '#FCE4EC', lineColor: '#EC407A' },
  { baby: '🦊', mom: '🦊', title: '아기 여우가 엄마 여우를 찾아요!', bgColor: '#FFF3E0', lineColor: '#FF9800' },
];

const LEVELS = [
  { name: '레벨 1', points: [{ x: 10, y: 50 }, { x: 90, y: 50 }], width: 16 },
  { name: '레벨 2', points: [{ x: 10, y: 30 }, { x: 50, y: 30 }, { x: 50, y: 70 }, { x: 90, y: 70 }], width: 14 },
  { name: '레벨 3', points: [{ x: 10, y: 20 }, { x: 35, y: 20 }, { x: 35, y: 50 }, { x: 65, y: 50 }, { x: 65, y: 80 }, { x: 90, y: 80 }], width: 13 },
  { name: '레벨 4', points: [{ x: 10, y: 50 }, { x: 25, y: 20 }, { x: 45, y: 80 }, { x: 65, y: 20 }, { x: 90, y: 50 }], width: 12 },
  { name: '레벨 5', points: [{ x: 10, y: 15 }, { x: 35, y: 15 }, { x: 35, y: 45 }, { x: 20, y: 45 }, { x: 20, y: 75 }, { x: 60, y: 75 }, { x: 60, y: 35 }, { x: 90, y: 35 }], width: 11 },
];

const CANVAS_W = 800;
const CANVAS_H = 500;

function dist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function pickStory(excludeIdx) {
  const pool = STORIES.filter((_, i) => i !== excludeIdx);
  const s = pool[Math.floor(Math.random() * pool.length)];
  return STORIES.indexOf(s);
}

export default function PathGame({ onBack }) {
  const canvasRef = useRef(null);
  const [level, setLevel] = useState(0);
  const [storyIdx, setStoryIdx] = useState(() => Math.floor(Math.random() * STORIES.length));
  const [arrived, setArrived] = useState(false);
  const [reunited, setReunited] = useState(false);
  const [celebMode, setCelebMode] = useState(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const story = STORIES[storyIdx];
  const lv = LEVELS[level];
  const startPt = lv.points[0];
  const endPt = lv.points[lv.points.length - 1];

  useEffect(() => { startBGM(); return () => stopBGM(); }, []);
  useEffect(() => { speak(story.title); }, [story.title]);

  const scaleX = CANVAS_W / 100;
  const scaleY = CANVAS_H / 100;

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Wide path guide
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = lv.width * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    lv.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x * scaleX, pt.y * scaleY);
      else ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
    });
    ctx.stroke();

    // Dashed center line
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    lv.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x * scaleX, pt.y * scaleY);
      else ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }, [level, lv, scaleX, scaleY]);

  useEffect(() => {
    drawGuide();
    setArrived(false);
    setReunited(false);
  }, [level, storyIdx, drawGuide]);

  // Use native event listeners for reliable touch on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
        y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
      };
    }

    function onDown(e) {
      if (arrived) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      lastPos.current = getPos(e);
    }

    function onMove(e) {
      if (!isDrawing.current) return;
      e.preventDefault();
      const pos = getPos(e);
      const ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = story.lineColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;

      // Check arrival
      const ex = endPt.x * scaleX;
      const ey = endPt.y * scaleY;
      if (dist(pos.x, pos.y, ex, ey) < 50) {
        isDrawing.current = false;
        setArrived(true);
        addScore('child2', 'path', 1);
        playFanfare();
        speak('엄마 찾았다!');
        setCelebMode('big');
        setTimeout(() => setReunited(true), 800);
      }
    }

    function onUp(e) {
      e.preventDefault();
      isDrawing.current = false;
      lastPos.current = null;
    }

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: false });
    canvas.addEventListener('pointercancel', onUp, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [arrived, story.lineColor, endPt, scaleX, scaleY]);

  function handleClear() {
    setArrived(false);
    setReunited(false);
    drawGuide();
  }

  function handleNext() {
    const nextLevel = level < LEVELS.length - 1 ? level + 1 : 0;
    setLevel(nextLevel);
    setStoryIdx(pickStory(storyIdx));
    setCelebMode(null);
  }

  // Positions for baby/mom emojis
  const babyLeft = `${startPt.x}%`;
  const babyTop = `${startPt.y}%`;
  const momLeft = `${endPt.x}%`;
  const momTop = `${endPt.y}%`;

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      backgroundColor: story.bgColor, overflow: 'hidden',
    }}>
      <CelebrationOverlay mode={celebMode} score={level + 1} onDone={() => setCelebMode(null)} />
      <MuteButton />

      {/* Header: 10vh */}
      <div style={{
        height: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 3vw', flexShrink: 0,
      }}>
        <button style={{
          fontSize: '3vw', background: 'none', border: 'none',
          cursor: 'pointer', padding: '2vw', borderRadius: '2vw', color: '#5D4E37',
        }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: '3.5vw', fontWeight: 'bold', color: '#5D4E37', textAlign: 'center' }}>
          {story.title}
        </div>
        <div style={{ fontSize: '2.5vw', color: '#7A6B5D', fontWeight: 'bold' }}>{lv.name}</div>
      </div>

      {/* Canvas area: 75vh */}
      <div style={{
        flex: 1, position: 'relative', margin: '0 3vw',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 0,
      }}>
        <div style={{ position: 'relative', width: '94vw', height: '70vh', maxHeight: '70vh' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{
              width: '100%', height: '100%',
              borderRadius: '2vw',
              border: '3px solid rgba(0,0,0,0.1)',
              backgroundColor: 'rgba(255,255,255,0.6)',
              touchAction: 'none',
              cursor: 'crosshair',
            }}
          />

          {/* Baby emoji */}
          <div style={{
            position: 'absolute', left: babyLeft, top: babyTop,
            transform: 'translate(-50%, -50%)',
            fontSize: '8vw', lineHeight: 1, pointerEvents: 'none',
            transition: reunited ? 'left 1s ease, top 1s ease' : 'none',
            ...(reunited ? { left: momLeft, top: momTop } : {}),
          }}>{story.baby}</div>

          {/* Mom emoji */}
          <div style={{
            position: 'absolute', left: momLeft, top: momTop,
            transform: 'translate(-50%, -50%)',
            fontSize: '8vw', lineHeight: 1, pointerEvents: 'none',
            animation: !arrived ? 'momGlow 2s ease-in-out infinite' : 'none',
          }}>{story.mom}</div>

          {/* Reunion emoji */}
          {reunited && (
            <div style={{
              position: 'absolute', left: momLeft, top: momTop,
              transform: 'translate(-50%, -120%)',
              fontSize: '6vw', lineHeight: 1, pointerEvents: 'none',
              animation: 'snapIn 0.5s ease-out',
            }}>🤗</div>
          )}
        </div>
      </div>

      {/* Buttons: 15vh */}
      <div style={{
        height: '15vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '3vw', flexShrink: 0,
      }}>
        <button style={{
          padding: '2vh 5vw', fontSize: '3vw', fontWeight: 'bold',
          borderRadius: '2vw', border: 'none', cursor: 'pointer',
          backgroundColor: '#FFCDD2', color: '#C62828',
        }} onClick={handleClear}>지우기</button>
        {arrived && (
          <button style={{
            padding: '2vh 5vw', fontSize: '3vw', fontWeight: 'bold',
            borderRadius: '2vw', border: 'none', cursor: 'pointer',
            backgroundColor: '#B5D8F7', color: '#1565C0',
            animation: 'snapIn 0.4s ease-out',
          }} onClick={handleNext}>다음 →</button>
        )}
      </div>

      <style>{`
        @keyframes momGlow {
          0%, 100% { filter: drop-shadow(0 0 0 transparent); transform: translate(-50%, -50%) scale(1); }
          50% { filter: drop-shadow(0 0 10px rgba(255,200,0,0.6)); transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes snapIn {
          0% { transform: translate(-50%, -120%) scale(0); opacity: 0; }
          60% { transform: translate(-50%, -120%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -120%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
