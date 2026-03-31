import { useState, useRef, useEffect, useCallback } from 'react';
import { recordStrokeLetter, getStrokeLetters } from '../utils/storage';
import { categories, getWordsByCategory } from '../data/words';
import ImageWithEdit from '../components/ImageWithEdit';

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
const PALM_THRESHOLD = 30;

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
  if (pointerType === 'pen' && pressure > 0) return 4 + pressure * 6;
  return 6;
}
function isPalm(e) { return e.width > PALM_THRESHOLD || e.height > PALM_THRESHOLD; }

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
});

// ─── Letter Mode ───
function LetterMode() {
  const canvasRef = useRef(null);
  const [section, setSection] = useState('consonant');
  const list = section === 'consonant' ? CONSONANT_LIST : VOWEL_LIST;
  const [currentLetter, setCurrentLetter] = useState(list[0]);
  const [doneLs, setDoneLs] = useState(() => getStrokeLetters('child1'));
  const [showPraise, setShowPraise] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const canvasSize = 'min(50vh, 60vw)';

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
      stroke.forEach((pt, i) => { if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale); else ctx.lineTo(pt.x * scale, pt.y * scale); });
      ctx.stroke();
    });
    ctx.setLineDash([]);
    letter.strokes.forEach((stroke, idx) => {
      const pt = stroke[0]; const x = pt.x * scale; const y = pt.y * scale;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE0B2'; ctx.fill();
      ctx.strokeStyle = '#FFA726'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#E65100'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), x, y);
    });
    ctx.restore();
  }, [currentLetter]);

  useEffect(() => { drawGuide(); }, [currentLetter, drawGuide]);

  function getPos(e) {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  }
  function handlePointerDown(e) {
    if (isPalm(e)) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true; lastPos.current = getPos(e);
  }
  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return; e.preventDefault();
    const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#5D4E37'; ctx.lineWidth = getLineWidth(e.pressure, e.pointerType);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke();
    lastPos.current = pos;
  }
  function handlePointerUp(e) { e.preventDefault(); isDrawing.current = false; lastPos.current = null; }

  function switchSection(s) { setSection(s); setCurrentLetter(s === 'consonant' ? CONSONANT_LIST[0] : VOWEL_LIST[0]); setShowPraise(false); }

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
        <canvas ref={canvasRef} width={340} height={340}
          style={{ width: canvasSize, height: canvasSize, borderRadius: 24, border: '3px solid #E0D5C7', backgroundColor: '#FFFEF9', touchAction: 'none', cursor: 'crosshair' }}
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
      <div style={{ fontSize: 'min(3vw, 32px)', fontWeight: 'bold', color: '#4CAF50', marginTop: '0.5vh', opacity: showPraise ? 1 : 0, transition: 'opacity 0.5s ease', flexShrink: 0 }}>잘 썼어! 🌟</div>
    </>
  );
}

