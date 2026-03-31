import { useState, useEffect, useCallback } from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#FFF9F0',
    padding: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    marginBottom: 24,
  },
  backBtn: {
    fontSize: 28,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 12,
    borderRadius: 16,
    color: '#5D4E37',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  instruction: {
    fontSize: 28,
    color: '#7A6B5D',
    marginBottom: 24,
    textAlign: 'center',
  },
  numbersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    maxWidth: 500,
    marginBottom: 32,
  },
  numberBtn: {
    width: 80,
    height: 80,
    borderRadius: 24,
    border: '3px solid transparent',
    fontSize: 36,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  placedSlot: {
    width: 60,
    height: 60,
    borderRadius: 16,
    border: '3px dashed #D4C5B0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#5D4E37',
    backgroundColor: '#FFF3E0',
    transition: 'all 0.3s ease',
  },
  filledSlot: {
    border: '3px solid #A5D6A7',
    backgroundColor: '#E8F5E9',
  },
  completeMsg: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 24,
    animation: 'none',
  },
  resetBtn: {
    marginTop: 20,
    padding: '16px 40px',
    fontSize: 24,
    fontWeight: 'bold',
    borderRadius: 24,
    border: 'none',
    backgroundColor: '#B5D8F7',
    color: '#2C5F8A',
    cursor: 'pointer',
  },
};

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
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={styles.title}>🔢 숫자놀이</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.instruction}>
        {complete ? '' : `${nextExpected}을 찾아봐!`}
      </div>

      <div style={styles.placedRow}>
        {numbers.map((n) => (
          <div
            key={n}
            style={{
              ...styles.placedSlot,
              ...(placed.includes(n) ? styles.filledSlot : {}),
            }}
          >
            {placed.includes(n) ? n : ''}
          </div>
        ))}
      </div>

      {!complete && (
        <div style={styles.numbersRow}>
          {shuffled.map((num) => (
            <button
              key={num}
              style={{
                ...styles.numberBtn,
                backgroundColor:
                  wrongId === num ? '#FFCDD2' : '#E3F2FD',
                color: '#2C5F8A',
                transform:
                  wrongId === num
                    ? 'translateX(-4px)'
                    : 'translateX(0)',
                animation:
                  wrongId === num
                    ? 'shake 0.3s ease-in-out'
                    : 'none',
              }}
              onClick={() => handlePick(num)}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {complete && (
        <>
          <div style={styles.completeMsg}>잘했어! 🌟</div>
          <button style={styles.resetBtn} onClick={reset}>
            다시 하기
          </button>
        </>
      )}
    </div>
  );
}
