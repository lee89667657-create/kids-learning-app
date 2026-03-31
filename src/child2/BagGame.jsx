import { useState, useEffect, useRef } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, speakComplete, playFanfare, playMegaFanfare } from './utils/celebration';

const ITEMS = [
  { name: '책', emoji: '📖', needed: true },
  { name: '연필', emoji: '✏️', needed: true },
  { name: '지우개', emoji: '🧽', needed: true },
  { name: '물통', emoji: '🥤', needed: true },
  { name: '실내화', emoji: '👟', needed: true },
  { name: '장난감', emoji: '🧸', needed: false },
  { name: '과자', emoji: '🍪', needed: false },
  { name: '베개', emoji: '🛏️', needed: false },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const neededItems = ITEMS.filter((i) => i.needed);
const neededCount = neededItems.length;

export default function BagGame({ onBack }) {
  const [shuffledItems] = useState(() => shuffle(ITEMS));
  const [packed, setPacked] = useState([]);
  const [wrongItem, setWrongItem] = useState(null);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [celebMode, setCelebMode] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [overBag, setOverBag] = useState(false);
  const cardOrigins = useRef({});
  const bagRef = useRef(null);

  useEffect(() => {
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 400);
  }, []);

  function isOverBag(x, y) {
    if (!bagRef.current) return false;
    const r = bagRef.current.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function handlePointerDown(e, item) {
    if (complete || packed.includes(item.name) || wrongItem) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    cardOrigins.current[item.name] = { x: r.left, y: r.top };
    setDragging(item.name); setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e) {
    if (!dragging) return; e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    setOverBag(isOverBag(e.clientX, e.clientY));
  }

  function handlePointerUp(e) {
    if (!dragging) return; e.preventDefault();
    const item = ITEMS.find((i) => i.name === dragging);
    const over = isOverBag(e.clientX, e.clientY);

    if (over && item) {
      if (item.needed) {
        const newPacked = [...packed, item.name];
        setPacked(newPacked);
        addScore('child2', 'bag', 1);
        playFanfare(); speakPraise();
        setCelebMode('big');
        setTimeout(() => setCelebMode(null), 2200);

        if (newPacked.length === neededCount) {
          setComplete(true);
          setFeedback('준비 완료!');
          setTimeout(() => { setCelebMode('mega'); playMegaFanfare(); speakComplete(); }, 2300);
          setTimeout(() => setCelebMode(null), 5500);
        }
      } else {
        setWrongItem(item.name);
        setFeedback(`${item.name}은 학교에 안 가져가요~`);
        speakWrong();
        setTimeout(() => { setWrongItem(null); setFeedback(''); }, 1500);
      }
    }

    setDragging(null); setOverBag(false);
  }

  function handleReset() {
    setPacked([]); setWrongItem(null); setComplete(false); setFeedback('');
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 300);
  }

  function cardStyle(item) {
    const isPacked = packed.includes(item.name);
    const isWrong = wrongItem === item.name;
    const s = {
      width: 'min(18vw, 18vh)', height: 'min(18vw, 18vh)',
      borderRadius: 'min(2.5vw, 20px)',
      border: isPacked ? '3px solid #A5D6A7' : '3px solid transparent',
      backgroundColor: isPacked ? '#E8F5E9' : '#FFFFFF',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5vh',
      cursor: isPacked ? 'default' : 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      opacity: isPacked ? 0.4 : 1,
      transition: dragging === item.name ? 'none' : 'all 0.3s ease',
      animation: isWrong ? 'shake 0.4s ease-in-out' : 'none',
      position: 'relative',
      zIndex: dragging === item.name ? 100 : 1,
    };
    if (dragging === item.name) {
      const o = cardOrigins.current[item.name];
      if (o) {
        s.transform = `translate(${dragPos.x - o.x - 45}px, ${dragPos.y - o.y - 45}px) scale(1.1)`;
        s.boxShadow = '0 10px 28px rgba(0,0,0,0.2)';
        s.cursor = 'grabbing';
      }
    }
    return s;
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <CelebrationOverlay mode={celebMode} score={packed.length} onDone={() => setCelebMode(null)} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(3vw, 28px)', fontWeight: 'bold', color: '#5D4E37' }}>🎒 가방 채우기</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Instruction */}
      <div style={{ fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1vh', flexShrink: 0, textAlign: 'center' }}>
        {complete ? '준비 완료! 🎉' : '필요한 것을 가방에 끌어다 놓아요!'}
      </div>

      {/* Main: 2-column */}
      <div style={{ flex: 1, display: 'flex', gap: '2vw', minHeight: 0 }}>
        {/* Left: Bag (drop zone) */}
        <div ref={bagRef} style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: overBag ? '#EDE7F6' : '#F3E5F5',
          borderRadius: 'min(3vw, 24px)',
          border: overBag ? '4px dashed #AB47BC' : complete ? '4px solid #A5D6A7' : '4px dashed #CE93D8',
          boxShadow: overBag ? '0 0 30px rgba(171,71,188,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          gap: '2vh',
          padding: '2vh',
        }}>
          {/* Bag emoji */}
          <div style={{ fontSize: 'min(18vw, 18vh)' }}>🎒</div>

          {/* Hint slots */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'min(1.5vw, 12px)', width: '80%', maxWidth: 'min(40vw, 300px)',
          }}>
            {neededItems.map((item) => {
              const isPacked = packed.includes(item.name);
              return (
                <div key={item.name} style={{
                  aspectRatio: '1',
                  borderRadius: 'min(1.5vw, 12px)',
                  border: isPacked ? '3px solid #A5D6A7' : '3px dashed #D4C5B0',
                  backgroundColor: isPacked ? '#E8F5E9' : 'rgba(255,255,255,0.3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    fontSize: 'min(5vw, 40px)', lineHeight: 1,
                    filter: isPacked ? 'none' : 'brightness(0)',
                    opacity: isPacked ? 1 : 0.15,
                    transition: 'all 0.3s ease',
                  }}>{item.emoji}</span>
                  <span style={{
                    fontSize: 'min(1.5vw, 12px)', color: isPacked ? '#4CAF50' : '#B0A090',
                    fontWeight: 'bold', marginTop: '0.3vh',
                  }}>{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Count */}
          <div style={{ fontSize: 'min(2.5vw, 20px)', color: '#7A6B5D', fontWeight: 'bold' }}>
            {packed.length} / {neededCount}
          </div>
        </div>

        {/* Right: Item cards */}
        <div style={{
          width: '45%', display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: 'min(1.2vw, 10px)',
          alignContent: 'center',
        }}>
          {shuffledItems.map((item) => (
            <div key={item.name} style={cardStyle(item)}
              onPointerDown={(e) => handlePointerDown(e, item)}>
              <span style={{ fontSize: 'min(6vw, 44px)', lineHeight: 1, pointerEvents: 'none' }}>{item.emoji}</span>
              <span style={{ fontSize: 'min(2vw, 16px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback / Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3vw', marginTop: '1vh', flexShrink: 0, minHeight: 'min(5vh, 40px)' }}>
        {feedback && (
          <div style={{ fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', color: complete ? '#4CAF50' : '#E65100' }}>{feedback}</div>
        )}
        {complete && (
          <button style={{ padding: '1vh 3vw', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: '#B5D8F7', color: '#1565C0' }} onClick={handleReset}>다시 하기</button>
        )}
      </div>
    </div>
  );
}
