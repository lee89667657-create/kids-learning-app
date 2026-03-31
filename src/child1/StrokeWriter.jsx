import { useState, useRef, useEffect, useCallback } from 'react';
import { recordStrokeLetter, getStrokeLetters } from '../utils/storage';
import { categories, getWordsByCategory } from '../data/words';
import ImageWithEdit from '../components/ImageWithEdit';

// Stroke path data for Korean consonants/vowels
const CONSONANTS = {
  ㄱ: { strokes: [[{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 75, y: 80 }]] },
  ㄴ: { strokes: [[{ x: 25, y: 20 }, { x: 25, y: 75 }, { x: 75, y: 75 }]] },
  ㄷ: { strokes: [[{ x: 25, y: 25 }, { x: 75, y: 25 }], [{ x: 25, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }]] },
  ㄹ: { strokes: [[{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 40 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 80, y: 60 }, { x: 80, y: 80 }]] },
  ㅁ: { strokes: [[{ x: 25, y: 25 }, { x: 25, y: 75 }], [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 75, y: 75 }, { x: 25, y: 75 }]] },
  ㅂ: { strokes: [[{ x: 25, y: 20 }, { x: 25, y: 75 }], [{ x: 75, y: 20 }, { x: 75, y: 75 }], [{ x: 25, y: 50 }, { x: 75, y: 50 }], [{ x: 25, y: 75 }, { x: 75, y: 75 }]] },
  ㅅ: { strokes: [[{ x: 50, y: 20 }, { x: 20, y: 80 }], [{ x: 50, y: 20 }, { x: 80, y: 80 }]] },
};

const VOWELS = {
  ㅏ: { strokes: [[{ x: 40, y: 15 }, { x: 40, y: 85 }], [{ x: 40, y: 50 }, { x: 75, y: 50 }]] },
  ㅓ: { strokes: [[{ x: 60, y: 15 }, { x: 60, y: 85 }], [{ x: 25, y: 50 }, { x: 60, y: 50 }]] },
  ㅗ: { strokes: [[{ x: 50, y: 40 }, { x: 50, y: 15 }], [{ x: 15, y: 60 }, { x: 85, y: 60 }]] },
  ㅜ: { strokes: [[{ x: 15, y: 40 }, { x: 85, y: 40 }], [{ x: 50, y: 40 }, { x: 50, y: 75 }]] },
  ㅡ: { strokes: [[{ x: 15, y: 50 }, { x: 85, y: 50 }]] },
  ㅣ: { strokes: [[{ x: 50, y: 15 }, { x: 50, y: 85 }]] },
  ㅐ: { strokes: [[{ x: 30, y: 15 }, { x: 30, y: 85 }], [{ x: 30, y: 50 }, { x: 55, y: 50 }], [{ x: 65, y: 15 }, { x: 65, y: 85 }]] },
};

const CONSONANT_LIST = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ'];
const VOWEL_LIST = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅐ'];
const ALL_LETTERS = { ...CONSONANTS, ...VOWELS };

const PALM_THRESHOLD = 30; // pointer width/height above this = palm

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
    marginBottom: 12,
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
  tabRow: {
    display: 'flex',
    gap: 0,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    border: '2px solid #D4C5B0',
  },
  tab: {
    padding: '12px 28px',
    fontSize: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: '#FFF3E0',
    color: '#5D4E37',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#FFE0B2',
    color: '#E65100',
  },
  letterRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
  },
  letterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: '3px solid #D4C5B0',
    backgroundColor: '#FFF3E0',
    fontSize: 24,
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#5D4E37',
    transition: 'all 0.2s ease',
  },
  letterBtnActive: {
    borderColor: '#FFA726',
    backgroundColor: '#FFE0B2',
  },
  letterBtnDone: {
    borderColor: '#A5D6A7',
    backgroundColor: '#E8F5E9',
  },
  canvasWrap: {
    position: 'relative',
    width: 340,
    height: 340,
    marginBottom: 16,
  },
  canvas: {
    borderRadius: 24,
    border: '3px solid #E0D5C7',
    backgroundColor: '#FFFEF9',
    touchAction: 'none',
    cursor: 'crosshair',
  },
  btnRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 8,
  },
  actionBtn: {
    padding: '14px 32px',
    fontSize: 22,
    fontWeight: 'bold',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  clearBtn: { backgroundColor: '#FFCDD2', color: '#C62828' },
  doneBtn: { backgroundColor: '#C8E6C9', color: '#2E7D32' },
  praise: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
    transition: 'opacity 0.5s ease',
  },
  // Word mode
  wordInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  wordEmoji: { fontSize: 56 },
  wordText: { fontSize: 32, fontWeight: 'bold', color: '#5D4E37' },
  speakBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    border: 'none',
    backgroundColor: '#BBDEFB',
    fontSize: 28,
    cursor: 'pointer',
  },
  catRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  catBtn: {
    padding: '8px 16px',
    borderRadius: 16,
    border: '2px solid #D4C5B0',
    backgroundColor: '#FFF3E0',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#5D4E37',
    transition: 'all 0.2s ease',
  },
  catBtnActive: {
    backgroundColor: '#FFE0B2',
    borderColor: '#FFA726',
  },
  navBtn: {
    padding: '10px 24px',
    fontSize: 20,
    fontWeight: 'bold',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#B5D8F7',
    color: '#2C5F8A',
  },
};

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

