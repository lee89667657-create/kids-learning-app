import { useState, useEffect } from 'react';
import { addScore } from '../utils/storage';

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

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.75; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BagGame({ onBack }) {
  const [shuffledItems] = useState(() => shuffle(ITEMS));
  const [packed, setPacked] = useState([]);
  const [wrongItem, setWrongItem] = useState(null);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');

  const neededCount = ITEMS.filter((i) => i.needed).length;

  useEffect(() => {
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 400);
  }, []);

  function handleItemClick(item) {
    if (complete || packed.includes(item.name)) return;

    if (item.needed) {
      const newPacked = [...packed, item.name];
      setPacked(newPacked);
      speak(item.name);
      addScore('child2', 'bag', 1);

      if (newPacked.length === neededCount) {
        setComplete(true);
        setFeedback('준비 완료!');
        setTimeout(() => speak('준비 완료! 학교 갈 준비 됐어요!'), 500);
      }
    } else {
      setWrongItem(item.name);
      setFeedback(`${item.name}은 학교에 안 가져가요~`);
      speak(`${item.name}은 학교에 안 가져가요`);
      setTimeout(() => { setWrongItem(null); setFeedback(''); }, 1500);
    }
  }

  function handleReset() {
    setPacked([]);
    setWrongItem(null);
    setComplete(false);
    setFeedback('');
    setTimeout(() => speak('학교 갈 때 필요한 것만 가방에 넣어요!'), 300);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(3vw, 28px)', fontWeight: 'bold', color: '#5D4E37' }}>🎒 가방 채우기</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Instruction */}
      <div style={{ fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh', flexShrink: 0, textAlign: 'center' }}>
        {complete ? '준비 완료! 🎉' : '학교 갈 때 필요한 것만 골라요!'}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4vw', minHeight: 0 }}>
        {/* Bag */}
        <div style={{
          width: 'min(28vw, 28vh)', height: 'min(35vw, 35vh)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#F3E5F5', borderRadius: 'min(3vw, 24px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)', position: 'relative',
          border: complete ? '4px solid #A5D6A7' : '4px solid transparent',
          transition: 'border 0.3s ease',
        }}>
          <div style={{ fontSize: 'min(7vw, 56px)', marginBottom: '1vh' }}>🎒</div>
          {/* Hint slots: silhouettes for needed items */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'min(1vw, 8px)', justifyContent: 'center', maxWidth: '90%' }}>
            {ITEMS.filter((i) => i.needed).map((item) => {
              const isPacked = packed.includes(item.name);
              return (
                <div key={item.name} style={{
                  width: 'min(5vw, 44px)', height: 'min(5vw, 44px)',
                  borderRadius: 'min(1vw, 8px)',
                  border: isPacked ? '2px solid #A5D6A7' : '2px dashed #D4C5B0',
                  backgroundColor: isPacked ? '#E8F5E9' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    fontSize: 'min(3.5vw, 28px)',
                    lineHeight: 1,
                    filter: isPacked ? 'none' : 'brightness(0)',
                    opacity: isPacked ? 1 : 0.15,
                    transition: 'all 0.3s ease',
                  }}>{item.emoji}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 'min(1.8vw, 14px)', color: '#7A6B5D', marginTop: '0.5vh' }}>
            {packed.length} / {neededCount}
          </div>
        </div>

        {/* Items grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'min(1.5vw, 12px)',
        }}>
          {shuffledItems.map((item) => {
            const isPacked = packed.includes(item.name);
            const isWrong = wrongItem === item.name;

            return (
              <button key={item.name} style={{
                width: 'min(16vw, 16vh)', height: 'min(16vw, 16vh)',
                borderRadius: 'min(2.5vw, 20px)',
                border: isPacked ? '3px solid #A5D6A7' : '3px solid transparent',
                backgroundColor: isPacked ? '#E8F5E9' : '#FFFFFF',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5vh',
                cursor: isPacked ? 'default' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                opacity: isPacked ? 0.5 : 1,
                transition: 'all 0.3s ease',
                animation: isWrong ? 'shake 0.4s ease-in-out' : 'none',
              }} onClick={() => handleItemClick(item)} disabled={isPacked}>
                <span style={{ fontSize: 'min(5vw, 40px)' }}>{item.emoji}</span>
                <span style={{ fontSize: 'min(1.8vw, 16px)', fontWeight: 'bold', color: '#5D4E37' }}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback / Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3vw', marginTop: '1vh', flexShrink: 0, minHeight: 'min(6vh, 48px)' }}>
        {feedback && (
          <div style={{
            fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold',
            color: complete ? '#4CAF50' : '#E65100',
            transition: 'opacity 0.3s ease',
          }}>{feedback}</div>
        )}
        {complete && (
          <button style={{
            padding: '1.2vh 3vw', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold',
            borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: '#B5D8F7', color: '#1565C0',
          }} onClick={handleReset}>다시 하기</button>
        )}
      </div>
    </div>
  );
}
