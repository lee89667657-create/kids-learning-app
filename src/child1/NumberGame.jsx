import { useState, useCallback } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

export default function NumberGame({ onBack }) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [shuffled, setShuffled] = useState(() => shuffle(numbers));
  const [placed, setPlaced] = useState([]);
  const [wrongId, setWrongId] = useState(null);
  const [complete, setComplete] = useState(false);

  const nextExpected = placed.length + 1;

  const reset = useCallback(() => {
    setShuffled(shuffle(numbers));
    setPlaced([]);
    setWrongId(null);
    setComplete(false);
  }, []);

  function handlePick(num) {
    if (complete) return;
    if (num === nextExpected) {
      speak(String(num));
      const newPlaced = [...placed, num];
      setPlaced(newPlaced);
      setShuffled((prev) => prev.filter((n) => n !== num));
      if (newPlaced.length === 10) {
        setComplete(true);
        setTimeout(() => speak('잘했어!'), 500);
      }
    } else {
      setWrongId(num);
      setTimeout(() => setWrongId(null), 500);
    }
  }

  return (
    <div style={{
      height: '100vh',
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
        <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37' }}>🔢 숫자놀이</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Instruction */}
      <div style={{
        fontSize: 'min(3vw, 28px)',
        color: '#7A6B5D',
        marginBottom: '2vh',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {complete ? '' : `${nextExpected}을 찾아봐!`}
      </div>

      {/* Placed slots */}
      <div style={{
        display: 'flex',
        gap: 'min(1vw, 8px)',
        marginBottom: '2vh',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {numbers.map((n) => (
          <div key={n} style={{
            width: 'min(7vw, 60px)',
            height: 'min(7vw, 60px)',
            borderRadius: 'min(1.5vw, 16px)',
            border: placed.includes(n) ? '3px solid #A5D6A7' : '3px dashed #D4C5B0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'min(3vw, 30px)',
            fontWeight: 'bold',
            color: '#5D4E37',
            backgroundColor: placed.includes(n) ? '#E8F5E9' : '#FFF3E0',
            transition: 'all 0.3s ease',
          }}>
            {placed.includes(n) ? n : ''}
          </div>
        ))}
      </div>

      {/* Number buttons or complete */}
      {!complete ? (
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 'min(2vw, 16px)',
          width: 'min(80%, 90vw)',
        }}>
          {shuffled.map((num) => (
            <button key={num} style={{
              borderRadius: 'min(2.5vw, 24px)',
              border: '3px solid transparent',
              fontSize: 'min(4vw, 36px)',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: wrongId === num ? '#FFCDD2' : '#E3F2FD',
              color: '#2C5F8A',
              transition: 'all 0.3s ease',
              animation: wrongId === num ? 'shake 0.3s ease-in-out' : 'none',
            }} onClick={() => handlePick(num)}>
              {num}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3vh' }}>
          <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#4CAF50' }}>잘했어! 🌟</div>
          <button style={{
            padding: '2vh 5vw',
            fontSize: 'min(3vw, 24px)',
            fontWeight: 'bold',
            borderRadius: 24,
            border: 'none',
            backgroundColor: '#B5D8F7',
            color: '#2C5F8A',
            cursor: 'pointer',
          }} onClick={reset}>다시 하기</button>
        </div>
      )}
    </div>
  );
}
