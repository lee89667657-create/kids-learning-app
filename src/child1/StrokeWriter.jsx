import { useState, useRef, useEffect, useCallback } from 'react';
import { recordStrokeLetter, getStrokeLetters } from '../utils/storage';
import { categories, getWordsByCategory } from '../data/words';
import ImageWithEdit from '../components/ImageWithEdit';
import { speak } from '../utils/tts';

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

// Canvas internal resolution (CSS scales it responsively)
const CANVAS_RES = 500;

function getLineWidth(pressure, pointerType) {
  if (pointerType === 'pen' && pressure > 0) return 4 + pressure * 6;
  return 6;
}

// Palm rejection: touch area > 2500 sq pixels = palm
function isPalm(e) {
  return (e.width || 0) * (e.height || 0) > 2500;
}

// Shared drawing helpers
function getPos(e, canvasRef) {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function drawStroke(ctx, from, to, pressure, pointerType) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = '#5D4E37';
  ctx.lineWidth = getLineWidth(pressure, pointerType);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.stroke();
}

// Common styles
const tabBtn = (active) => ({
  padding: '0.8vh 2vw',
  fontSize: 'min(2vw, 18px)',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: '2px solid ' + (active ? '#FFA726' : '#D4C5B0'),
  borderRadius: 16,
  backgroundColor: active ? '#FFE0B2' : '#FFF3E0',
  color: active ? '#E65100' : '#5D4E37',
});

const letterBtnStyle = (active, done) => ({
  width: 'min(5.5vw, 48px)',
  height: 'min(5.5vw, 48px)',
  borderRadius: 'min(1.5vw, 14px)',
  border: '3px solid ' + (active ? '#FFA726' : done ? '#A5D6A7' : '#D4C5B0'),
  backgroundColor: active ? '#FFE0B2' : done ? '#E8F5E9' : '#FFF3E0',
  fontSize: 'min(2.8vw, 24px)',
  fontWeight: 'bold',
  cursor: 'pointer',
  color: '#5D4E37',
});

const actionBtnStyle = (bg, color) => ({
  padding: '1.2vh 3vw',
  fontSize: 'min(2.5vw, 22px)',
  fontWeight: 'bold',
  borderRadius: 20,
  border: 'none',
  cursor: 'pointer',
  backgroundColor: bg,
  color,
  minHeight: 'min(6vh, 48px)',
});

const canvasCSSSize = 'min(50vh, 55vw)';
const canvasStyle = {
  width: canvasCSSSize,
  height: canvasCSSSize,
  borderRadius: 24,
  border: '3px solid #E0D5C7',
  backgroundColor: '#FFFEF9',
  touchAction: 'none',
  cursor: 'crosshair',
};

