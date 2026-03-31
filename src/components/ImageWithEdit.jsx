import { useState, useRef, useEffect } from 'react';
import { saveCustomImage, getCustomImage } from '../utils/storage';

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  box: {
    backgroundColor: '#FFF9F0',
    borderRadius: 28,
    padding: '4vh 4vw',
    width: 'min(80vw, 360px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2.5vh',
  },
  title: {
    fontSize: 'min(3vw, 24px)',
    fontWeight: 'bold',
    color: '#5D4E37',
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: '2vw',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#E0D5C7',
    color: '#5D4E37',
    fontSize: 'min(2.5vw, 22px)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  changeBtn: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#BBDEFB',
    color: '#1565C0',
    fontSize: 'min(2.5vw, 22px)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: '5vh',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
    padding: '2vh 4vw',
    borderRadius: 20,
    fontSize: 'min(2.5vw, 22px)',
    fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 300,
  },
};

function resizeImage(file, maxBytes = 500 * 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxDim = 400;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > maxBytes * 1.37 && quality > 0.2) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageWithEdit({
  imageKey,
  fallbackEmoji,
  size = 80,
  sizeCSS,
  shape = 'square',
  label = '',
  onImageChange,
  style = {},
}) {
  const [customImg, setCustomImg] = useState(() => getCustomImage(imageKey));
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const pressTimer = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setCustomImg(getCustomImage(imageKey));
  }, [imageKey]);

  const dim = sizeCSS || `${size}px`;
  const borderRadius = shape === 'circle' ? '50%' : '12px';

  function handleChangeClick() {
    setShowModal(false);
    fileRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImage(file).then((base64) => {
      saveCustomImage(imageKey, base64);
      setCustomImg(base64);
      onImageChange?.();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    });
    e.target.value = '';
  }

  // Long press via touchstart/touchend — does NOT block click propagation
  function handleTouchStart() {
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      setShowModal(true);
    }, 3000);
  }

  function handleTouchEnd() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  return (
    <>
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          // pointerEvents pass through to parent — clicks bubble up
          pointerEvents: 'none',
          ...style,
        }}
      >
        {customImg ? (
          <img src={customImg} alt={label} style={{ width: '100%', height: '100%', borderRadius, objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />
        ) : (
          <span style={{ fontSize: `calc(${dim} * 0.6)`, lineHeight: 1, pointerEvents: 'none' }}>{fallbackEmoji}</span>
        )}
      </div>

      {/* Invisible overlay that captures long press via touch events only.
          touchstart/touchend do NOT prevent click from firing on the parent.
          On desktop, this overlay has pointerEvents:none so mouse clicks pass through. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Let mouse/pointer clicks pass through to parent button
          pointerEvents: 'none',
        }}
        // Touch events still fire even with pointerEvents:none on some browsers,
        // but we need a different approach. Use the parent's onTouchStart instead.
      />

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {showModal && (
        <div style={modalStyles.overlay} onClick={() => setShowModal(false)}>
          <div style={modalStyles.box} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.title}>{label} 사진을 바꿀까요?</div>
            <div style={modalStyles.btnRow}>
              <button style={modalStyles.cancelBtn} onClick={() => setShowModal(false)}>취소</button>
              <button style={modalStyles.changeBtn} onClick={handleChangeClick}>바꾸기</button>
            </div>
          </div>
        </div>
      )}

      {showToast && <div style={modalStyles.toast}>바뀌었어요!</div>}
    </>
  );
}

// Hook for parent components to add long-press behavior
export function useLongPress(callback, delay = 3000) {
  const timer = useRef(null);

  function onTouchStart() {
    timer.current = setTimeout(() => {
      timer.current = null;
      callback();
    }, delay);
  }

  function onTouchEnd() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return { onTouchStart, onTouchEnd, onTouchCancel: onTouchEnd };
}
