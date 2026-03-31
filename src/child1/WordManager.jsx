import { useState, useEffect } from 'react';
import { categories, getAllWords } from '../data/words';
import {
  saveCustomImage,
  getCustomImage,
  deleteCustomImage,
  getAllCustomImages,
  addCustomWord,
  deleteCustomWord,
  updateCustomWord,
  getCustomWords,
} from '../utils/storage';

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
    maxWidth: 600,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  catRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
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
  },
  catBtnActive: {
    backgroundColor: '#FFE0B2',
    borderColor: '#FFA726',
  },
  wordList: {
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  wordCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  wordImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    objectFit: 'cover',
    border: '2px solid #E0D5C7',
  },
  wordEmoji: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    border: '2px solid #E0D5C7',
    flexShrink: 0,
  },
  wordInfo: {
    flex: 1,
    minWidth: 100,
  },
  wordName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  wordSound: {
    fontSize: 16,
    color: '#7A6B5D',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallBtn: {
    padding: '8px 14px',
    borderRadius: 12,
    border: 'none',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  uploadBtn: {
    backgroundColor: '#BBDEFB',
    color: '#1565C0',
  },
  deleteBtn: {
    backgroundColor: '#FFCDD2',
    color: '#C62828',
  },
  editBtn: {
    backgroundColor: '#E1BEE7',
    color: '#6A1B9A',
  },
  removeImgBtn: {
    backgroundColor: '#FFE0B2',
    color: '#E65100',
  },
  addSection: {
    width: '100%',
    maxWidth: 600,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  addTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4E37',
    marginBottom: 16,
  },
  formRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '2px solid #D4C5B0',
    fontSize: 18,
    backgroundColor: '#FFFEF9',
    color: '#5D4E37',
    outline: 'none',
    flex: 1,
    minWidth: 80,
  },
  addBtn: {
    padding: '12px 28px',
    borderRadius: 16,
    border: 'none',
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  editModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  editBox: {
    backgroundColor: '#FFF9F0',
    borderRadius: 24,
    padding: 28,
    width: 360,
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  editLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4E37',
    marginBottom: 6,
    display: 'block',
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
        // Scale down if too large
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
        // Reduce quality if still too large
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

export default function WordManager({ onBack }) {
  const [category, setCategory] = useState('가족');
  const [wordList, setWordList] = useState([]);
  const [images, setImages] = useState({});
  const [editing, setEditing] = useState(null); // { word, newWord, newSound, newEmoji }
  const [newWord, setNewWord] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newSound, setNewSound] = useState('');

  function refresh() {
    setWordList(getAllWords().filter((w) => w.category === category));
    setImages(getAllCustomImages());
  }

  useEffect(() => {
    refresh();
  }, [category]);

  function handleUpload(wordId, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImage(file).then((base64) => {
      saveCustomImage(wordId, base64);
      refresh();
    });
  }

  function handleRemoveImage(wordId) {
    deleteCustomImage(wordId);
    refresh();
  }

  function handleDelete(word) {
    deleteCustomWord(word.word);
    refresh();
  }

  function handleAdd() {
    if (!newWord.trim()) return;
    addCustomWord(category, {
      word: newWord.trim(),
      emoji: newEmoji.trim() || '📝',
      sound: newSound.trim() || newWord.trim(),
      image: null,
    });
    setNewWord('');
    setNewEmoji('');
    setNewSound('');
    refresh();
  }

  function openEdit(word) {
    setEditing({
      original: word.word,
      newWord: word.word,
      newSound: word.sound,
      newEmoji: word.emoji,
      isCustom: !!word._custom,
    });
  }

  function saveEdit() {
    if (!editing) return;
    if (editing.isCustom) {
      updateCustomWord(editing.original, {
        word: editing.newWord,
        sound: editing.newSound,
        emoji: editing.newEmoji,
      });
    } else {
      // For builtin words, save as custom override
      const builtinWord = wordList.find((w) => w.word === editing.original);
      if (builtinWord) {
        addCustomWord(category, {
          ...builtinWord,
          word: editing.newWord,
          sound: editing.newSound,
          emoji: editing.newEmoji,
        });
      }
    }
    setEditing(null);
    refresh();
  }

  function speakWord(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={styles.title}>단어 관리</div>
        <div style={{ width: 60 }} />
      </div>

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

      <div style={styles.wordList}>
        {wordList.map((w) => {
          const customImg = images[w.word];
          return (
            <div key={w.word} style={styles.wordCard}>
              {customImg ? (
                <img src={customImg} alt={w.word} style={styles.wordImage} />
              ) : (
                <div style={styles.wordEmoji}>{w.emoji}</div>
              )}
              <div style={styles.wordInfo}>
                <div style={styles.wordName}>{w.word}</div>
                <div style={styles.wordSound}>소리: {w.sound}</div>
              </div>
              <div style={styles.actions}>
                <button
                  style={{ ...styles.smallBtn, ...styles.uploadBtn }}
                  onClick={() => document.getElementById(`file-${w.word}`).click()}
                >
                  사진
                </button>
                <input
                  id={`file-${w.word}`}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUpload(w.word, e)}
                />
                {customImg && (
                  <button
                    style={{ ...styles.smallBtn, ...styles.removeImgBtn }}
                    onClick={() => handleRemoveImage(w.word)}
                  >
                    사진 삭제
                  </button>
                )}
                <button
                  style={{ ...styles.smallBtn, ...styles.editBtn }}
                  onClick={() => openEdit(w)}
                >
                  수정
                </button>
                <button
                  style={{ ...styles.smallBtn, backgroundColor: '#E3F2FD', color: '#1565C0' }}
                  onClick={() => speakWord(w.sound)}
                >
                  🔊
                </button>
                {w._custom && (
                  <button
                    style={{ ...styles.smallBtn, ...styles.deleteBtn }}
                    onClick={() => handleDelete(w)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new word */}
      <div style={styles.addSection}>
        <div style={styles.addTitle}>새 단어 추가</div>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="단어"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <input
            style={{ ...styles.input, maxWidth: 80 }}
            placeholder="이모지"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
          />
        </div>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="소리 (TTS 텍스트)"
            value={newSound}
            onChange={(e) => setNewSound(e.target.value)}
          />
          <button style={styles.addBtn} onClick={handleAdd}>
            추가
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={styles.editModal} onClick={() => setEditing(null)}>
          <div style={styles.editBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#5D4E37', marginBottom: 20 }}>
              단어 수정
            </div>
            <label style={styles.editLabel}>단어</label>
            <input
              style={{ ...styles.input, width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
              value={editing.newWord}
              onChange={(e) => setEditing({ ...editing, newWord: e.target.value })}
            />
            <label style={styles.editLabel}>소리 (TTS)</label>
            <input
              style={{ ...styles.input, width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
              value={editing.newSound}
              onChange={(e) => setEditing({ ...editing, newSound: e.target.value })}
            />
            <label style={styles.editLabel}>이모지</label>
            <input
              style={{ ...styles.input, width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
              value={editing.newEmoji}
              onChange={(e) => setEditing({ ...editing, newEmoji: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={{ ...styles.smallBtn, backgroundColor: '#FFCDD2', color: '#C62828', padding: '10px 24px', fontSize: 18 }}
                onClick={() => setEditing(null)}
              >
                취소
              </button>
              <button
                style={{ ...styles.smallBtn, backgroundColor: '#C8E6C9', color: '#2E7D32', padding: '10px 24px', fontSize: 18 }}
                onClick={saveEdit}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
