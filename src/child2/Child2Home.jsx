import { useState, useEffect } from 'react';
import { startBGM, stopBGM } from './utils/bgm';
import MuteButton from './utils/MuteButton';

const activities = [
  { id: 'shadow', emoji: '🐾', label: '그림자 맞추기', color: '#F8BBD0' },
  { id: 'compare', emoji: '📏', label: '길이 비교', color: '#B3E5FC' },
  { id: 'path', emoji: '〰️', label: '길 이어주기', color: '#FFF9C4' },
  { id: 'pack', emoji: '🎒', label: '가방 채우기', color: '#C8E6C9' },
];

export default function Child2Home({ onNavigate, onBack }) {
  const [hovered, setHovered] = useState(null);

  useEffect(() => { startBGM(); return () => stopBGM(); }, []);

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0',
      padding: '2vh 3vw',
      overflow: 'hidden',
    }}>
      <MuteButton />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2vh', flexShrink: 0,
      }}>
        <button style={{
          fontSize: '3vw', background: 'none', border: 'none',
          cursor: 'pointer', padding: '2vw', borderRadius: '2vw', color: '#5D4E37',
        }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: '5vw', fontWeight: 'bold', color: '#5D4E37' }}>
          뭐 할까?
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '2vw',
        maxWidth: '90vw',
        margin: '0 auto',
        width: '100%',
      }}>
        {activities.map((act) => (
          <button
            key={act.id}
            style={{
              width: '42vw',
              height: '38vh',
              borderRadius: '2vw',
              border: 'none',
              fontSize: '3.5vw',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2vw',
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
            <span style={{ fontSize: '8vw' }}>{act.emoji}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
