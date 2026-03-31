import { useState } from 'react';

const activities = [
  { id: 'compare', emoji: '📏', label: '길이 비교', color: '#BBDEFB' },
  { id: 'shadow', emoji: '🐾', label: '그림자 맞추기', color: '#C8E6C9' },
  { id: 'path', emoji: '〰️', label: '길 이어주기', color: '#FFE0B2' },
  { id: 'pack', emoji: '🎒', label: '가방 채우기', color: '#F3E5F5' },
];

export default function Child2Home({ onNavigate, onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      height: '100vh',
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
        gridTemplateRows: '1fr 1fr',
        gap: '2vh 2vw',
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
              fontSize: 'min(3.5vw, 30px)',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5vh',
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
            <span style={{ fontSize: 'min(8vw, 60px)' }}>{act.emoji}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