function getLineWidth(pressure, pointerType) {
  if (pointerType === 'pen' && pressure > 0) {
    return 4 + pressure * 6; // 4~10px
  }
  return 6; // default
}

function isPalm(e) {
  return (e.width > PALM_THRESHOLD || e.height > PALM_THRESHOLD);
}

// ─── Letter mode (자음/모음) ───

function LetterMode({ onBack }) {
  const canvasRef = useRef(null);
  const [section, setSection] = useState('consonant'); // consonant | vowel
  const list = section === 'consonant' ? CONSONANT_LIST : VOWEL_LIST;
  const [currentLetter, setCurrentLetter] = useState(list[0]);
  const [doneLs, setDoneLs] = useState(() => getStrokeLetters('child1'));
  const [showPraise, setShowPraise] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const letter = ALL_LETTERS[currentLetter];
    if (!letter) return;
    const scale = canvas.width / 100;

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#D4C5B0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    letter.strokes.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
        else ctx.lineTo(pt.x * scale, pt.y * scale);
      });
      ctx.stroke();
    });

    ctx.setLineDash([]);
    letter.strokes.forEach((stroke, idx) => {
      const pt = stroke[0];
      const x = pt.x * scale;
      const y = pt.y * scale;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE0B2';
      ctx.fill();
      ctx.strokeStyle = '#FFA726';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E65100';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), x, y);
    });
    ctx.restore();
  }, [currentLetter]);

  useEffect(() => {
    drawGuide();
  }, [currentLetter, drawGuide]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function handlePointerDown(e) {
    if (isPalm(e)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = { ...getPos(e), pressure: e.pressure, pointerType: e.pointerType };
  }

  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const lw = getLineWidth(e.pressure, e.pointerType);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#5D4E37';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.stroke();
    lastPos.current = { ...pos, pressure: e.pressure, pointerType: e.pointerType };
  }

  function handlePointerUp(e) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function selectLetter(l) {
    setCurrentLetter(l);
    setShowPraise(false);
  }

  function switchSection(s) {
    setSection(s);
    const newList = s === 'consonant' ? CONSONANT_LIST : VOWEL_LIST;
    setCurrentLetter(newList[0]);
    setShowPraise(false);
  }

  return (
    <>
      {/* Sub-tabs: consonant / vowel */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          style={{ ...styles.catBtn, ...(section === 'consonant' ? styles.catBtnActive : {}) }}
          onClick={() => switchSection('consonant')}
        >
          자음
        </button>
        <button
          style={{ ...styles.catBtn, ...(section === 'vowel' ? styles.catBtnActive : {}) }}
          onClick={() => switchSection('vowel')}
        >
          모음
        </button>
      </div>

      <div style={styles.letterRow}>
        {list.map((l) => (
          <button
            key={l}
            style={{
              ...styles.letterBtn,
              ...(currentLetter === l ? styles.letterBtnActive : {}),
              ...(doneLs.includes(l) && currentLetter !== l ? styles.letterBtnDone : {}),
            }}
            onClick={() => selectLetter(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          style={{ ...styles.canvas, width: 340, height: 340 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div style={styles.btnRow}>
        <button style={{ ...styles.actionBtn, ...styles.clearBtn }} onClick={() => { setShowPraise(false); drawGuide(); }}>
          지우기
        </button>
        <button
          style={{ ...styles.actionBtn, ...styles.doneBtn }}
          onClick={() => {
            recordStrokeLetter('child1', currentLetter);
            setDoneLs((prev) => prev.includes(currentLetter) ? prev : [...prev, currentLetter]);
            setShowPraise(true);
            speak('잘 썼어!');
            setTimeout(() => setShowPraise(false), 2000);
          }}
        >
          완성!
        </button>
      </div>

      <div style={{ ...styles.praise, opacity: showPraise ? 1 : 0 }}>
        잘 썼어! 🌟
      </div>
    </>
  );
}

// ─── Word mode (단어 따라쓰기) ───

function WordMode() {
  const canvasRef = useRef(null);
  const [category, setCategory] = useState('가족');
  const [wordList, setWordList] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [showPraise, setShowPraise] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const list = getWordsByCategory(category);
    setWordList(list);
    setWordIdx(0);
    setShowPraise(false);
  }, [category]);

  const currentWord = wordList[wordIdx] || null;

  const drawWordGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentWord) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the word as a light guide
    const text = currentWord.word;
    const fontSize = text.length === 1 ? 220 : text.length === 2 ? 160 : 120;
    ctx.save();
    ctx.font = `bold ${fontSize}px 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#E0D5C7';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

    // Also fill very lightly
    ctx.fillStyle = 'rgba(212, 197, 176, 0.15)';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }, [currentWord]);

  useEffect(() => {
    drawWordGuide();
    if (currentWord) {
      setTimeout(() => speak(currentWord.sound), 300);
    }
  }, [currentWord, drawWordGuide]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function handlePointerDown(e) {
    if (isPalm(e)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = getPos(e);
  }

  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const lw = getLineWidth(e.pressure, e.pointerType);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#5D4E37';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.stroke();
    lastPos.current = pos;
  }

  function handlePointerUp(e) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function handleDone() {
    if (!currentWord) return;
    recordStrokeLetter('child1', `word:${currentWord.word}`);
    setShowPraise(true);
    speak('잘 썼어!');
    setTimeout(() => {
      setShowPraise(false);
      goNext();
    }, 1500);
  }

  function goNext() {
    if (wordIdx < wordList.length - 1) {
      setWordIdx(wordIdx + 1);
    } else {
      setWordIdx(0);
    }
    setShowPraise(false);
  }

  function goPrev() {
    if (wordIdx > 0) {
      setWordIdx(wordIdx - 1);
    }
    setShowPraise(false);
  }

  if (!currentWord) return <div style={{ fontSize: 24, color: '#7A6B5D' }}>이 카테고리에 단어가 없어요</div>;

  return (
    <>
      {/* Category selector */}
      <div style={styles.catRow}>
        {categories.map((cat) => (
          <button
            key={cat}
            style={{ ...styles.catBtn, ...(category === cat ? styles.catBtnActive : {}) }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word info */}
      <div style={styles.wordInfo}>
        <ImageWithEdit
          imageKey={currentWord.word}
          fallbackEmoji={currentWord.emoji}
          size={56}
          shape="square"
          label={currentWord.word}
          style={{ borderRadius: 12 }}
        />
        <span style={styles.wordText}>{currentWord.word}</span>
        <button style={styles.speakBtn} onClick={() => speak(currentWord.sound)}>
          🔊
        </button>
      </div>

      {/* Canvas */}
      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          style={{ ...styles.canvas, width: 340, height: 340 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Buttons */}
      <div style={styles.btnRow}>
        <button style={{ ...styles.actionBtn, ...styles.clearBtn }} onClick={drawWordGuide}>
          지우기
        </button>
        <button style={{ ...styles.actionBtn, ...styles.doneBtn }} onClick={handleDone}>
          완성!
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
        <button style={styles.navBtn} onClick={goPrev} disabled={wordIdx === 0}>
          ← 이전
        </button>
        <span style={{ fontSize: 20, color: '#7A6B5D' }}>
          {wordIdx + 1} / {wordList.length}
        </span>
        <button style={styles.navBtn} onClick={goNext}>
          다음 →
        </button>
      </div>

      <div style={{ ...styles.praise, opacity: showPraise ? 1 : 0 }}>
        잘 썼어! 🌟
      </div>
    </>
  );
}

// ─── Main StrokeWriter ───

export default function StrokeWriter({ onBack }) {
  const [mode, setMode] = useState('letter'); // letter | word

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={styles.title}>✏️ 한글 쓰기</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Mode tabs */}
      <div style={styles.tabRow}>
        <button
          style={{ ...styles.tab, ...(mode === 'letter' ? styles.tabActive : {}) }}
          onClick={() => setMode('letter')}
        >
          자음/모음
        </button>
        <button
          style={{ ...styles.tab, ...(mode === 'word' ? styles.tabActive : {}) }}
          onClick={() => setMode('word')}
        >
          단어 쓰기
        </button>
      </div>

      {mode === 'letter' && <LetterMode />}
      {mode === 'word' && <WordMode />}
    </div>
  );
}
