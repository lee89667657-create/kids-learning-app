import { useState, useRef } from 'react';
import ImageWithEdit from './ImageWithEdit';
import { saveCustomImage, getCustomImage } from '../utils/storage';

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

export default function ProfileSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [, forceUpdate] = useState(0);
  const [showModal, setShowModal] = useState(null); // 'child1' | 'child2' | null
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);
  const fileRef = useRef(null);

  const btnBase = {
    width: 'min(40vw, 30vh)',
    height: 'min(40vw, 30vh)',
    borderRadius: '3vw',
    border: '4px solid transparent',
    fontSize: 'min(4vw, 3.5vh)',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5vh',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: 'transparent',
    position: 'relative',
  };

  function btnStyle(bg, color, id) {
    return {
      ...btnBase,
      backgroundColor: bg,
      color,
      transform: hovered === id ? 'scale(1.05)' : 'scale(1)',
      boxShadow: hovered === id ? '0 8px 24px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
    };
  }

  function handleTouchStart(profileId) {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      longPressTimer.current = null;
      setShowModal(profileId);
    }, 3000);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleClick(profileId) {
    // If long press just happened, don't navigate
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onSelect(profileId);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file || !showModal) return;
    const key = showModal === 'child1' ? 'profile_child1' : 'profile_child2';
    resizeImage(file).then((base64) => {
      saveCustomImage(key, base64);
      forceUpdate((n) => n + 1);
      setShowModal(null);
    });
    e.target.value = '';
  }

  function handleChangePhoto() {
    fileRef.current?.click();
  }

  const imgSize = 'min(18vw, 14vh)';

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF9F0',
      padding: '2vh 2vw',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: '5vw', fontWeight: 'bold', color: '#5D4E37', marginBottom: '5vh' }}>
        누구야?
      </div>
      <div style={{ display: 'flex', gap: '4vw', justifyContent: 'center' }}>
        {/* 형 버튼 */}
        <button
          style={btnStyle('#B5D8F7', '#2C5F8A', 'child1')}
          onMouseEnter={() => setHovered('child1')}
          onMouseLeave={() => setHovered(null)}
          onTouchStart={() => handleTouchStart('child1')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={() => handleClick('child1')}
        >
          <ImageWithEdit
            imageKey="profile_child1"
            fallbackEmoji="👦"
            size={100}
            sizeCSS={imgSize}
            shape="circle"
            label="형"
            passthrough
            style={{ border: '3px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
          <span>형</span>
        </button>

        {/* 동생 버튼 */}
        <button
          style={btnStyle('#F7D5E0', '#8A2C5F', 'child2')}
          onMouseEnter={() => setHovered('child2')}
          onMouseLeave={() => setHovered(null)}
          onTouchStart={() => handleTouchStart('child2')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={() => handleClick('child2')}
        >
          <ImageWithEdit
            imageKey="profile_child2"
            fallbackEmoji="👧"
            size={100}
            sizeCSS={imgSize}
            shape="circle"
            label="동생"
            passthrough
            style={{ border: '3px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
          <span>동생</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* Long press modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowModal(null)}>
          <div style={{
            backgroundColor: '#FFF9F0', borderRadius: 28, padding: '4vh 4vw',
            width: 'min(80vw, 360px)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5vh',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 'min(3vw, 24px)', fontWeight: 'bold', color: '#5D4E37' }}>
              {showModal === 'child1' ? '형' : '동생'} 사진을 바꿀까요?
            </div>
            <div style={{ display: 'flex', gap: '2vw', width: '100%' }}>
              <button style={{
                flex: 1, height: 80, borderRadius: 20, border: 'none',
                backgroundColor: '#E0D5C7', color: '#5D4E37', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', cursor: 'pointer',
              }} onClick={() => setShowModal(null)}>취소</button>
              <button style={{
                flex: 1, height: 80, borderRadius: 20, border: 'none',
                backgroundColor: '#BBDEFB', color: '#1565C0', fontSize: 'min(2.5vw, 22px)', fontWeight: 'bold', cursor: 'pointer',
              }} onClick={handleChangePhoto}>바꾸기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