// ─── Word Mode ───
function WordMode() {
  const canvasRef = useRef(null);
  const [category, setCategory] = useState('가족');
  const [wordList, setWordList] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [showPraise, setShowPraise] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const canvasSize = 'min(50vh, 60vw)';

  useEffect(() => { const list = getWordsByCategory(category); setWordList(list); setWordIdx(0); setShowPraise(false); }, [category]);
  const currentWord = wordList[wordIdx] || null;

  const drawWordGuide = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !currentWord) return;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text = currentWord.word;
    const fontSize = text.length === 1 ? 220 : text.length === 2 ? 160 : 120;
    ctx.save();
    ctx.font = `bold ${fontSize}px 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#E0D5C7'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'rgba(212, 197, 176, 0.15)'; ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }, [currentWord]);

  useEffect(() => { drawWordGuide(); if (currentWord) setTimeout(() => speak(currentWord.sound), 300); }, [currentWord, drawWordGuide]);

  function getPos(e) {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  }
  function handlePointerDown(e) { if (isPalm(e)) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); isDrawing.current = true; lastPos.current = getPos(e); }
  function handlePointerMove(e) {
    if (!isDrawing.current || isPalm(e)) return; e.preventDefault();
    const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#5D4E37'; ctx.lineWidth = getLineWidth(e.pressure, e.pointerType);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke(); lastPos.current = pos;
  }
  function handlePointerUp(e) { e.preventDefault(); isDrawing.current = false; lastPos.current = null; }

  function goNext() { setWordIdx(wordIdx < wordList.length - 1 ? wordIdx + 1 : 0); setShowPraise(false); }
  function goPrev() { if (wordIdx > 0) setWordIdx(wordIdx - 1); setShowPraise(false); }

  if (!currentWord) return <div style={{ fontSize: 'min(2.5vw, 24px)', color: '#7A6B5D' }}>이 카테고리에 단어가 없어요</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: 'min(1vw, 8px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1vh', flexShrink: 0 }}>
        {categories.map((cat) => (
          <button key={cat} style={tabBtn(category === cat)} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2vw', marginBottom: '1vh', flexShrink: 0 }}>
        <ImageWithEdit imageKey={currentWord.word} fallbackEmoji={currentWord.emoji} size={56} sizeCSS="min(6vw, 56px)" shape="square" label={currentWord.word} style={{ borderRadius: 12 }} />
        <span style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37' }}>{currentWord.word}</span>
        <button style={{ width: 'min(6vw, 56px)', height: 'min(6vw, 56px)', borderRadius: '50%', border: 'none', backgroundColor: '#BBDEFB', fontSize: 'min(3vw, 28px)', cursor: 'pointer' }}
          onClick={() => speak(currentWord.sound)}>🔊</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <canvas ref={canvasRef} width={340} height={340}
          style={{ width: canvasSize, height: canvasSize, borderRadius: 24, border: '3px solid #E0D5C7', backgroundColor: '#FFFEF9', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
      </div>
      <div style={{ display: 'flex', gap: '2vw', marginTop: '1vh', flexShrink: 0 }}>
        <button style={actionBtnStyle('#FFCDD2', '#C62828')} onClick={drawWordGuide}>지우기</button>
        <button style={actionBtnStyle('#C8E6C9', '#2E7D32')} onClick={() => {
          recordStrokeLetter('child1', `word:${currentWord.word}`);
          setShowPraise(true); speak('잘 썼어!'); setTimeout(() => { setShowPraise(false); goNext(); }, 1500);
        }}>완성!</button>
      </div>
      <div style={{ display: 'flex', gap: '2vw', marginTop: '0.5vh', alignItems: 'center', flexShrink: 0 }}>
        <button style={{ ...actionBtnStyle('#B5D8F7', '#2C5F8A'), opacity: wordIdx === 0 ? 0.4 : 1 }} onClick={goPrev} disabled={wordIdx === 0}>← 이전</button>
        <span style={{ fontSize: 'min(2vw, 20px)', color: '#7A6B5D' }}>{wordIdx + 1} / {wordList.length}</span>
        <button style={actionBtnStyle('#B5D8F7', '#2C5F8A')} onClick={goNext}>다음 →</button>
      </div>
      <div style={{ fontSize: 'min(3vw, 32px)', fontWeight: 'bold', color: '#4CAF50', opacity: showPraise ? 1 : 0, transition: 'opacity 0.5s ease', flexShrink: 0 }}>잘 썼어! 🌟</div>
    </>
  );
}

// ─── Main ───
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(3.5vw, 32px)', fontWeight: 'bold', color: '#5D4E37' }}>✏️ 한글 쓰기</div>
        <div style={{ width: '8vw' }} />
      </div>
      <div style={{ display: 'flex', gap: 0, marginBottom: '1vh', borderRadius: 20, overflow: 'hidden', border: '2px solid #D4C5B0', flexShrink: 0 }}>
        {['letter', 'word'].map((m) => (
          <button key={m} style={{
            padding: '1vh 3vw', fontSize: 'min(2vw, 20px)', fontWeight: 'bold', cursor: 'pointer', border: 'none',
            backgroundColor: mode === m ? '#FFE0B2' : '#FFF3E0', color: mode === m ? '#E65100' : '#5D4E37',
          }} onClick={() => setMode(m)}>{m === 'letter' ? '자음/모음' : '단어 쓰기'}</button>
        ))}
      </div>
      {mode === 'letter' && <LetterMode />}
      {mode === 'word' && <WordMode />}
    </div>
  );
}
