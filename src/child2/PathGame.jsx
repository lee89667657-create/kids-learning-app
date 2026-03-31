import { useState, useRef, useEffect, useCallback } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, playFanfare } from './utils/celebration';

// Levels: arrays of waypoints the path must follow
// Coordinates in 0-100 space
const LEVELS = [
  { name: '직선', points: [{ x: 15, y: 50 }, { x: 85, y: 50 }], width: 14 },
  { name: '한 번 꺾기', points: [{ x: 15, y: 25 }, { x: 50, y: 25 }, { x: 50, y: 75 }, { x: 85, y: 75 }], width: 13 },
  { name: '두 번 꺾기', points: [{ x: 15, y: 20 }, { x: 40, y: 20 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 60, y: 80 }, { x: 85, y: 80 }], width: 12 },
  { name: '구불구불', points: [{ x: 10, y: 50 }, { x: 25, y: 25 }, { x: 45, y: 75 }, { x: 65, y: 25 }, { x: 85, y: 50 }], width: 11 },
  { name: '미로', points: [{ x: 10, y: 15 }, { x: 40, y: 15 }, { x: 40, y: 45 }, { x: 20, y: 45 }, { x: 20, y: 75 }, { x: 60, y: 75 }, { x: 60, y: 35 }, { x: 85, y: 35 }], width: 10 },
];

const CANVAS_RES = 500;

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Check if point is near any segment of the path
function isNearPath(px, py, points, threshold, canvasSize) {
  const scale = canvasSize / 100;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x * scale, ay = points[i].y * scale;
    const bx = points[i + 1].x * scale, by = points[i + 1].y * scale;
    const lenSq = (bx - ax) ** 2 + (by - ay) ** 2;
    if (lenSq === 0) continue;
    let t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lenSq));
    const projX = ax + t * (bx - ax), projY = ay + t * (by - ay);
    const d = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    if (d < threshold * scale) return true;
  }
  return false;
}

export default function PathGame({ onBack }) {
  const canvasRef = useRef(null);
  const [level, setLevel] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [celebMode, setCelebMode] = useState(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const lv = LEVELS[level];
  const startPt = lv.points[0];
  const endPt = lv.points[lv.points.length - 1];

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_RES, CANVAS_RES);
    const scale = CANVAS_RES / 100;

    // Draw path guide (wide, light)
    ctx.save();
    ctx.strokeStyle = '#E8E0D4';
    ctx.lineWidth = lv.width * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    lv.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
      else ctx.lineTo(pt.x * scale, pt.y * scale);
    });
    ctx.stroke();

    // Dashed center line
    ctx.strokeStyle = '#D4C5B0';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    lv.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
      else ctx.lineTo(pt.x * scale, pt.y * scale);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Start circle (green)
    ctx.beginPath();
    ctx.arc(startPt.x * scale, startPt.y * scale, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#A5D6A7';
    ctx.fill();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.stroke();

    // End circle (orange)
    ctx.beginPath();
    ctx.arc(endPt.x * scale, endPt.y * scale, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE0B2';
    ctx.fill();
    ctx.strokeStyle = '#FFA726';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Star at end
    ctx.font = `${20}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', endPt.x * scale, endPt.y * scale);

    ctx.restore();
  }, [level, lv, startPt, endPt]);

  useEffect(() => {
    drawGuide();
    setArrived(false);
    setShowStar(false);
    setTimeout(() => speak('출발! 도착까지 선을 그어봐요'), 400);
  }, [level, drawGuide]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_RES / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_RES / rect.height),
    };
  }

  function handlePointerDown(e) {
    if (arrived) return;
    if ((e.width || 0) * (e.height || 0) > 2500) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = getPos(e);
  }

  function handlePointerMove(e) {
    if (!isDrawing.current || arrived) return;
    if ((e.width || 0) * (e.height || 0) > 2500) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');

    const onPath = isNearPath(pos.x, pos.y, lv.points, lv.width * 0.6, CANVAS_RES);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = onPath ? '#5D4E37' : '#FFCDD2';
    ctx.lineWidth = onPath ? 5 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = pos;

    // Check arrival
    const scale = CANVAS_RES / 100;
    const d = dist(pos, { x: endPt.x * scale, y: endPt.y * scale });
    if (d < 18) {
      setArrived(true);
      isDrawing.current = false;
      addScore('child2', 'path', 1);
      setShowStar(true);
      setCelebMode('big');
      playFanfare();
      speakPraise();
    }
  }

  function handlePointerUp(e) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function handleNext() {
    setLevel(level < LEVELS.length - 1 ? level + 1 : 0);
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      <CelebrationOverlay mode={celebMode} score={level + 1} onDone={() => setCelebMode(null)} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(3vw, 28px)', fontWeight: 'bold', color: '#5D4E37' }}>〰️ 길 이어주기</div>
        <div style={{ fontSize: 'min(2vw, 18px)', color: '#7A6B5D' }}>레벨 {level + 1}</div>
      </div>

      {/* Instruction */}
      <div style={{ fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh', flexShrink: 0, textAlign: 'center' }}>
        {arrived ? '도착했어요! 🌟' : `${lv.name} - 출발에서 별까지 그어봐요`}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, position: 'relative' }}>
        <canvas ref={canvasRef} width={CANVAS_RES} height={CANVAS_RES}
          style={{ width: 'min(55vh, 60vw)', height: 'min(55vh, 60vw)', borderRadius: 24, border: '3px solid #E0D5C7', backgroundColor: '#FFFEF9', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
        {showStar && (
          <div style={{ position: 'absolute', fontSize: 'min(8vw, 60px)', animation: 'starPop 0.8s ease-out forwards' }}>⭐</div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '2vw', marginTop: '1vh', flexShrink: 0 }}>
        <button style={{
          padding: '1.2vh 3vw', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold',
          borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: '#FFCDD2', color: '#C62828',
        }} onClick={drawGuide}>지우기</button>
        {arrived && (
          <button style={{
            padding: '1.2vh 3vw', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold',
            borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: '#B5D8F7', color: '#1565C0',
          }} onClick={handleNext}>다음 레벨 →</button>
        )}
      </div>
    </div>
  );
}
