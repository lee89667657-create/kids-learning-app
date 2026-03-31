import { useState } from 'react';

const activities = [
  { id: 'number', emoji: '🔢', label: '숫자놀이', color: '#C8E6C9' },
  { id: 'sound', emoji: '🎵', label: '소리패턴', color: '#BBDEFB' },
  { id: 'word', emoji: '🗣️', label: '단어 듣기', color: '#FFE0B2' },
  { id: 'stroke', emoji: '✏️', label: '한글 쓰기', color: '#E1BEE7' },
  { id: 'handPoint', emoji: '✋', label: '손으로 맞추기', color: '#B2EBF2' },
];

export default function Child1Home({ onNavigate, onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FFF9F0',
      padding: '2vh 3vw',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2vh',
        flexShrink: 0,
      }}>
        <button style={{
          fontSize: 'min(3vw, 28px)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '1vh 1vw',
          borderRadius: 16,
          color: '#5D4E37',
        }} onClick={onBack}>
          ← 뒤로
        </button>
        <div style={{ fontSize: 'min(4vw, 36px)', fontWeight: 'bold', color: '#5D4E37' }}>
          뭐 할까?
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        gap: '1.5vh 2vw',
        maxWidth: '90vw',
        margin: '0 auto',
        width: '100%',
      }}>
        {activities.map((act) => (
          <button
            key={act.id}
            style={{
              borderRadius: 'min(3vw, 28px)',
              border: 'none',
              fontSize: 'min(2.8vw, 26px)',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1vh',
              backgroundColor: act.color,
              color: '#3E3E3E',
              transform: hovered === act.id ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hovered === act.id ? '0 8px 24px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={() => setHovered(act.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNavigate(act.id)}
          >
            <span style={{ fontSize: 'min(6vw, 44px)' }}>{act.emoji}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>

      <button
        style={{
          marginTop: '1vh',
          padding: '0.8vh 2vw',
          borderRadius: 16,
          border: '2px solid #D4C5B0',
          backgroundColor: '#FFF3E0',
          fontSize: 'min(1.8vw, 14px)',
          color: '#7A6B5D',
          cursor: 'pointer',
          alignSelf: 'center',
          flexShrink: 0,
        }}
        onClick={() => onNavigate('wordManager')}
      >
        단어 관리
      </button>
    </div>
  );
}
