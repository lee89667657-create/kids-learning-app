import { useState, useEffect } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, speakComplete, playFanfare, playMegaFanfare } from './utils/celebration';
import useDragDrop from '../hooks/useDragDrop';

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

  const { makeDragProps, makeDropProps, dragging, ghostStyle, containerProps, nearZone } = useDragDrop({
    onDrop: (itemName, zoneId) => {
      if (complete || packed.includes(itemName) || wrongItem) return 'ignore';
      const item = ITEMS.find((i) => i.name === itemName);
      if (!item) return 'ignore';

      if (item.needed) {
        const newPacked = [...packed, item.name];
        setPacked(newPacked);
        addScore('child2', 'bag', 1);
        playFanfare(); speakPraise();
        setCelebMode('big');
        setTimeout(() => setCelebMode(null), 2200);

        if (newPacked.length === neededCount) {
          setComplete(true); setFeedback('준비 완료!');
          setTimeout(() => { setCelebMode('mega'); playMegaFanfare(); speakComplete(); }, 2300);
          setTimeout(() => setCelebMode(null), 5500);
        }
        return 'correct';
      } else {
        setWrongItem(item.name);
        setFeedback(`${item.name}은 학교에 안 가져가요~`);
        speakWrong();
        setTimeout(() => { setWrongItem(null); setFeedback(''); }, 1500);
        return 'wrong';
      }
    },
  });

  useEffect(() => {
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 400);
  }, []);

  function handleReset() {
    setPacked([]); setWrongItem(null); setComplete(false); setFeedback('');
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 300);
  }

  const bagDrop = makeDropProps('bag');
  const isOverBag = nearZone === 'bag';

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }} {...containerProps}>
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
        <div ref={bagDrop.ref} style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isOverBag ? '#EDE7F6' : '#F3E5F5',
          borderRadius: 'min(3vw, 24px)',
          border: isOverBag ? '4px dashed #AB47BC' : complete ? '4px solid #A5D6A7' : '4px dashed #CE93D8',
          boxShadow: isOverBag ? '0 0 30px rgba(171,71,188,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
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
          {shuffledItems.map((item) => {
            const isPacked = packed.includes(item.name);
            const isWrong = wrongItem === item.name;
            const isDragged = dragging === item.name;
            const dp = isPacked ? {} : makeDragProps(item.name);
            return (
              <div key={item.name} {...dp} style={{
                ...(dp.style || {}),
                width: 'min(18vw, 18vh)', height: 'min(18vw, 18vh)',
                borderRadius: 'min(2.5vw, 20px)',
                border: isPacked ? '3px solid #A5D6A7' : '3px solid transparent',
                backgroundColor: isPacked ? '#E8F5E9' : '#FFFFFF',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5vh',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                opacity: isPacked ? 0.4 : isDragged ? 0.3 : 1,
                animation: isWrong ? 'shake 0.4s ease-in-out' : 'none',
                zIndex: isDragged ? 100 : 1,
              }}>
                <span style={{ fontSize: 'min(6vw, 44px)', lineHeight: 1, pointerEvents: 'none' }}>{item.emoji}</span>
                <span style={{ fontSize: 'min(2vw, 16px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ghost */}
      {dragging && ghostStyle && (() => {
        const item = ITEMS.find((i) => i.name === dragging);
        return item ? <div style={{ ...ghostStyle, fontSize: 'min(10vw, 80px)', lineHeight: 1 }}>{item.emoji}</div> : null;
      })()}

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
