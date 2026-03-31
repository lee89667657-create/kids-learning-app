import { useState, useEffect } from 'react';
import { categories, getAllWords } from '../data/words';
import {
  saveCustomImage, deleteCustomImage, getAllCustomImages,
  addCustomWord, deleteCustomWord, updateCustomWord,
} from '../utils/storage';

function resizeImage(file, maxBytes = 500 * 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const maxDim = 400;
        if (w > maxDim || h > maxDim) { const r = Math.min(maxDim / w, maxDim / h); w = Math.round(w * r); h = Math.round(h * r); }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        let q = 0.8, result = canvas.toDataURL('image/jpeg', q);
        while (result.length > maxBytes * 1.37 && q > 0.2) { q -= 0.1; result = canvas.toDataURL('image/jpeg', q); }
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function speakWord(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

const input = {
  padding: '1vh 1.2vw', borderRadius: 12, border: '2px solid #D4C5B0',
  fontSize: 'min(2vw, 18px)', backgroundColor: '#FFFEF9', color: '#5D4E37',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const smallBtn = (bg, color) => ({
  padding: '0.6vh 1.2vw', borderRadius: 10, border: 'none',
  fontSize: 'min(1.6vw, 14px)', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: bg, color,
});

export default function WordManager({ onBack }) {
  const [category, setCategory] = useState('가족');
  const [wordList, setWordList] = useState([]);
  const [images, setImages] = useState({});
  const [editing, setEditing] = useState(null);
  const [newWord, setNewWord] = useState('');
  const [newSound, setNewSound] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [showToast, setShowToast] = useState(false);

  function refresh() { setWordList(getAllWords().filter((w) => w.category === category)); setImages(getAllCustomImages()); }
  useEffect(() => { refresh(); }, [category]);

  function handleUpload(wordId, e) {
    const file = e.target.files?.[0]; if (!file) return;
    resizeImage(file).then((b64) => { saveCustomImage(wordId, b64); refresh(); });
  }
  function handleNewPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    resizeImage(file).then((b64) => setNewPhoto(b64)); e.target.value = '';
  }
  function handleAdd() {
    const word = newWord.trim(); if (!word || !newPhoto) return;
    addCustomWord(category, { word, emoji: '📷', sound: newSound.trim() || word, image: null });
    saveCustomImage(word, newPhoto);
    setNewWord(''); setNewSound(''); setNewPhoto(null);
    setShowToast(true); setTimeout(() => setShowToast(false), 1500); refresh();
  }
  function openEdit(word) {
    setEditing({ original: word.word, newWord: word.word, newSound: word.sound, newEmoji: word.emoji, isCustom: !!word._custom });
  }
  function saveEdit() {
    if (!editing) return;
    if (editing.isCustom) { updateCustomWord(editing.original, { word: editing.newWord, sound: editing.newSound, emoji: editing.newEmoji }); }
    else { const bw = wordList.find((w) => w.word === editing.original); if (bw) addCustomWord(category, { ...bw, word: editing.newWord, sound: editing.newSound, emoji: editing.newEmoji }); }
    setEditing(null); refresh();
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw, 28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: 'min(3vw, 28px)', fontWeight: 'bold', color: '#5D4E37' }}>단어 관리</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Category */}
      <div style={{ display: 'flex', gap: 'min(1vw, 8px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5vh', flexShrink: 0 }}>
        {categories.map((cat) => (
          <button key={cat} style={{
            padding: '0.6vh 1.5vw', borderRadius: 14, border: '2px solid ' + (category === cat ? '#FFA726' : '#D4C5B0'),
            backgroundColor: category === cat ? '#FFE0B2' : '#FFF3E0', fontSize: 'min(2vw, 18px)', fontWeight: 'bold', cursor: 'pointer', color: '#5D4E37',
          }} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {/* Main: 2-column layout */}
      <div style={{ flex: 1, display: 'flex', gap: '2vw', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: word list (scrollable) */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1vh',
          paddingRight: '1vw',
        }}>
          {wordList.map((w) => {
            const ci = images[w.word];
            return (
              <div key={w.word} style={{
                display: 'flex', alignItems: 'center', gap: '1vw', padding: '1.2vh 1.5vw',
                borderRadius: 14, backgroundColor: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', flexShrink: 0,
              }}>
                {ci ? <img src={ci} alt={w.word} style={{ width: 'min(6vw, 56px)', height: 'min(6vw, 56px)', borderRadius: 10, objectFit: 'cover', border: '2px solid #E0D5C7' }} />
                  : <div style={{ width: 'min(6vw, 56px)', height: 'min(6vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'min(4vw, 36px)', borderRadius: 10, backgroundColor: '#FFF3E0', border: '2px solid #E0D5C7', flexShrink: 0 }}>{w.emoji}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'min(2.2vw, 20px)', fontWeight: 'bold', color: '#5D4E37' }}>{w.word}</div>
                  <div style={{ fontSize: 'min(1.6vw, 14px)', color: '#7A6B5D' }}>소리: {w.sound}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5vw', flexWrap: 'wrap' }}>
                  <button style={smallBtn('#BBDEFB', '#1565C0')} onClick={() => document.getElementById(`file-${w.word}`).click()}>사진</button>
                  <input id={`file-${w.word}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUpload(w.word, e)} />
                  {ci && <button style={smallBtn('#FFE0B2', '#E65100')} onClick={() => { deleteCustomImage(w.word); refresh(); }}>삭제</button>}
                  <button style={smallBtn('#E1BEE7', '#6A1B9A')} onClick={() => openEdit(w)}>수정</button>
                  <button style={smallBtn('#E3F2FD', '#1565C0')} onClick={() => speakWord(w.sound)}>🔊</button>
                  {w._custom && <button style={smallBtn('#FFCDD2', '#C62828')} onClick={() => { deleteCustomWord(w.word); refresh(); }}>삭제</button>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: add form */}
        <div style={{
          width: '35%', minWidth: 'min(240px, 30vw)', flexShrink: 0, display: 'flex', flexDirection: 'column',
          padding: '2vh 1.5vw', borderRadius: 16, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 'min(2.2vw, 20px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh' }}>새 단어 추가</div>
          <div style={{ display: 'flex', gap: '1vw', marginBottom: '1vh', alignItems: 'center' }}>
            <input style={input} placeholder="단어 입력" value={newWord} onChange={(e) => { setNewWord(e.target.value); if (!newSound || newSound === newWord) setNewSound(e.target.value); }} />
            <button style={{ ...smallBtn(newWord.trim() ? '#E3F2FD' : '#F0F0F0', newWord.trim() ? '#1565C0' : '#BDBDBD'), padding: '1vh 1vw', fontSize: 'min(2.5vw, 22px)' }}
              onClick={() => newWord.trim() && speakWord(newSound.trim() || newWord.trim())} disabled={!newWord.trim()}>🔊</button>
          </div>
          <input style={{ ...input, marginBottom: '1.5vh' }} placeholder="소리 (TTS 텍스트)" value={newSound} onChange={(e) => setNewSound(e.target.value)} />
          <div style={{
            border: '3px dashed #D4C5B0', borderRadius: 14, padding: '2vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backgroundColor: newPhoto ? '#FFFEF9' : '#FFF3E0', marginBottom: '1.5vh', minHeight: '12vh',
          }} onClick={() => document.getElementById('new-word-photo').click()}>
            {newPhoto ? <img src={newPhoto} alt="미리보기" style={{ width: 'min(10vw, 100px)', height: 'min(10vw, 100px)', borderRadius: 14, objectFit: 'cover', border: '2px solid #A5D6A7' }} />
              : <><span style={{ fontSize: 'min(5vw, 40px)', marginBottom: '0.5vh' }}>📷</span><span style={{ fontSize: 'min(1.8vw, 16px)', color: '#7A6B5D', fontWeight: 'bold' }}>사진을 눌러서 추가해요</span></>}
          </div>
          <input id="new-word-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNewPhoto} />
          <button style={{
            width: '100%', padding: '1.5vh', borderRadius: 14, border: 'none', backgroundColor: '#C8E6C9', color: '#2E7D32',
            fontSize: 'min(2.2vw, 20px)', fontWeight: 'bold', cursor: newWord.trim() && newPhoto ? 'pointer' : 'default',
            opacity: newWord.trim() && newPhoto ? 1 : 0.5,
          }} onClick={handleAdd} disabled={!newWord.trim() || !newPhoto}>추가</button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#C8E6C9', color: '#2E7D32', padding: '2vh 4vw', borderRadius: 20, fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 300 }}>
          추가됐어요!
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setEditing(null)}>
          <div style={{ backgroundColor: '#FFF9F0', borderRadius: 24, padding: '3vh 3vw', width: 'min(80vw, 400px)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 'min(2.5vw, 24px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '2vh' }}>단어 수정</div>
            <label style={{ fontSize: 'min(2vw, 18px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '0.5vh', display: 'block' }}>단어</label>
            <input style={{ ...input, marginBottom: '1.5vh' }} value={editing.newWord} onChange={(e) => setEditing({ ...editing, newWord: e.target.value })} />
            <label style={{ fontSize: 'min(2vw, 18px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '0.5vh', display: 'block' }}>소리 (TTS)</label>
            <input style={{ ...input, marginBottom: '1.5vh' }} value={editing.newSound} onChange={(e) => setEditing({ ...editing, newSound: e.target.value })} />
            <label style={{ fontSize: 'min(2vw, 18px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '0.5vh', display: 'block' }}>이모지</label>
            <input style={{ ...input, marginBottom: '2vh' }} value={editing.newEmoji} onChange={(e) => setEditing({ ...editing, newEmoji: e.target.value })} />
            <div style={{ display: 'flex', gap: '1.5vw', justifyContent: 'flex-end' }}>
              <button style={{ ...smallBtn('#FFCDD2', '#C62828'), padding: '1.2vh 2.5vw', fontSize: 'min(2vw, 18px)' }} onClick={() => setEditing(null)}>취소</button>
              <button style={{ ...smallBtn('#C8E6C9', '#2E7D32'), padding: '1.2vh 2.5vw', fontSize: 'min(2vw, 18px)' }} onClick={saveEdit}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