// ─── Letter Mode (자음/모음 연습) ───
function LetterMode() {
  const canvasRef = useRef(null);
  const [section, setSection] = useState('consonant');
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

    // Stroke start numbers
    ctx.setLineDash([]);
    const numR = canvas.width * 0.025;
    letter.strokes.forEach((stroke, idx) => {
      const pt = stroke[0];
      const x = pt.x * scale;
      const y = pt.y * scale;
      ctx.beginPath();
      ctx.arc(x, y, numR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE0B2';
      ctx.fill();
      ctx.strokeStyle = '#FFA726';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E65100';
      ctx.font = `bold ${Math.round(numR * 1.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), x, y);
    });
    ctx.restore();
  }, [currentLetter]);

  useEffect(() => { drawGuide(); }, [currentLetter, drawGuide]);

  function handlePointerDown(e) {
    if (isPalm(e)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef);
  }
  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return;
    e.preventDefault();
    const pos = getPos(e, canvasRef);
    drawStroke(canvasRef.current.getContext('2d'), lastPos.current, pos, e.pressure, e.pointerType);
    lastPos.current = pos;
  }
  function handlePointerUp(e) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function switchSection(s) {
    setSection(s);
    setCurrentLetter(s === 'consonant' ? CONSONANT_LIST[0] : VOWEL_LIST[0]);
    setShowPraise(false);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '1vw', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={tabBtn(section === 'consonant')} onClick={() => switchSection('consonant')}>자음</button>
        <button style={tabBtn(section === 'vowel')} onClick={() => switchSection('vowel')}>모음</button>
      </div>
      <div style={{ display: 'flex', gap: 'min(0.8vw, 8px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1vh', flexShrink: 0 }}>
        {list.map((l) => (
          <button key={l} style={letterBtnStyle(currentLetter === l, doneLs.includes(l) && currentLetter !== l)}
            onClick={() => { setCurrentLetter(l); setShowPraise(false); }}>{l}</button>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <canvas ref={canvasRef} width={CANVAS_RES} height={CANVAS_RES} style={canvasStyle}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
      </div>
      <div style={{ display: 'flex', gap: '2vw', marginTop: '1vh', flexShrink: 0 }}>
        <button style={actionBtnStyle('#FFCDD2', '#C62828')} onClick={() => { setShowPraise(false); drawGuide(); }}>지우기</button>
        <button style={actionBtnStyle('#C8E6C9', '#2E7D32')} onClick={() => {
          recordStrokeLetter('child1', currentLetter);
          setDoneLs((prev) => prev.includes(currentLetter) ? prev : [...prev, currentLetter]);
          setShowPraise(true); speak('잘 썼어!'); setTimeout(() => setShowPraise(false), 2000);
        }}>완성!</button>
      </div>
      <div style={{ fontSize: 'min(3vw, 28px)', fontWeight: 'bold', color: '#4CAF50', marginTop: '0.5vh', opacity: showPraise ? 1 : 0, transition: 'opacity 0.5s ease', flexShrink: 0, height: 'min(4vh, 32px)' }}>
        잘 썼어! 🌟
      </div>
    </>
  );
}

// ─── Word Mode (단어 따라쓰기) ───
function WordMode() {
  const canvasRef = useRef(null);
  const [category, setCategory] = useState('가족');
  const [wordList, setWordList] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const list = getWordsByCategory(category);
    setWordList(list);
    setWordIdx(0);
  }, [category]);

  const currentWord = wordList[wordIdx] || null;

  const drawWordGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentWord) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const text = currentWord.word;
    const len = text.length;
    const fontSize = len === 1 ? canvas.width * 0.6 : len === 2 ? canvas.width * 0.42 : canvas.width * 0.32;

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dashed outline
    ctx.strokeStyle = '#D4C5B0';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

    // Very light fill
    ctx.fillStyle = 'rgba(212, 197, 176, 0.12)';
    ctx.setLineDash([]);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    ctx.restore();
  }, [currentWord]);

  useEffect(() => {
    drawWordGuide();
    if (currentWord) {
      setTimeout(() => speak(currentWord.sound), 300);
    }
  }, [currentWord, drawWordGuide]);

  function handlePointerDown(e) {
    if (isPalm(e)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef);
  }
  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return;
    e.preventDefault();
    const pos = getPos(e, canvasRef);
    drawStroke(canvasRef.current.getContext('2d'), lastPos.current, pos, e.pressure, e.pointerType);
    lastPos.current = pos;
  }
  function handlePointerUp(e) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function goNext() {
    recordStrokeLetter('child1', `word:${currentWord?.word}`);
    setWordIdx(wordIdx < wordList.length - 1 ? wordIdx + 1 : 0);
  }

  if (!currentWord) {
    return <div style={{ fontSize: 'min(2.5vw, 24px)', color: '#7A6B5D', textAlign: 'center', padding: '4vh' }}>이 카테고리에 단어가 없어요</div>;
  }

  return (
    <>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 'min(1vw, 8px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1vh', flexShrink: 0 }}>
        {categories.map((cat) => (
          <button key={cat} style={tabBtn(category === cat)} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {/* Main area: image + canvas side by side */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3vw', minHeight: 0 }}>
        {/* Left: word info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh', flexShrink: 0 }}>
          <ImageWithEdit
            imageKey={currentWord.word}
            fallbackEmoji={currentWord.emoji}
            size={80}
            sizeCSS="min(10vw, 10vh)"
            shape="square"
            label={currentWord.word}
            style={{ borderRadius: 16 }}
          />
          <span style={{ fontSize: 'min(3.5vw, 30px)', fontWeight: 'bold', color: '#5D4E37' }}>
            {currentWord.word}
          </span>
          <button style={{
            width: 'min(7vw, 56px)', height: 'min(7vw, 56px)', borderRadius: '50%',
            border: 'none', backgroundColor: '#BBDEFB', fontSize: 'min(3.5vw, 28px)', cursor: 'pointer',
          }} onClick={() => speak(currentWord.sound)}>🔊</button>
        </div>

        {/* Right: canvas */}
        <canvas ref={canvasRef} width={CANVAS_RES} height={CANVAS_RES} style={canvasStyle}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
      </div>

      {/* Bottom buttons */}
      <div style={{ display: 'flex', gap: '2vw', marginTop: '1vh', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <button style={actionBtnStyle('#FFCDD2', '#C62828')} onClick={drawWordGuide}>지우기</button>
        <span style={{ fontSize: 'min(2vw, 18px)', color: '#7A6B5D' }}>
          {wordIdx + 1} / {wordList.length}
        </span>
        <button style={actionBtnStyle('#B5D8F7', '#2C5F8A')} onClick={goNext}>다음 →</button>
      </div>
    </>
  );
}

// ─── Main StrokeWriter ───
export default function StrokeWriter({ onBack }) {
  const [mode, setMode] = useState('letter');

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37' }}>✏️ 한글 쓰기</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1vh', borderRadius: 20, overflow: 'hidden', border: '2px solid #D4C5B0', flexShrink: 0 }}>
        {['letter', 'word'].map((m) => (
          <button key={m} style={{
            padding: '1vh 3vw', fontSize: 'min(2vw, 20px)', fontWeight: 'bold', cursor: 'pointer', border: 'none',
            backgroundColor: mode === m ? '#FFE0B2' : '#FFF3E0', color: mode === m ? '#E65100' : '#5D4E37',
          }} onClick={() => setMode(m)}>
            {m === 'letter' ? '자음/모음' : '단어 쓰기'}
          </button>
        ))}
      </div>

      {mode === 'letter' && <LetterMode />}
      {mode === 'word' && <WordMode />}
    </div>
  );
}
