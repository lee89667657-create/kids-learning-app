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
    padding: 32,
    width: 340,
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D4E37',
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: 16,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#E0D5C7',
    color: '#5D4E37',
    fontSize: 22,
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
    fontSize: 22,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
    padding: '16px 32px',
    borderRadius: 20,
    fontSize: 22,
    fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 300,
    transition: 'opacity 0.3s ease',
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

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

/**
 * ImageWithEdit - 길게 누르면 사진 교체 가능한 이미지/이모지 컴포넌트
 *
 * @param {string} imageKey - localStorage 키
 * @param {string} fallbackEmoji - 이미지 없을 때 표시할 이모지
 * @param {number} size - 이미지 크기 (px)
 * @param {'circle'|'square'} shape - 모양
 * @param {string} label - 확인창에 표시할 이름 (예: "형", "엄마")
 * @param {function} onImageChange - 이미지 변경 후 콜백
 * @param {object} style - 추가 스타일
 */
export default function ImageWithEdit({
  imageKey,
  fallbackEmoji,
  size = 80,
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
  const didLongPress = useRef(false);

  // Sync if imageKey changes
  useEffect(() => {
    setCustomImg(getCustomImage(imageKey));
  }, [imageKey]);

  const borderRadius = shape === 'circle' ? size / 2 : 12;

  function startPress(e) {
    // Prevent text selection on long press
    e.preventDefault();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowModal(true);
    }, 3000);
  }

  function endPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function cancelPress() {
    endPress();
  }

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
    // Reset so same file can be selected again
    e.target.value = '';
  }

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: 'default',
    touchAction: 'manipulation',
    ...style,
  };

  return (
    <>
      <div
        style={containerStyle}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        {customImg ? (
          <img
            src={customImg}
            alt={label}
            style={{
              width: size,
              height: size,
              borderRadius,
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        ) : (
          <span style={{ fontSize: size * 0.6, lineHeight: 1, pointerEvents: 'none' }}>
            {fallbackEmoji}
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showModal && (
        <div style={modalStyles.overlay} onClick={() => setShowModal(false)}>
          <div style={modalStyles.box} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.title}>
              {label} 사진을 바꿀까요?
            </div>
            <div style={modalStyles.btnRow}>
              <button style={modalStyles.cancelBtn} onClick={() => setShowModal(false)}>
                취소
              </button>
              <button style={modalStyles.changeBtn} onClick={handleChangeClick}>
                바꾸기
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div style={modalStyles.toast}>
          바뀌었어요!
        </div>
      )}
    </>
  );
}
