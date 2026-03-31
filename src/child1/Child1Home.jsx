import { useState } from 'react';

const activities = [
  { id: 'number', emoji: '🔢', label: '숫자놀이', color: '#C8E6C9' },
  { id: 'sound', emoji: '🎵', label: '소리패턴', color: '#BBDEFB' },
  { id: 'word', emoji: '🗣️', label: '단어 듣기', color: '#FFE0B2' },
  { id: 'stroke', emoji: '✏️', label: '한글 쓰기', color: '#E1BEE7' },
];

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
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5D4E37',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    maxWidth: 460,
    width: '100%',
  },
  card: {
    borderRadius: 28,
    border: 'none',
    padding: 28,
    fontSize: 28,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 160,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  cardEmoji: {
    fontSize: 52,
  },
  manageBtn: {
    marginTop: 32,
    padding: '10px 20px',
    borderRadius: 16,
    border: '2px solid #D4C5B0',
    backgroundColor: '#FFF3E0',
    fontSize: 16,
    color: '#7A6B5D',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default function Child1Home({ onNavigate, onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={styles.title}>뭐 할까?</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={styles.grid}>
        {activities.map((act) => (
          <button
            key={act.id}
            style={{
              ...styles.card,
              backgroundColor: act.color,
              color: '#3E3E3E',
              transform: hovered === act.id ? 'scale(1.04)' : 'scale(1)',
              boxShadow:
                hovered === act.id
                  ? '0 8px 24px rgba(0,0,0,0.15)'
                  : '0 4px 12px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={() => setHovered(act.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNavigate(act.id)}
          >
            <span style={styles.cardEmoji}>{act.emoji}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
      <button
        style={styles.manageBtn}
        onClick={() => onNavigate('wordManager')}
      >
        단어 관리
      </button>
    </div>
  );
}
